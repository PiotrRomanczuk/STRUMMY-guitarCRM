#!/usr/bin/env tsx
/**
 * Smoke test for the Strummy MCP server.
 *
 * Exercises every tool (Groups 1–2) against the configured Supabase. The point
 * is to catch *schema drift*: if a column gets renamed in the database, this
 * fails loudly. It does not validate semantics.
 *
 * Run: `npm run smoke` from mcp/strummy-server/
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  lessonPlanContext,
  practiceScheduleContext,
  progressSnapshotContext,
} from '../src/tools/generative.js';
import { getOverview, lessonTrends } from '../src/tools/insights.js';
import { getLesson, getUpcomingLessons, listLessons } from '../src/tools/lessons.js';
import { getPracticeLog, getPracticeSummary } from '../src/tools/practice.js';
import { findSongs, getSong, songOfTheWeek } from '../src/tools/songs.js';
import {
  getRepertoire,
  getStudent,
  getStudentActivity,
  listStudents,
} from '../src/tools/students.js';

// ---- env loading -----------------------------------------------------------
// Tiny .env loader, no dependency. Skip if file missing — values may already
// be in the shell.
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && m[1] && m[2] !== undefined && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (in shell or .env).');
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
type Check = { name: string; ok: boolean; detail?: string };

function textOf(result: CallToolResult): string {
  const first = result.content?.[0];
  return first && first.type === 'text' ? (first as { text: string }).text : '';
}

function check(name: string, result: CallToolResult, requiredKeys: string[]): Check {
  if (result.isError) {
    return { name, ok: false, detail: `tool returned error: ${textOf(result)}` };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(textOf(result));
  } catch {
    return { name, ok: false, detail: 'response was not JSON' };
  }
  const missing = requiredKeys.filter((k) => !(k in parsed));
  return missing.length > 0
    ? { name, ok: false, detail: `missing keys: ${missing.join(', ')}` }
    : { name, ok: true };
}

// ---- main ------------------------------------------------------------------
const checks: Check[] = [];

const list = await listStudents({ status: 'active', limit: 5 });
checks.push(check('strummy_list_students', list, ['count', 'students']));

// Exercise a non-default enum value too — guards against the kind of drift
// that originally caused issue #322 (enum value referenced in code didn't
// exist in the DB; smoke only ran the default and never noticed).
const archived = await listStudents({ status: 'archived', limit: 3 });
checks.push(check('strummy_list_students(archived)', archived, ['count', 'students']));

const listText = textOf(list);
const students = (JSON.parse(listText) as { students: Array<{ id: string }> }).students;

if (students.length === 0) {
  console.log('⚠ No active students in DB. Skipping per-student tools.');
  console.log('  If running against local Supabase, run `npm run seed` in the parent project.');
} else {
  const first = students[0]!;
  const [student, activity, rep] = await Promise.all([
    getStudent({ id: first.id }),
    getStudentActivity({
      student_id: first.id,
      since_days: 30,
      limit: 20,
    }),
    getRepertoire({ student_id: first.id, only_active: true }),
  ]);

  checks.push(
    check('strummy_get_student', student, [
      'profile',
      'last_completed_lesson',
      'next_scheduled_lesson',
      'repertoire_summary',
    ])
  );
  checks.push(
    check('strummy_get_student_activity', activity, ['student_id', 'lessons', 'practice_sessions'])
  );
  checks.push(check('strummy_get_repertoire', rep, ['student_id', 'count', 'repertoire']));
}

// ---- Group 2: Lessons ------------------------------------------------------

const upcoming = await getUpcomingLessons({ days: 30, limit: 10 });
checks.push(
  check('strummy_get_upcoming_lessons', upcoming, ['window_days', 'horizon', 'count', 'lessons'])
);

const recent = await listLessons({ status: 'COMPLETED', limit: 5 });
checks.push(check('strummy_list_lessons', recent, ['filters', 'count', 'lessons']));

const recentText = textOf(recent);
const recentLessons = (JSON.parse(recentText) as { lessons: Array<{ id: string }> }).lessons;

if (recentLessons.length === 0) {
  console.log('⚠ No completed lessons in DB. Skipping strummy_get_lesson.');
} else {
  const lessonId = recentLessons[0]!.id;
  const lesson = await getLesson({ id: lessonId });
  checks.push(check('strummy_get_lesson', lesson, ['lesson', 'songs', 'song_count']));
}

// ---- Group 3: Songs catalog ------------------------------------------------

const songs = await findSongs({
  level: 'beginner',
  recorded_only: false,
  include_drafts: false,
  limit: 5,
});
checks.push(check('strummy_find_songs', songs, ['filters', 'count', 'songs']));

const songsText = textOf(songs);
const foundSongs = (JSON.parse(songsText) as { songs: Array<{ id: string }> }).songs;

if (foundSongs.length === 0) {
  console.log('⚠ No beginner songs found. Skipping strummy_get_song.');
} else {
  const song = await getSong({ id: foundSongs[0]!.id });
  checks.push(
    check('strummy_get_song', song, ['song', 'chords_array', 'videos', 'students_learning_count'])
  );
}

const sotw = await songOfTheWeek({ include_history: true, limit: 3 });
checks.push(check('strummy_song_of_the_week', sotw, ['today', 'current', 'history']));

// ---- Group 4: Practice & feedback ------------------------------------------

if (students.length === 0) {
  console.log('⚠ No active students in DB. Skipping practice tools.');
} else {
  const sid = students[0]!.id;
  const [log, summary] = await Promise.all([
    getPracticeLog({ student_id: sid, since_days: 90, limit: 20 }),
    getPracticeSummary({ student_id: sid, since_days: 90, top_n: 5 }),
  ]);
  checks.push(
    check('strummy_get_practice_log', log, [
      'student_id',
      'window_days',
      'session_count',
      'total_minutes',
      'sessions',
    ])
  );
  checks.push(
    check('strummy_get_practice_summary', summary, [
      'student_id',
      'window_days',
      'session_count',
      'total_minutes',
      'distinct_days',
      'distinct_songs',
      'avg_minutes_per_session',
      'top_songs',
    ])
  );
}

// ---- Group 5: Insights -----------------------------------------------------

const overview = await getOverview({ since_days: 30 });
checks.push(
  check('strummy_get_overview', overview, [
    'window_days',
    'students',
    'lessons_in_window',
    'catalog',
    'repertoire',
  ])
);

const trends = await lessonTrends({ months: 6 });
checks.push(check('strummy_lesson_trends', trends, ['months_window', 'months']));

// ---- Group 6: Generative context ------------------------------------------

if (students.length === 0) {
  console.log('⚠ No active students in DB. Skipping generative context tools.');
} else {
  const sid = students[0]!.id;
  const [planCtx, snapCtx, schedCtx] = await Promise.all([
    lessonPlanContext({ student_id: sid, duration_min: 30 }),
    progressSnapshotContext({ student_id: sid, range_days: 30 }),
    practiceScheduleContext({ student_id: sid, days_per_week: 5 }),
  ]);
  checks.push(
    check('strummy_lesson_plan_context', planCtx, [
      'duration_min',
      'student',
      'last_completed_lessons',
      'practice_last_7d',
      'repertoire',
    ])
  );
  checks.push(
    check('strummy_progress_snapshot_context', snapCtx, [
      'range',
      'student',
      'lesson_summary',
      'practice_summary',
      'repertoire_changes',
    ])
  );
  checks.push(
    check('strummy_practice_schedule_context', schedCtx, [
      'days_per_week',
      'student',
      'active_repertoire_total',
      'buckets',
      'recent_focus',
      'suggested_distribution',
    ])
  );
}

let pass = 0;
let fail = 0;
for (const c of checks) {
  if (c.ok) {
    console.log(`✓ ${c.name}`);
    pass++;
  } else {
    console.error(`✗ ${c.name}`);
    if (c.detail) console.error(`  → ${c.detail}`);
    fail++;
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

/**
 * Group 6 — Generative context tools.
 *
 * These tools do NOT call an LLM. They bundle the data an agent needs to
 * produce a lesson plan / progress snapshot / practice schedule in a single
 * roundtrip, encoding the *recipe* (which fields matter, sensible defaults).
 * The calling agent (Claude Desktop, Cursor, etc.) does the synthesis.
 */
import { z } from 'zod';
import { fail, ok } from '../format.js';
import { getSupabase } from '../supabase.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

export const lessonPlanContextInput = z.object({
  student_id: z.string().uuid(),
  duration_min: z.number().int().min(15).max(180).default(30),
  focus: z.string().min(1).max(200).optional(),
});

export const progressSnapshotContextInput = z.object({
  student_id: z.string().uuid(),
  range_days: z.number().int().min(7).max(180).default(30),
});

export const practiceScheduleContextInput = z.object({
  student_id: z.string().uuid(),
  days_per_week: z.number().int().min(1).max(7).default(5),
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sinceISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const PROFILE_COLUMNS = 'id, email, full_name, student_status, status_changed_at, created_at';

const REPERTOIRE_COLUMNS =
  'id, song_id, current_status, priority, self_rating, self_rating_updated_at, ' +
  'total_practice_minutes, last_practiced_at, started_at, mastered_at, ' +
  'songs:song_id ( id, title, author, level )';

type RepertoireRow = {
  id: string;
  song_id: string;
  current_status: string;
  priority: string;
  self_rating: number | null;
  total_practice_minutes: number;
  last_practiced_at: string | null;
  started_at: string | null;
  mastered_at: string | null;
  songs?: { id: string; title: string; author: string | null; level: string | null } | null;
};

// ----------------------------------------------------------------------------
// lesson_plan_context
// ----------------------------------------------------------------------------

export async function lessonPlanContext(input: z.infer<typeof lessonPlanContextInput>) {
  const sb = getSupabase();

  const [profile, lessons, repertoire, practice] = await Promise.all([
    sb.from('profiles').select(PROFILE_COLUMNS).eq('id', input.student_id).maybeSingle(),
    sb
      .from('lessons')
      .select('id, scheduled_at, status, notes, title')
      .eq('student_id', input.student_id)
      .eq('status', 'COMPLETED')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(3),
    sb
      .from('student_repertoire')
      .select(REPERTOIRE_COLUMNS)
      .eq('student_id', input.student_id)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('last_practiced_at', { ascending: false, nullsFirst: false })
      .limit(30),
    sb
      .from('practice_sessions')
      .select('id, song_id, duration_minutes, created_at')
      .eq('student_id', input.student_id)
      .gte('created_at', sinceISO(7))
      .order('created_at', { ascending: false }),
  ]);

  if (profile.error) return fail('Failed to fetch profile', profile.error.message);
  if (!profile.data) return fail('Student not found');
  if (lessons.error) return fail('Failed to fetch lessons', lessons.error.message);
  if (repertoire.error) return fail('Failed to fetch repertoire', repertoire.error.message);
  if (practice.error) return fail('Failed to fetch practice', practice.error.message);

  const rep = (repertoire.data ?? []) as unknown as RepertoireRow[];
  const plateaued = rep.filter(
    (r) =>
      r.current_status !== 'mastered' && r.total_practice_minutes >= 60 && (r.self_rating ?? 5) <= 3
  );
  const recentlyStarted = rep.filter((r) => r.current_status === 'started');
  const ready = rep.filter((r) => r.current_status === 'with_author');

  const practiceMinutes = (practice.data ?? []).reduce(
    (acc, p) => acc + (p.duration_minutes ?? 0),
    0
  );

  return ok({
    duration_min: input.duration_min,
    focus: input.focus ?? null,
    student: profile.data,
    last_completed_lessons: lessons.data ?? [],
    practice_last_7d: {
      session_count: practice.data?.length ?? 0,
      total_minutes: practiceMinutes,
    },
    repertoire: {
      total_active: rep.length,
      plateaued,
      ready_to_master: ready,
      recently_started: recentlyStarted,
    },
  });
}

// ----------------------------------------------------------------------------
// progress_snapshot_context
// ----------------------------------------------------------------------------

export async function progressSnapshotContext(input: z.infer<typeof progressSnapshotContextInput>) {
  const sb = getSupabase();
  const since = sinceISO(input.range_days);

  const [profile, lessons, practice, masteredInRange, startedInRange] = await Promise.all([
    sb.from('profiles').select(PROFILE_COLUMNS).eq('id', input.student_id).maybeSingle(),
    sb
      .from('lessons')
      .select('id, status, scheduled_at')
      .eq('student_id', input.student_id)
      .gte('scheduled_at', since)
      .is('deleted_at', null),
    sb
      .from('practice_sessions')
      .select('id, song_id, duration_minutes, created_at, songs:song_id ( id, title, author )')
      .eq('student_id', input.student_id)
      .gte('created_at', since),
    sb
      .from('student_repertoire')
      .select('id, mastered_at, songs:song_id ( id, title, author )')
      .eq('student_id', input.student_id)
      .gte('mastered_at', since),
    sb
      .from('student_repertoire')
      .select('id, started_at, songs:song_id ( id, title, author )')
      .eq('student_id', input.student_id)
      .gte('started_at', since),
  ]);

  if (profile.error) return fail('Failed to fetch profile', profile.error.message);
  if (!profile.data) return fail('Student not found');
  if (lessons.error) return fail('Failed to fetch lessons', lessons.error.message);
  if (practice.error) return fail('Failed to fetch practice', practice.error.message);
  if (masteredInRange.error)
    return fail('Failed to fetch mastered repertoire', masteredInRange.error.message);
  if (startedInRange.error)
    return fail('Failed to fetch started repertoire', startedInRange.error.message);

  const ls = lessons.data ?? [];
  type LessonRow = { id: string; status: string; scheduled_at: string };
  const completed = (ls as LessonRow[]).filter((l) => l.status === 'COMPLETED').length;
  const cancelled = (ls as LessonRow[]).filter((l) => l.status === 'CANCELLED').length;
  const scheduled = (ls as LessonRow[]).filter((l) => l.status === 'SCHEDULED').length;

  type PracticeRow = {
    duration_minutes: number | null;
    created_at: string;
    songs?: { id: string; title: string; author: string | null } | null;
  };
  const ps = (practice.data ?? []) as unknown as PracticeRow[];
  const totalMinutes = ps.reduce((acc, p) => acc + (p.duration_minutes ?? 0), 0);
  const distinctDays = new Set(ps.map((p) => p.created_at.slice(0, 10))).size;

  return ok({
    range: { since_days: input.range_days, since },
    student: profile.data,
    lesson_summary: { completed, scheduled, cancelled, total: ls.length },
    practice_summary: {
      session_count: ps.length,
      total_minutes: totalMinutes,
      distinct_days: distinctDays,
      avg_minutes_per_session: ps.length > 0 ? Math.round(totalMinutes / ps.length) : 0,
    },
    repertoire_changes: {
      mastered_in_range: masteredInRange.data ?? [],
      started_in_range: startedInRange.data ?? [],
    },
  });
}

// ----------------------------------------------------------------------------
// practice_schedule_context
// ----------------------------------------------------------------------------

export async function practiceScheduleContext(input: z.infer<typeof practiceScheduleContextInput>) {
  const sb = getSupabase();

  const [profile, repertoire, recent] = await Promise.all([
    sb.from('profiles').select(PROFILE_COLUMNS).eq('id', input.student_id).maybeSingle(),
    sb
      .from('student_repertoire')
      .select(REPERTOIRE_COLUMNS)
      .eq('student_id', input.student_id)
      .eq('is_active', true)
      .order('priority', { ascending: true }),
    sb
      .from('practice_sessions')
      .select('song_id, duration_minutes')
      .eq('student_id', input.student_id)
      .gte('created_at', sinceISO(7)),
  ]);

  if (profile.error) return fail('Failed to fetch profile', profile.error.message);
  if (!profile.data) return fail('Student not found');
  if (repertoire.error) return fail('Failed to fetch repertoire', repertoire.error.message);
  if (recent.error) return fail('Failed to fetch recent practice', recent.error.message);

  const rep = (repertoire.data ?? []) as unknown as RepertoireRow[];

  const minutesBySong = new Map<string, number>();
  for (const r of recent.data ?? []) {
    const sid = (r as { song_id: string | null }).song_id;
    const min = (r as { duration_minutes: number | null }).duration_minutes ?? 0;
    if (sid) minutesBySong.set(sid, (minutesBySong.get(sid) ?? 0) + min);
  }

  const buckets = {
    plateaued: rep.filter(
      (r) =>
        r.current_status !== 'mastered' &&
        r.total_practice_minutes >= 60 &&
        (r.self_rating ?? 5) <= 3
    ),
    in_progress: rep.filter(
      (r) => r.current_status === 'started' || r.current_status === 'remembered'
    ),
    review: rep.filter(
      (r) => r.current_status === 'with_author' || r.current_status === 'mastered'
    ),
  };

  return ok({
    days_per_week: input.days_per_week,
    student: profile.data,
    active_repertoire_total: rep.length,
    buckets,
    recent_focus: [...minutesBySong.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([song_id, minutes]) => ({ song_id, minutes_last_7d: minutes })),
    suggested_distribution: {
      plateaued_pct: 40,
      in_progress_pct: 40,
      review_pct: 20,
    },
  });
}

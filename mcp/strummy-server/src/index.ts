#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  getLesson,
  getLessonInput,
  getUpcomingLessons,
  getUpcomingLessonsInput,
  listLessons,
  listLessonsInput,
} from './tools/lessons.js';
import {
  lessonPlanContext,
  lessonPlanContextInput,
  practiceScheduleContext,
  practiceScheduleContextInput,
  progressSnapshotContext,
  progressSnapshotContextInput,
} from './tools/generative.js';
import {
  getOverview,
  getOverviewInput,
  lessonTrends,
  lessonTrendsInput,
} from './tools/insights.js';
import {
  getPracticeLog,
  getPracticeLogInput,
  getPracticeSummary,
  getPracticeSummaryInput,
} from './tools/practice.js';
import {
  findSongs,
  findSongsInput,
  getSong,
  getSongInput,
  songOfTheWeek,
  songOfTheWeekInput,
} from './tools/songs.js';
import {
  getRepertoire,
  getRepertoireInput,
  getStudent,
  getStudentActivity,
  getStudentActivityInput,
  getStudentInput,
  listStudents,
  listStudentsInput,
} from './tools/students.js';

const server = new McpServer({
  name: 'strummy',
  version: '0.1.0',
});

// ----------------------------------------------------------------------------
// Group 1 — Students
// ----------------------------------------------------------------------------

server.registerTool(
  'strummy_get_student',
  {
    title: 'Get a student snapshot',
    description: [
      'Look up a single student by id, email, or name (one is required).',
      'Returns the profile plus a quick activity summary: last completed lesson,',
      'next scheduled lesson, and repertoire counts grouped by status.',
      'Use this as the entry point for any student-specific question.',
    ].join(' '),
    inputSchema: getStudentInput.shape,
  },
  async (input) => getStudent(getStudentInput.parse(input))
);

server.registerTool(
  'strummy_list_students',
  {
    title: 'List students',
    description: [
      "List students filtered by student_status. Default is 'active'.",
      "Pass status='all' to see every status (active, archived, lead, trial, churned).",
      'Sorted by most-recent status change first.',
    ].join(' '),
    inputSchema: listStudentsInput.shape,
  },
  async (input) => listStudents(listStudentsInput.parse(input))
);

server.registerTool(
  'strummy_get_student_activity',
  {
    title: "Get a student's recent activity",
    description: [
      'Return lessons and practice sessions for a student within a recent window',
      '(default 30 days). Useful before lesson prep or when answering',
      "'how is X doing lately?'. Use strummy_get_student first to find the id.",
    ].join(' '),
    inputSchema: getStudentActivityInput.shape,
  },
  async (input) => getStudentActivity(getStudentActivityInput.parse(input))
);

server.registerTool(
  'strummy_get_repertoire',
  {
    title: "Get a student's song repertoire",
    description: [
      'Return the songs assigned to a student with status, self-rating, last practice,',
      'and the joined song catalog row (title, author, level).',
      'Filter by status (to_learn / in_progress / review / mastered / paused) or priority.',
      'By default returns only active entries — pass only_active=false for the full history.',
    ].join(' '),
    inputSchema: getRepertoireInput.shape,
  },
  async (input) => getRepertoire(getRepertoireInput.parse(input))
);

// ----------------------------------------------------------------------------
// Group 2 — Lessons
// ----------------------------------------------------------------------------

server.registerTool(
  'strummy_get_lesson',
  {
    title: 'Get a lesson with songs',
    description: [
      'Fetch a single lesson by id. Returns the lesson detail (title, scheduled_at,',
      'status, notes, google_event_id) and every lesson_songs row joined to the',
      'song catalog (title, author, level). Use list_lessons or',
      'get_upcoming_lessons to find an id first.',
    ].join(' '),
    inputSchema: getLessonInput.shape,
  },
  async (input) => getLesson(getLessonInput.parse(input))
);

server.registerTool(
  'strummy_list_lessons',
  {
    title: 'List lessons (summaries only)',
    description: [
      'List lessons sorted by scheduled_at desc. Returns summary columns only',
      '(no notes body — keeps responses small). Filter by student_id, teacher_id,',
      'status, or a from/to ISO datetime range. Default limit 25.',
    ].join(' '),
    inputSchema: listLessonsInput.shape,
  },
  async (input) => listLessons(listLessonsInput.parse(input))
);

server.registerTool(
  'strummy_get_upcoming_lessons',
  {
    title: 'Get upcoming SCHEDULED lessons',
    description: [
      'Return SCHEDULED lessons within the next N days (default 7) across all',
      'students. Each row includes a small student summary (id, full_name, email).',
      "Useful for 'what's on this week?' style questions.",
    ].join(' '),
    inputSchema: getUpcomingLessonsInput.shape,
  },
  async (input) => getUpcomingLessons(getUpcomingLessonsInput.parse(input))
);

// ----------------------------------------------------------------------------
// Group 3 — Songs catalog
// ----------------------------------------------------------------------------

server.registerTool(
  'strummy_find_songs',
  {
    title: 'Search the song catalog',
    description: [
      'Search the song catalog. Filter by free-text query (matches title or',
      'author), level (beginner/intermediate/advanced), key, category, or by',
      'chords the song contains. Pass contains_chords=["D","G","Em"] to find',
      'songs that include all those chords. By default excludes drafts and',
      'returns up to 20 songs. Pass recorded_only=true for songs with a recording.',
    ].join(' '),
    inputSchema: findSongsInput.shape,
  },
  async (input) => findSongs(findSongsInput.parse(input))
);

server.registerTool(
  'strummy_get_song',
  {
    title: 'Get a song with detail and learning stats',
    description: [
      'Fetch a single song by id. Returns the full catalog row, a parsed chords',
      'array (split from the chords text), all attached song_videos, and a count',
      'of how many students currently have this song active in their repertoire.',
    ].join(' '),
    inputSchema: getSongInput.shape,
  },
  async (input) => getSong(getSongInput.parse(input))
);

server.registerTool(
  'strummy_song_of_the_week',
  {
    title: 'Get the current song of the week',
    description: [
      "Returns the currently active song-of-the-week (today's date falls within",
      'active_from/active_until and is_active=true). Pass include_history=true to',
      'also get the most recent past picks.',
    ].join(' '),
    inputSchema: songOfTheWeekInput.shape,
  },
  async (input) => songOfTheWeek(songOfTheWeekInput.parse(input))
);

// ----------------------------------------------------------------------------
// Group 4 — Practice & feedback
// ----------------------------------------------------------------------------

server.registerTool(
  'strummy_get_practice_log',
  {
    title: "Get a student's practice sessions",
    description: [
      'Fetch practice sessions for a student over a recent window (default 30 days),',
      'each joined to song title/author. Optionally filter to a single song.',
      'Returns sessions plus total minutes across the window.',
    ].join(' '),
    inputSchema: getPracticeLogInput.shape,
  },
  async (input) => getPracticeLog(getPracticeLogInput.parse(input))
);

server.registerTool(
  'strummy_get_practice_summary',
  {
    title: "Get a student's practice summary",
    description: [
      'Aggregate stats over a window (default 30 days): total minutes, session count,',
      'distinct days practiced, distinct songs, average minutes per session, and the',
      'top N songs by minutes (default 5). Useful for "how much has X practiced this',
      'month?" and "what have they focused on?".',
    ].join(' '),
    inputSchema: getPracticeSummaryInput.shape,
  },
  async (input) => getPracticeSummary(getPracticeSummaryInput.parse(input))
);

// ----------------------------------------------------------------------------
// Group 5 — Insights (agent-friendly summaries)
// ----------------------------------------------------------------------------

server.registerTool(
  'strummy_get_overview',
  {
    title: 'Get a top-line overview',
    description: [
      'Top-line counts for a recent window (default 30 days): students by status,',
      'lessons by status, published songs, repertoire mastery rate. Cheap to call —',
      'all counts run in parallel via head:true queries.',
    ].join(' '),
    inputSchema: getOverviewInput.shape,
  },
  async (input) => getOverview(getOverviewInput.parse(input))
);

server.registerTool(
  'strummy_lesson_trends',
  {
    title: 'Get monthly lesson trends',
    description: [
      'Lesson counts bucketed by month for the last N months (default 6, max 24).',
      'Each bucket reports completed / scheduled / cancelled / total. Useful for',
      '"are lessons trending up?" or "did anything weird happen in March?".',
      "Months with no lessons are still emitted with zeros so the timeline isn't ragged.",
    ].join(' '),
    inputSchema: lessonTrendsInput.shape,
  },
  async (input) => lessonTrends(lessonTrendsInput.parse(input))
);

// ----------------------------------------------------------------------------
// Group 6 — Generative context tools
// ----------------------------------------------------------------------------
//
// These bundle the inputs an agent needs to compose a lesson plan / progress
// snapshot / practice schedule in one roundtrip. They do NOT call an LLM —
// the calling agent does the synthesis.

server.registerTool(
  'strummy_lesson_plan_context',
  {
    title: 'Get context to compose a lesson plan',
    description: [
      'Bundle of inputs for composing a lesson plan: student profile, last 3',
      'completed lessons, active repertoire (priority + last_practiced ordering),',
      'plateaued songs (low rating + lots of practice + not mastered), songs ready',
      'to master (with_author), recently started songs, and last 7d practice totals.',
      'You compose the plan from this — no LLM call inside the tool.',
    ].join(' '),
    inputSchema: lessonPlanContextInput.shape,
  },
  async (input) => lessonPlanContext(lessonPlanContextInput.parse(input))
);

server.registerTool(
  'strummy_progress_snapshot_context',
  {
    title: 'Get context for a progress snapshot',
    description: [
      'Bundle of inputs for a parent-friendly progress snapshot over a window',
      '(default 30 days): student profile, lesson summary (completed/scheduled/',
      'cancelled), practice summary (sessions, minutes, distinct days), and',
      'repertoire changes in range (mastered_in_range, started_in_range).',
    ].join(' '),
    inputSchema: progressSnapshotContextInput.shape,
  },
  async (input) => progressSnapshotContext(progressSnapshotContextInput.parse(input))
);

server.registerTool(
  'strummy_practice_schedule_context',
  {
    title: 'Get context to compose a practice schedule',
    description: [
      'Bundle of inputs for a weekly practice schedule: student profile,',
      'all active repertoire bucketed into plateaued / in_progress / review,',
      'top 5 songs by practice minutes in the last 7 days, and a suggested',
      'time distribution. You compose the day-by-day schedule from this.',
    ].join(' '),
    inputSchema: practiceScheduleContextInput.shape,
  },
  async (input) => practiceScheduleContext(practiceScheduleContextInput.parse(input))
);

// ----------------------------------------------------------------------------
// Transport
// ----------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

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
// Transport
// ----------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

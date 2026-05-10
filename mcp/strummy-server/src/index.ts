#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
// Transport
// ----------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

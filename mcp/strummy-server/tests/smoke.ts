#!/usr/bin/env tsx
/**
 * Smoke test for the Strummy MCP server.
 *
 * Exercises every Group 1 tool against the configured Supabase. The point is to
 * catch *schema drift*: if a column gets renamed in the database, this fails
 * loudly. It does not validate semantics.
 *
 * Run: `npm run smoke` from mcp/strummy-server/
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
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

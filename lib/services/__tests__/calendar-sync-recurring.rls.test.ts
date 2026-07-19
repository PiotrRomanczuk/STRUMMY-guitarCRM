/**
 * CAL-3 (docs/app-blueprint/02-lessons-calendar.md) — recurring-event import
 * dedupe verification.
 *
 * `syncTeacherCalendar` (lib/services/calendar-sync-service.ts) dedupes
 * purely by `google_event_id` — no transformation of its own. The actual
 * per-instance-id behavior comes from the Google Calendar API's
 * `singleEvents: true` param, which expands a recurring series into
 * instances whose ids are `<baseId>_<startTimestamp>` — each unique. This
 * test proves the DB-level mechanism CAL-3 is actually worried about: the
 * `lessons.google_event_id` UNIQUE constraint permits N distinct
 * per-instance ids from one recurring series (a weekly series imports as N
 * lessons, not 1 — no collapse), and correctly rejects a real duplicate.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readRlsEnv, describeIfRls } from '../../testing/rls/env';
import { adminClient, getStudentId, getTeacherId } from '../../../tests/helpers/seed-ids';

function serviceClient(): SupabaseClient {
  const env = readRlsEnv();
  if (!env) throw new Error('RLS test env not available');
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const RUN = `cal3-${Date.now()}`;
const BASE_EVENT_ID = `${RUN}-recurring-base`;

describeIfRls('CAL-3 — recurring-event import dedupe', () => {
  let db: SupabaseClient;
  let teacherId: string;
  let studentId: string;
  const insertedIds: string[] = [];

  beforeAll(async () => {
    db = serviceClient();
    const seedDb = adminClient();
    [teacherId, studentId] = await Promise.all([getTeacherId(seedDb), getStudentId(seedDb)]);
  });

  afterAll(async () => {
    if (insertedIds.length) await db.from('lessons').delete().in('id', insertedIds);
  });

  it('two expanded instances of one recurring event import as two distinct lessons', async () => {
    // Mirrors what Google's singleEvents:true actually returns for a weekly
    // series: same base id, distinct per-instance suffix.
    const instanceIdA = `${BASE_EVENT_ID}_20260901T100000Z`;
    const instanceIdB = `${BASE_EVENT_ID}_20260908T100000Z`;

    const { data: lessonA, error: errorA } = await db
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'CAL-3 recurring instance A',
        scheduled_at: '2026-09-01T10:00:00Z',
        status: 'SCHEDULED',
        google_event_id: instanceIdA,
      })
      .select('id, google_event_id')
      .single();
    expect(errorA).toBeNull();
    if (lessonA) insertedIds.push(lessonA.id);

    const { data: lessonB, error: errorB } = await db
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'CAL-3 recurring instance B',
        scheduled_at: '2026-09-08T10:00:00Z',
        status: 'SCHEDULED',
        google_event_id: instanceIdB,
      })
      .select('id, google_event_id')
      .single();
    expect(errorB).toBeNull();
    if (lessonB) insertedIds.push(lessonB.id);

    // No collapse: both rows exist, distinct ids, same base prefix.
    expect(lessonA?.google_event_id).not.toBe(lessonB?.google_event_id);
    expect(lessonA?.google_event_id?.startsWith(BASE_EVENT_ID)).toBe(true);
    expect(lessonB?.google_event_id?.startsWith(BASE_EVENT_ID)).toBe(true);
  });

  it('a real duplicate google_event_id is rejected by the UNIQUE constraint (the DB-level backstop)', async () => {
    const dupeId = `${RUN}-duplicate`;

    const { data: first, error: firstError } = await db
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        title: 'CAL-3 dedupe original',
        scheduled_at: '2026-09-15T10:00:00Z',
        status: 'SCHEDULED',
        google_event_id: dupeId,
      })
      .select('id')
      .single();
    expect(firstError).toBeNull();
    if (first) insertedIds.push(first.id);

    const { error: secondError } = await db.from('lessons').insert({
      teacher_id: teacherId,
      student_id: studentId,
      title: 'CAL-3 dedupe re-import attempt',
      scheduled_at: '2026-09-15T10:00:00Z',
      status: 'SCHEDULED',
      google_event_id: dupeId,
    });
    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe('23505'); // unique_violation
  });
});

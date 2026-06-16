/**
 * RLS-real coverage for `practice_sessions` same-day undo (spec 05).
 *
 * Asserts the new `practice_sessions_delete_own_today` policy (migration
 * `20260616010000_practice_delete_same_day.sql`):
 *   - a student may DELETE a session they logged TODAY,
 *   - may NOT delete a session created on a prior day (immutable),
 *   - may NOT delete another student's session.
 *
 * ## Running this suite
 * Auto-skips unless an RLS test DB is configured (see `lib/testing/rls/env.ts`).
 * The branch DB must have migration `20260616010000_practice_delete_same_day`
 * applied (DELETE policy + AFTER DELETE metric-reversal trigger).
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('practice_sessions RLS — same-day undo', () => {
  let fx: TwoTeacherFixture;
  let songId: string;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    const { data, error } = await fx.service
      .from('songs')
      .insert({ title: 'RLS practice-undo song' })
      .select('id')
      .single();
    if (error || !data) throw new Error(`seed song failed: ${error?.message}`);
    songId = (data as { id: string }).id;
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('student inserts their own session (insert-own)', async () => {
    const { data, error } = await fx.studentA1.client
      .from('practice_sessions')
      .insert({ student_id: fx.studentA1.id, song_id: songId, duration_minutes: 20 })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
  });

  it('student can delete a session logged today', async () => {
    const { data: inserted } = await fx.studentA1.client
      .from('practice_sessions')
      .insert({ student_id: fx.studentA1.id, song_id: songId, duration_minutes: 15 })
      .select('id')
      .single();
    const id = (inserted as { id: string }).id;

    const { data: deleted, error } = await fx.studentA1.client
      .from('practice_sessions')
      .delete()
      .eq('id', id)
      .select('id');

    expect(error).toBeNull();
    expect(deleted).toHaveLength(1);
  });

  it('student cannot delete a session created before today (RLS rejects, 0 rows)', async () => {
    // Seed a session dated yesterday via the service client (bypasses RLS).
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: old } = await fx.service
      .from('practice_sessions')
      .insert({
        student_id: fx.studentA1.id,
        song_id: songId,
        duration_minutes: 30,
        created_at: yesterday,
      })
      .select('id')
      .single();
    const oldId = (old as { id: string }).id;

    const { data: deleted } = await fx.studentA1.client
      .from('practice_sessions')
      .delete()
      .eq('id', oldId)
      .select('id');
    expect(deleted ?? []).toHaveLength(0);

    // The row must still exist (verified via service client).
    const { data: still } = await fx.service
      .from('practice_sessions')
      .select('id')
      .eq('id', oldId)
      .maybeSingle();
    expect(still?.id).toBe(oldId);
  });

  it("student cannot delete another student's session", async () => {
    const { data: theirs } = await fx.service
      .from('practice_sessions')
      .insert({ student_id: fx.studentB1.id, song_id: songId, duration_minutes: 25 })
      .select('id')
      .single();
    const theirId = (theirs as { id: string }).id;

    const { data: deleted } = await fx.studentA1.client
      .from('practice_sessions')
      .delete()
      .eq('id', theirId)
      .select('id');
    expect(deleted ?? []).toHaveLength(0);

    const { data: still } = await fx.service
      .from('practice_sessions')
      .select('id')
      .eq('id', theirId)
      .maybeSingle();
    expect(still?.id).toBe(theirId);
  });
});

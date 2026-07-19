/**
 * PRA-1 (docs/app-blueprint/04-practice-progress.md) — hard launch gate 9.
 *
 * Proves the practice_sessions → student_repertoire aggregate triggers
 * against a REAL Postgres instance (no mocks — triggers can't be tested any
 * other way). See supabase/migrations/20260718210000_fix_practice_metric_triggers.sql
 * for the fix: the AFTER INSERT aggregation trigger was entirely absent from
 * the baseline, and the AFTER DELETE reversal trigger targeted the wrong
 * table/column, raising 42703 on any song-linked undo.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readRlsEnv, describeIfRls } from '../../rls/env';

function serviceClient(): SupabaseClient {
  const env = readRlsEnv();
  if (!env) throw new Error('RLS test env not available');
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const RUN = `pra1-${Date.now()}`;

describeIfRls('PRA-1 — practice metric triggers', () => {
  let db: SupabaseClient;
  let studentId: string;
  let songId: string;
  let repertoireId: string;

  beforeAll(async () => {
    db = serviceClient();

    const { data: student, error: studentErr } = await db.auth.admin.createUser({
      email: `${RUN}-student@example.test`,
      password: 'Pra1-Trigger-Test-123!',
      email_confirm: true,
    });
    if (studentErr || !student.user) throw new Error(`createUser failed: ${studentErr?.message}`);
    studentId = student.user.id;
    await db.from('profiles').update({ is_student: true }).eq('id', studentId);

    const { data: song, error: songErr } = await db.from('songs').select('id').limit(1).single();
    if (songErr || !song) throw new Error(`no song available to seed: ${songErr?.message}`);
    songId = song.id;

    const { data: rep, error: repErr } = await db
      .from('student_repertoire')
      .insert({
        student_id: studentId,
        song_id: songId,
        total_practice_minutes: 0,
        practice_session_count: 0,
      })
      .select('id')
      .single();
    if (repErr || !rep) throw new Error(`seed student_repertoire failed: ${repErr?.message}`);
    repertoireId = rep.id;
  }, 30_000);

  afterAll(async () => {
    if (repertoireId) await db.from('student_repertoire').delete().eq('id', repertoireId);
    if (studentId) await db.auth.admin.deleteUser(studentId);
  });

  it('logging a song-linked session increments all three aggregates', async () => {
    const { data: session, error } = await db
      .from('practice_sessions')
      .insert({ student_id: studentId, song_id: songId, duration_minutes: 15 })
      .select('id, created_at')
      .single();
    expect(error).toBeNull();
    expect(session).toBeTruthy();

    const { data: rep } = await db
      .from('student_repertoire')
      .select('total_practice_minutes, practice_session_count, last_practiced_at')
      .eq('id', repertoireId)
      .single();

    expect(rep?.total_practice_minutes).toBe(15);
    expect(rep?.practice_session_count).toBe(1);
    expect(rep?.last_practiced_at).toBe(session?.created_at);

    await db.from('practice_sessions').delete().eq('id', session!.id);
  });

  it('same-day undo of a song-linked session decrements and recomputes last_practiced_at (null when none remain)', async () => {
    const { data: session, error } = await db
      .from('practice_sessions')
      .insert({ student_id: studentId, song_id: songId, duration_minutes: 20 })
      .select('id')
      .single();
    expect(error).toBeNull();

    const { data: afterInsert } = await db
      .from('student_repertoire')
      .select('total_practice_minutes, practice_session_count')
      .eq('id', repertoireId)
      .single();
    expect(afterInsert?.total_practice_minutes).toBe(20);
    expect(afterInsert?.practice_session_count).toBe(1);

    // This is the exact regression PRA-1 fixes: undoing a song-linked session
    // used to raise 42703 (column does not exist on the deprecated table).
    const { error: deleteError } = await db
      .from('practice_sessions')
      .delete()
      .eq('id', session!.id);
    expect(deleteError).toBeNull();

    const { data: afterDelete } = await db
      .from('student_repertoire')
      .select('total_practice_minutes, practice_session_count, last_practiced_at')
      .eq('id', repertoireId)
      .single();
    expect(afterDelete?.total_practice_minutes).toBe(0);
    expect(afterDelete?.practice_session_count).toBe(0);
    expect(afterDelete?.last_practiced_at).toBeNull();
  });

  it('a session with no song_id does not touch student_repertoire', async () => {
    const { data: before } = await db
      .from('student_repertoire')
      .select('total_practice_minutes')
      .eq('id', repertoireId)
      .single();

    const { data: session, error } = await db
      .from('practice_sessions')
      .insert({ student_id: studentId, song_id: null, duration_minutes: 30 })
      .select('id')
      .single();
    expect(error).toBeNull();

    const { data: after } = await db
      .from('student_repertoire')
      .select('total_practice_minutes')
      .eq('id', repertoireId)
      .single();
    expect(after?.total_practice_minutes).toBe(before?.total_practice_minutes);

    await db.from('practice_sessions').delete().eq('id', session!.id);
  });
});

/**
 * RLS-real coverage for `songs` (spec 01 → `songs_select_policy`,
 * migration `20251208000000_restrict_student_songs`).
 *
 * Policy under test:
 *   - admin / teacher  → see every non-deleted song.
 *   - student          → see a song ONLY if a `lesson_songs → lessons` row
 *                        ties it to `auth.uid()` (their Repertoire surface).
 *
 * Pattern mirrors `core-tables.rls.test.ts`: seed two isolated tenants, link
 * one song to each tenant's lesson, then drive real authenticated clients
 * through RLS to prove a student cannot see the other tenant's song.
 *
 * ## Running this suite
 * Auto-skips unless an RLS test DB is configured (see `lib/testing/rls/env.ts`):
 * `RLS_TEST_SUPABASE_URL` + `RLS_TEST_SERVICE_ROLE_KEY` + `RLS_TEST_ANON_KEY`
 * pointing at a Supabase branch (never production).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { describeIfRls, seedTwoTeachers, signInAs, type TwoTeacherFixture } from '../index';

const PASSWORD = 'rls-test-Password!1';

async function seedSong(service: SupabaseClient, title: string): Promise<string> {
  // `songs` requires author/level/key/ultimate_guitar_link (NOT NULL) and must
  // be non-draft so the student SELECT policy applies (is_draft = FALSE).
  const { data, error } = await service
    .from('songs')
    .insert({
      title,
      author: 'RLS fixture',
      level: 'beginner',
      key: 'C',
      ultimate_guitar_link: 'https://example.com/rls-fixture',
      is_draft: false,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`seed song failed: ${error?.message ?? 'no row returned'}`);
  }
  return (data as { id: string }).id;
}

describeIfRls('songs RLS — teacher/admin see all; student sees only lesson-linked', () => {
  let fx: TwoTeacherFixture;
  let songA = '';
  let songB = '';
  let adminClient: SupabaseClient | null = null;
  let adminId = '';

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    const { service, lessonA, lessonB } = fx;

    songA = await seedSong(service, 'RLS song A');
    songB = await seedSong(service, 'RLS song B');

    // Link songA → lessonA (studentA1) and songB → lessonB (studentB1).
    const { error: lsErr } = await service.from('lesson_songs').insert([
      { lesson_id: lessonA.id, song_id: songA },
      { lesson_id: lessonB.id, song_id: songB },
    ]);
    if (lsErr) {
      throw new Error(`seed lesson_songs failed: ${lsErr.message}`);
    }

    // An admin user (created inline — the shared fixture only seeds teachers/students).
    const email = `rls-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@guitarcrm.local`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { isTest: true },
    });
    if (error || !data.user) {
      throw new Error(`create admin failed: ${error?.message ?? 'no user'}`);
    }
    adminId = data.user.id;
    const { error: profileErr } = await service.from('profiles').upsert(
      {
        id: adminId,
        email,
        full_name: 'RLS admin',
        is_admin: true,
        is_teacher: false,
        is_student: false,
        is_development: true,
      },
      { onConflict: 'id' }
    );
    if (profileErr) {
      throw new Error(`admin profile upsert failed: ${profileErr.message}`);
    }
    adminClient = await signInAs(email, PASSWORD);
  }, 30_000);

  afterAll(async () => {
    // songs have no FK to auth users, so delete them explicitly. The auth-user
    // cleanup cascades lessons + lesson_songs.
    const songIds = [songA, songB].filter(Boolean);
    if (fx?.service && songIds.length) {
      await fx.service.from('songs').delete().in('id', songIds);
    }
    if (fx?.service && adminId) {
      await fx.service.auth.admin.deleteUser(adminId);
    }
    await fx?.cleanup();
  });

  describe('teacher', () => {
    it('teacher A sees every non-deleted song (no student scoping)', async () => {
      const { data } = await fx.teacherA.client.from('songs').select('id').in('id', [songA, songB]);
      const ids = (data ?? []).map((r) => r.id).sort();
      expect(ids).toEqual([songA, songB].sort());
    });
  });

  describe('admin', () => {
    it('admin sees every non-deleted song', async () => {
      const { data } = await adminClient!.from('songs').select('id').in('id', [songA, songB]);
      const ids = (data ?? []).map((r) => r.id).sort();
      expect(ids).toEqual([songA, songB].sort());
    });
  });

  describe('student', () => {
    it('student A1 sees only their lesson-linked song (songA)', async () => {
      const { data } = await fx.studentA1.client
        .from('songs')
        .select('id')
        .in('id', [songA, songB]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toEqual([songA]);
    });

    it('student A1 CANNOT see another tenant student song (songB)', async () => {
      const { data } = await fx.studentA1.client
        .from('songs')
        .select('id')
        .eq('id', songB)
        .maybeSingle();
      expect(data).toBeNull();
    });
  });
});

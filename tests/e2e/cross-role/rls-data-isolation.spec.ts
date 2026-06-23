import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * RLS Cross-Read Data Isolation — security hard gate for the v1 self-host launch.
 *
 * Proves, against the REAL PostgREST `/rest/v1/` layer (NO mocks, NO UI), that an
 * authenticated student CANNOT read another student's private rows. This is the
 * launch gate phrased in the plan as "student A can't read student B" — verified
 * with real JWTs issued by GoTrue, not by navigating the app.
 *
 * Hermetic: provisions its own two students + a teacher + a private row per
 * student-scoped table via the service role, signs both students in for real
 * access tokens, asserts isolation on every table, then tears everything down.
 * Runs against any stack (local, StrummyProd, CI) given URL + anon + service-role
 * keys; skips cleanly when those are absent.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const READY = Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE_KEY);

// Strong, throwaway password for the ephemeral test accounts.
const PASSWORD = 'Rls-Cross-Read-Iso-123!';
// Unique per run so a prior run's incomplete teardown can't collide.
const RUN = `rls-iso-${Date.now()}`;

/**
 * Student-scoped tables and the column that ties a row to its owning student.
 * `profiles` is owner-keyed by `id` (a student sees only `id = auth.uid()`);
 * the rest by `student_id`.
 */
const SCOPED_TABLES = [
  { table: 'lessons', ownerCol: 'student_id' },
  { table: 'assignments', ownerCol: 'student_id' },
  { table: 'practice_sessions', ownerCol: 'student_id' },
  { table: 'student_song_progress', ownerCol: 'student_id' },
  { table: 'profiles', ownerCol: 'id' },
] as const;

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createStudent(
  admin: SupabaseClient,
  label: string
): Promise<{ id: string; email: string }> {
  const email = `${RUN}-${label}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: 'RLS', last_name: label },
  });
  if (error || !data.user) throw new Error(`createUser(${label}) failed: ${error?.message}`);
  const id = data.user.id;
  // The handle_new_user trigger creates the profile row (with user_id set, which
  // the ck_shadow_user_id constraint requires). Only flip the role flags — don't
  // re-insert, or we'd null trigger-set columns and trip that constraint.
  const isTeacher = label === 'teacher';
  const { error: upErr } = await admin
    .from('profiles')
    .update({ is_admin: false, is_teacher: isTeacher, is_student: !isTeacher })
    .eq('id', id);
  if (upErr) throw new Error(`profile role update(${label}) failed: ${upErr.message}`);
  return { id, email };
}

/** Seed one private row per student-scoped table for the given student. */
async function seedPrivateRows(
  admin: SupabaseClient,
  studentId: string,
  teacherId: string,
  songId: string | null
): Promise<void> {
  const now = new Date().toISOString();

  const { error: lErr } = await admin.from('lessons').insert({
    teacher_id: teacherId,
    student_id: studentId,
    title: `${RUN} lesson`,
    scheduled_at: now,
    status: 'SCHEDULED',
  });
  if (lErr) throw new Error(`seed lessons failed: ${lErr.message}`);

  const { error: aErr } = await admin.from('assignments').insert({
    title: `${RUN} assignment`,
    teacher_id: teacherId,
    student_id: studentId,
  });
  if (aErr) throw new Error(`seed assignments failed: ${aErr.message}`);

  const { error: pErr } = await admin.from('practice_sessions').insert({
    student_id: studentId,
    duration_minutes: 30,
  });
  if (pErr) throw new Error(`seed practice_sessions failed: ${pErr.message}`);

  if (songId) {
    const { error: spErr } = await admin
      .from('student_song_progress')
      .insert({ student_id: studentId, song_id: songId });
    if (spErr) throw new Error(`seed student_song_progress failed: ${spErr.message}`);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe(
  'RLS cross-read data isolation',
  { tag: ['@cross-role', '@rls', '@security'] },
  () => {
    let admin: SupabaseClient;
    let studentA: { id: string; email: string };
    let studentB: { id: string; email: string };
    let teacher: { id: string; email: string };
    let songId: string | null = null;

    // Authenticated client acting AS student A (real GoTrue access token).
    let asStudentA: SupabaseClient;

    test.beforeAll(async () => {
      test.skip(
        !READY,
        'Supabase URL + anon + service-role keys required (set NEXT_PUBLIC_SUPABASE_LOCAL_* / SUPABASE_LOCAL_SERVICE_ROLE_KEY).'
      );

      admin = serviceClient();

      // A song is needed for student_song_progress (song_id NOT NULL).
      const { data: song } = await admin.from('songs').select('id').limit(1).maybeSingle();
      songId = song?.id ?? null;
      if (!songId) {
        const { data: created } = await admin
          .from('songs')
          .insert({ title: `${RUN} song`, author: 'RLS Test', level: 'beginner' })
          .select('id')
          .maybeSingle();
        songId = created?.id ?? null;
      }

      teacher = await createStudent(admin, 'teacher');
      studentA = await createStudent(admin, 'a');
      studentB = await createStudent(admin, 'b');

      await seedPrivateRows(admin, studentA.id, teacher.id, songId);
      await seedPrivateRows(admin, studentB.id, teacher.id, songId);

      // Sign in as student A for real — this issues a GoTrue JWT and every
      // subsequent query goes through PostgREST as the authenticated student.
      asStudentA = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: signIn, error: signInErr } = await asStudentA.auth.signInWithPassword({
        email: studentA.email,
        password: PASSWORD,
      });
      if (signInErr || signIn.user?.id !== studentA.id) {
        throw new Error(`student A sign-in failed: ${signInErr?.message ?? 'id mismatch'}`);
      }
    });

    test.afterAll(async () => {
      if (!READY || !admin) return;
      // Deleting a profile cascades its seeded child rows (student_id → profiles
      // ON DELETE CASCADE), but does NOT cascade to auth.users — so remove both,
      // and sweep by the `rls-iso-` prefix to also clear any orphans a prior
      // failed run left behind. Best-effort.
      await admin.from('profiles').delete().like('email', 'rls-iso-%');
      await admin.from('songs').delete().like('title', 'rls-iso-%');
      try {
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
        for (const u of list?.users ?? []) {
          if (u.email?.startsWith('rls-iso-')) {
            await admin.auth.admin.deleteUser(u.id).catch(() => {});
          }
        }
      } catch {
        /* best-effort teardown */
      }
    });

    test('setup sanity: service role can see student B private rows (so empty ≠ missing data)', async () => {
      for (const { table, ownerCol } of SCOPED_TABLES) {
        if (table === 'student_song_progress' && !songId) continue;
        const { data, error } = await admin.from(table).select('id').eq(ownerCol, studentB.id);
        expect(error, `service-role read of ${table} errored`).toBeNull();
        expect(
          (data ?? []).length,
          `expected ≥1 seeded ${table} row for student B (service role)`
        ).toBeGreaterThanOrEqual(1);
      }
    });

    for (const { table, ownerCol } of SCOPED_TABLES) {
      test(`student A cannot read student B's ${table}`, async () => {
        if (table === 'student_song_progress' && !songId) {
          test.skip(true, 'no song available to seed student_song_progress');
        }
        const { data, error } = await asStudentA.from(table).select('*').eq(ownerCol, studentB.id);
        // RLS silently filters rather than erroring — a clean read returning zero rows.
        expect(error, `${table} read errored for student A`).toBeNull();
        expect(data, `student A leaked student B's ${table} rows`).toEqual([]);
      });

      test(`student A's own ${table} read returns only their rows (no leak of B)`, async () => {
        if (table === 'student_song_progress' && !songId) {
          test.skip(true, 'no song available to seed student_song_progress');
        }
        // Unfiltered read: whatever the student can see must contain none of B's rows
        // and (positive control) must include their own seeded row.
        const { data, error } = await asStudentA.from(table).select(ownerCol);
        expect(error, `${table} unfiltered read errored for student A`).toBeNull();
        const rows = (data ?? []) as Array<Record<string, string>>;
        const ownerIds = rows.map((r) => r[ownerCol]);
        expect(ownerIds, `student A's ${table} read leaked a row owned by student B`).not.toContain(
          studentB.id
        );
        expect(
          ownerIds.some((id) => id === studentA.id),
          `expected student A to see their own seeded ${table} row (positive control)`
        ).toBe(true);
        expect(
          ownerIds.every((id) => id === studentA.id),
          `student A saw ${table} rows owned by someone other than themselves`
        ).toBe(true);
      });
    }
  }
);

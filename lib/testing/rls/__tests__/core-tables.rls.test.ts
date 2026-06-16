/**
 * RLS-real coverage for the core tables (spec 11B.3 → MASTER_SPEC §3.1) and the
 * §0.5 `v_teacher_lesson_trends` view.
 *
 * Pattern: seed two isolated tenants (teacher A + student A1, teacher B +
 * student B1) with one row per (teacher, student) pair, then drive real
 * authenticated clients through RLS to prove cross-tenant rows do not leak.
 *
 * ## Running this suite
 * Auto-skips unless an RLS test DB is configured (see `lib/testing/rls/env.ts`).
 * Piotr/CI must set `RLS_TEST_SUPABASE_URL` + `RLS_TEST_SERVICE_ROLE_KEY` +
 * `RLS_TEST_ANON_KEY` to a **Supabase branch** (never production). The view
 * test additionally requires the
 * `20260616000000_security_invoker_teacher_lesson_trends` migration applied to
 * that branch.
 *
 * ## Known isolation gaps surfaced here (flagged for security review)
 * `profiles`, `practice_sessions`, and `student_repertoire` grant SELECT to ANY
 * teacher/admin (`is_admin_or_teacher()` / "Teachers can read all profiles"),
 * so they enforce **student-own-only** but NOT teacher-isolation. `assignments`
 * IS teacher-scoped (`teacher_id = auth.uid()`). The teacher-cross-tenant tests
 * below assert the CURRENT behavior and are labelled accordingly.
 */

import {
  describeIfRls,
  seedTwoTeachers,
  seedCoreTables,
  type TwoTeacherFixture,
  type CoreTableRows,
} from '../index';

describeIfRls('core-table RLS — teacher isolation + student-own-only', () => {
  let fx: TwoTeacherFixture;
  let rows: CoreTableRows;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    rows = await seedCoreTables(fx);
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  describe('assignments', () => {
    it('teacher A sees only their own assignment (teacher-isolation)', async () => {
      const { data } = await fx.teacherA.client
        .from('assignments')
        .select('id, teacher_id')
        .in('id', [rows.assignmentA, rows.assignmentB]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toContain(rows.assignmentA);
      expect(ids).not.toContain(rows.assignmentB);
    });

    it('student A1 sees only their own assignment (student-own-only)', async () => {
      const { data } = await fx.studentA1.client
        .from('assignments')
        .select('id')
        .in('id', [rows.assignmentA, rows.assignmentB]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toEqual([rows.assignmentA]);
    });
  });

  describe('profiles', () => {
    it('student A1 sees only their own profile (student-own-only)', async () => {
      const { data } = await fx.studentA1.client
        .from('profiles')
        .select('id')
        .in('id', [fx.studentA1.id, fx.studentB1.id, fx.teacherB.id]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toEqual([fx.studentA1.id]);
    });

    // CURRENT behavior: teachers can read ALL profiles (no teacher-isolation).
    // Flagged as a gap in the file header — assert reality so the suite is honest.
    it('teacher A can read another tenant student profile (KNOWN gap: profiles not teacher-isolated)', async () => {
      const { data } = await fx.teacherA.client
        .from('profiles')
        .select('id')
        .eq('id', fx.studentB1.id)
        .maybeSingle();
      expect(data?.id).toBe(fx.studentB1.id);
    });
  });

  describe('practice_sessions', () => {
    it('student A1 sees only their own practice session (student-own-only)', async () => {
      const { data } = await fx.studentA1.client
        .from('practice_sessions')
        .select('id')
        .in('id', [rows.practiceA1, rows.practiceB1]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toEqual([rows.practiceA1]);
    });

    it('student A1 CANNOT see student B1 practice session', async () => {
      const { data } = await fx.studentA1.client
        .from('practice_sessions')
        .select('id')
        .eq('id', rows.practiceB1)
        .maybeSingle();
      expect(data).toBeNull();
    });
  });

  describe('student_repertoire', () => {
    it('student A1 sees only their own repertoire row (student-own-only)', async () => {
      const { data } = await fx.studentA1.client
        .from('student_repertoire')
        .select('id')
        .in('id', [rows.repertoireA1, rows.repertoireB1]);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toEqual([rows.repertoireA1]);
    });

    it('student A1 CANNOT see student B1 repertoire row', async () => {
      const { data } = await fx.studentA1.client
        .from('student_repertoire')
        .select('id')
        .eq('id', rows.repertoireB1)
        .maybeSingle();
      expect(data).toBeNull();
    });
  });

  describe('v_teacher_lesson_trends (§0.5 security_invoker)', () => {
    it('a student sees ZERO rows (view must not bypass RLS)', async () => {
      const { data, error } = await fx.studentA1.client
        .from('v_teacher_lesson_trends')
        .select('teacher_id');
      // security_invoker enforces profiles RLS: a student only sees their own
      // (non-teacher) profile, which the view's WHERE (is_teacher OR is_admin)
      // filters out → no rows leak.
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });

    it('teacher A sees their own teacher_id in the view', async () => {
      const { data } = await fx.teacherA.client
        .from('v_teacher_lesson_trends')
        .select('teacher_id');
      const teacherIds = new Set((data ?? []).map((r) => r.teacher_id));
      expect(teacherIds.has(fx.teacherA.id)).toBe(true);
    });
  });
});

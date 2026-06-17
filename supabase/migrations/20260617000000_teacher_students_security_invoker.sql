-- ============================================================================
-- Migration: Add security_invoker to teacher_students view
-- Date: 2026-06-17
-- ============================================================================
-- Without WITH (security_invoker = true) the view runs as the definer
-- (postgres / service_role) and bypasses RLS — so ANY authenticated caller
-- could read every teacher↔student pair, not just their own. Flagged as a
-- `security_definer_view` ERROR by Supabase's security advisor.
--
-- The app already treats this view as RLS-scoped (see lib/access/StudentAccess.ts
-- and lib/services/lesson-form-data.ts), so security_invoker aligns the view
-- with documented behavior: a teacher sees only students from lessons they can
-- access. Recreate with the flag (definition otherwise unchanged from
-- 20260224_teacher_students_view.sql).
--
-- Applied to production 2026-06-17 (recorded as version 20260617000000).
-- ============================================================================

CREATE OR REPLACE VIEW teacher_students
  WITH (security_invoker = true)
AS
SELECT DISTINCT
    teacher_id,
    student_id
FROM lessons
WHERE deleted_at IS NULL;

COMMENT ON VIEW teacher_students IS
  'Derived teacher-student pairs from lessons. A student appears here once they have at least one lesson with a teacher.';

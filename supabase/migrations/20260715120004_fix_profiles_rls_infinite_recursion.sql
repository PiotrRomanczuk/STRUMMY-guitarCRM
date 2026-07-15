-- ============================================================================
-- Migration: Fix infinite recursion in profiles RLS (regression from
-- 20260715120002 / 20260715120003)
-- Guitar CRM
-- ============================================================================
-- Both of those migrations added a plain `EXISTS (SELECT 1 FROM lessons
-- WHERE ...)` subquery directly inside a `profiles` policy's USING clause.
-- Evaluating that subquery re-triggers `lessons`' own SELECT RLS policies —
-- and `lessons_select_admin` (and this branch's own
-- lessons_update_policy/lessons_delete_policy) contain a plain
-- `EXISTS (SELECT 1 FROM profiles WHERE ...)` subquery right back into
-- `profiles`. Postgres detects the cycle and raises
-- "infinite recursion detected in policy for relation \"profiles\"" (42P17)
-- — breaking every real query that touches `profiles` or `lessons` under
-- RLS as a non-admin (confirmed live: songs, lessons, assignments,
-- repertoire, practice, theory all failed for a Student test account).
--
-- The codebase already has the correct pattern for exactly this hazard —
-- see is_child_of_parent() (20260227000001_parent_constraints_and_rls.sql):
-- "SECURITY DEFINER bypasses RLS to avoid infinite recursion when policies
-- on other tables join back to profiles." Both new policies should have
-- used a SECURITY DEFINER helper from the start instead of an inline
-- subquery. This migration introduces that helper and rewires both
-- policies to use it — no behavior change, just breaks the recursion.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.teacher_teaches_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lessons
    WHERE teacher_id = _teacher_id
      AND student_id = _student_id
      AND deleted_at IS NULL
  );
$$;

DROP POLICY IF EXISTS "Teachers can read all profiles" ON profiles;
CREATE POLICY "Teachers can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (
    public.has_role('teacher')
    AND (
      id = auth.uid()
      OR (is_active = true AND public.teacher_teaches_student(auth.uid(), profiles.id))
    )
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_select_own_teacher" ON profiles;
CREATE POLICY "profiles_select_own_teacher" ON profiles
    FOR SELECT USING (
        is_teacher = true
        AND public.teacher_teaches_student(profiles.id, auth.uid())
    );

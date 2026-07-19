-- Migration: teacher SELECT policy on user_preferences (IDA-4)
-- ============================================================================
-- Blueprint gap IDA-4 (docs/app-blueprint/01-identity-access.md).
--
-- Existing policies only cover self + admin. Adds teacher read access,
-- matching the same any-teacher-may-read pattern already established for
-- profiles/practice_sessions/student_repertoire in this codebase (a single
-- solo-teacher app today — no teacher_students relationship table exists to
-- scope by).
-- ============================================================================

CREATE POLICY "Teachers can read all preferences" ON public.user_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_teacher = true
    )
  );

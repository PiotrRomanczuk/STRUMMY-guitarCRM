-- Migration: Parent read access to child repertoire + onboarding preferences
--
-- Context: the parent/guardian link (profiles.parent_id + is_parent()/
-- is_child_of_parent() helpers) and parent SELECT policies on lessons,
-- assignments, practice_sessions, student_song_progress, songs and profiles
-- already ship in the baseline. The Parent Dashboard ("Family portal") reuses
-- the existing student-detail queries, two of which read tables that had NO
-- parent policy and therefore failed closed for a parent:
--   * student_repertoire  → getStudentRepertoire (songs count / repertoire)
--   * user_preferences     → getStudentPreferences (skill level)
--
-- These add read-only parent access scoped to linked children only, matching
-- the is_child_of_parent(...) convention used by the sibling policies. No leak
-- to non-children: is_child_of_parent() checks profiles.parent_id = auth.uid().
-- Idempotent: drop-if-exists before create so re-applying is safe.

-- Repertoire (student_id column).
DROP POLICY IF EXISTS sr_select_parent ON public.student_repertoire;
CREATE POLICY sr_select_parent ON public.student_repertoire
  FOR SELECT
  TO authenticated
  USING (public.is_child_of_parent(student_id));

-- Onboarding preferences (user_id column).
DROP POLICY IF EXISTS user_preferences_select_parent ON public.user_preferences;
CREATE POLICY user_preferences_select_parent ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (public.is_child_of_parent(user_id));

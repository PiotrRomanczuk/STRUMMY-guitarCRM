-- ============================================================================
-- Migration: Fix notification_preferences dedup in transfer_shadow_profile_references
-- ============================================================================
-- 2026-06-08
--
-- BUG (in 20260425000001_unified_shadow_transfer_function.sql):
-- The dedup DELETE for notification_preferences had a malformed WHERE clause:
--
--   DELETE FROM notification_preferences WHERE user_id = p_old_id
--     AND (user_id, notification_type) IN (
--       SELECT user_id, notification_type FROM notification_preferences WHERE user_id = p_new_id
--     );
--
-- The IN tuple `(user_id, notification_type)` compares (p_old_id, type) to
-- (p_new_id, type) and never matches — so nothing is deleted. The subsequent
-- UPDATE then fails on the unique constraint (user_id, notification_type) when
-- a new profile-insert trigger has already auto-populated notification_preferences
-- for the new user (via tr_initialize_notification_preferences).
--
-- Caught by scripts/verify/onboarding.ts after applying the order-fix migration
-- (20260608000000) and seeding the 7 missing tables on uwh:
--
--   ERROR: duplicate key value violates unique constraint
--          "notification_preferences_user_id_notification_type_key"
--
-- FIX: drop user_id from the IN tuple so the subquery matches by notification_type
-- alone (the row's user_id is already constrained to p_old_id by the outer WHERE).

CREATE OR REPLACE FUNCTION transfer_shadow_profile_references(
  p_old_id UUID,
  p_new_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_result JSONB := '{}'::JSONB;
BEGIN
  IF p_old_id IS NULL OR p_new_id IS NULL THEN
    RAISE EXCEPTION 'Both old_id and new_id must be provided';
  END IF;

  IF p_old_id = p_new_id THEN
    RETURN v_result;
  END IF;

  -- STUDENT DATA --------------------------------------------------------------

  UPDATE lessons SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('lessons_student', v_count);

  UPDATE assignments SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignments_student', v_count);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_skills' AND table_schema = 'public') THEN
    UPDATE student_skills SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('student_skills', v_count);
  END IF;

  DELETE FROM student_repertoire
  WHERE student_id = p_old_id
    AND song_id IN (
      SELECT song_id FROM student_repertoire WHERE student_id = p_new_id
    );
  UPDATE student_repertoire SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('student_repertoire', v_count);

  UPDATE practice_sessions SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('practice_sessions', v_count);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_song_progress' AND table_schema = 'public') THEN
    UPDATE student_song_progress SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('student_song_progress', v_count);
  END IF;

  UPDATE song_requests SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_requests_student', v_count);

  -- TEACHER / ADMIN DATA -----------------------------------------------------

  UPDATE lessons SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('lessons_teacher', v_count);

  UPDATE assignments SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignments_teacher', v_count);

  UPDATE assignment_templates SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignment_templates', v_count);

  UPDATE student_repertoire SET assigned_by = p_new_id WHERE assigned_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('repertoire_assigned_by', v_count);

  UPDATE song_requests SET reviewed_by = p_new_id WHERE reviewed_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_requests_reviewed_by', v_count);

  UPDATE song_of_the_week SET selected_by = p_new_id WHERE selected_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_of_the_week', v_count);

  UPDATE theoretical_courses SET created_by = p_new_id WHERE created_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_courses', v_count);

  -- USER DATA (user_id unique-constrained, delete-first pattern) -------------

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings' AND table_schema = 'public') THEN
    DELETE FROM user_settings WHERE user_id = p_old_id
      AND EXISTS (SELECT 1 FROM user_settings WHERE user_id = p_new_id);
    UPDATE user_settings SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_settings', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
    DELETE FROM user_preferences WHERE user_id = p_old_id
      AND EXISTS (SELECT 1 FROM user_preferences WHERE user_id = p_new_id);
    UPDATE user_preferences SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_preferences', v_count);
  END IF;

  UPDATE in_app_notifications SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('in_app_notifications', v_count);

  -- FIX: drop user_id from the IN tuple so the subquery matches on
  -- notification_type alone. The row's user_id is already constrained to
  -- p_old_id by the outer WHERE.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public') THEN
    DELETE FROM notification_preferences WHERE user_id = p_old_id
      AND notification_type IN (
        SELECT notification_type FROM notification_preferences WHERE user_id = p_new_id
      );
    UPDATE notification_preferences SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('notification_preferences', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_log' AND table_schema = 'public') THEN
    UPDATE notification_log SET recipient_user_id = p_new_id WHERE recipient_user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('notification_log', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_queue' AND table_schema = 'public') THEN
    UPDATE notification_queue SET recipient_user_id = p_new_id WHERE recipient_user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('notification_queue', v_count);
  END IF;

  UPDATE ai_generations SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_generations', v_count);

  UPDATE ai_conversations SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_conversations', v_count);

  UPDATE ai_usage_stats SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_usage_stats', v_count);

  UPDATE agent_execution_logs SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('agent_execution_logs', v_count);

  DELETE FROM theoretical_course_access WHERE user_id = p_old_id
    AND course_id IN (
      SELECT course_id FROM theoretical_course_access WHERE user_id = p_new_id
    );
  UPDATE theoretical_course_access SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_course_access_user', v_count);

  UPDATE theoretical_course_access SET granted_by = p_new_id WHERE granted_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_course_access_granted_by', v_count);

  -- AUDIT / LOGGING ----------------------------------------------------------

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
    UPDATE audit_log SET actor_id = p_new_id WHERE actor_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('audit_log', v_count);
  END IF;

  UPDATE spotify_matches SET reviewed_by = p_new_id WHERE reviewed_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('spotify_matches', v_count);

  UPDATE ai_prompt_templates SET created_by = p_new_id WHERE created_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_prompt_templates', v_count);

  -- SELF-REFERENCING ---------------------------------------------------------

  UPDATE profiles SET parent_id = p_new_id WHERE parent_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('profiles_parent', v_count);

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION transfer_shadow_profile_references(UUID, UUID) IS
  'Transfers all FK references from one profile ID to another. Used during shadow user linking. Returns JSONB with row counts per table. Hardened 2026-06-08 with IF EXISTS guards for optional tables and a fix to the notification_preferences dedup WHERE clause.';

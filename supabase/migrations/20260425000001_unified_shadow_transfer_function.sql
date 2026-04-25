-- ============================================================================
-- Migration: Unified shadow profile FK transfer function
-- ============================================================================
-- Single source of truth for transferring all FK references from one profile
-- to another. Used by both the handle_new_user trigger and the admin linking
-- API. Covers ALL tables that reference profiles(id).
--
-- Returns JSONB with row counts per table for audit logging.

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

  -- ========================================================================
  -- STUDENT DATA (student_id columns)
  -- ========================================================================

  -- lessons.student_id
  UPDATE lessons SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('lessons_student', v_count);

  -- assignments.student_id
  UPDATE assignments SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignments_student', v_count);

  -- student_skills.student_id
  UPDATE student_skills SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('student_skills', v_count);

  -- student_repertoire.student_id
  -- Handle unique constraint: delete shadow's rows if real user already has them
  DELETE FROM student_repertoire
  WHERE student_id = p_old_id
    AND song_id IN (
      SELECT song_id FROM student_repertoire WHERE student_id = p_new_id
    );
  UPDATE student_repertoire SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('student_repertoire', v_count);

  -- practice_sessions.student_id
  UPDATE practice_sessions SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('practice_sessions', v_count);

  -- student_song_progress.student_id (deprecated but still exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_song_progress' AND table_schema = 'public') THEN
    UPDATE student_song_progress SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('student_song_progress', v_count);
  END IF;

  -- song_requests.student_id
  UPDATE song_requests SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_requests_student', v_count);

  -- ========================================================================
  -- TEACHER / ADMIN DATA (teacher_id, created_by, etc.)
  -- ========================================================================

  -- lessons.teacher_id
  UPDATE lessons SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('lessons_teacher', v_count);

  -- assignments.teacher_id
  UPDATE assignments SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignments_teacher', v_count);

  -- assignment_templates.teacher_id
  UPDATE assignment_templates SET teacher_id = p_new_id WHERE teacher_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('assignment_templates', v_count);

  -- student_repertoire.assigned_by
  UPDATE student_repertoire SET assigned_by = p_new_id WHERE assigned_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('repertoire_assigned_by', v_count);

  -- song_requests.reviewed_by
  UPDATE song_requests SET reviewed_by = p_new_id WHERE reviewed_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_requests_reviewed_by', v_count);

  -- song_of_the_week.selected_by
  UPDATE song_of_the_week SET selected_by = p_new_id WHERE selected_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('song_of_the_week', v_count);

  -- theoretical_courses.created_by
  UPDATE theoretical_courses SET created_by = p_new_id WHERE created_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_courses', v_count);

  -- ========================================================================
  -- USER DATA (user_id columns -- unique-constrained, delete-first pattern)
  -- ========================================================================

  -- user_settings.user_id (unique on user_id)
  DELETE FROM user_settings WHERE user_id = p_old_id
    AND EXISTS (SELECT 1 FROM user_settings WHERE user_id = p_new_id);
  UPDATE user_settings SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('user_settings', v_count);

  -- user_preferences.user_id (unique on user_id)
  DELETE FROM user_preferences WHERE user_id = p_old_id
    AND EXISTS (SELECT 1 FROM user_preferences WHERE user_id = p_new_id);
  UPDATE user_preferences SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('user_preferences', v_count);

  -- in_app_notifications.user_id
  UPDATE in_app_notifications SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('in_app_notifications', v_count);

  -- notification_preferences.user_id (unique on user_id + notification_type)
  DELETE FROM notification_preferences WHERE user_id = p_old_id
    AND (user_id, notification_type) IN (
      SELECT user_id, notification_type FROM notification_preferences WHERE user_id = p_new_id
    );
  UPDATE notification_preferences SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('notification_preferences', v_count);

  -- notification_log.recipient_user_id
  UPDATE notification_log SET recipient_user_id = p_new_id WHERE recipient_user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('notification_log', v_count);

  -- notification_queue.recipient_user_id
  UPDATE notification_queue SET recipient_user_id = p_new_id WHERE recipient_user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('notification_queue', v_count);

  -- ai_generations.user_id
  UPDATE ai_generations SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_generations', v_count);

  -- ai_conversations.user_id
  UPDATE ai_conversations SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_conversations', v_count);

  -- ai_usage_stats.user_id
  UPDATE ai_usage_stats SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_usage_stats', v_count);

  -- agent_execution_logs.user_id
  UPDATE agent_execution_logs SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('agent_execution_logs', v_count);

  -- theoretical_course_access.user_id
  DELETE FROM theoretical_course_access WHERE user_id = p_old_id
    AND course_id IN (
      SELECT course_id FROM theoretical_course_access WHERE user_id = p_new_id
    );
  UPDATE theoretical_course_access SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_course_access_user', v_count);

  -- theoretical_course_access.granted_by
  UPDATE theoretical_course_access SET granted_by = p_new_id WHERE granted_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_course_access_granted_by', v_count);

  -- ========================================================================
  -- AUDIT / LOGGING (SET NULL safe)
  -- ========================================================================

  -- audit_log.actor_id
  UPDATE audit_log SET actor_id = p_new_id WHERE actor_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('audit_log', v_count);

  -- spotify_matches.reviewed_by
  UPDATE spotify_matches SET reviewed_by = p_new_id WHERE reviewed_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('spotify_matches', v_count);

  -- ai_prompt_templates.created_by
  UPDATE ai_prompt_templates SET created_by = p_new_id WHERE created_by = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('ai_prompt_templates', v_count);

  -- ========================================================================
  -- SELF-REFERENCING
  -- ========================================================================

  -- profiles.parent_id (children pointing to old profile as parent)
  UPDATE profiles SET parent_id = p_new_id WHERE parent_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('profiles_parent', v_count);

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION transfer_shadow_profile_references(UUID, UUID) IS
  'Transfers all FK references from one profile ID to another. Used during shadow user linking. Returns JSONB with row counts per table.';

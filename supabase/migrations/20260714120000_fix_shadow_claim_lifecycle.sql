-- ============================================================================
-- Migration: Fix the shadow-claim lifecycle (both claim paths)
-- ============================================================================
-- 2026-07-14 — see docs/analysis/2026-07-14-shadow-users-deep-dive.md
--
-- BUG 1 (C1): handle_new_user regressed on 2026-06-22. The orphan prod
-- migration captured as 20260622121619 (and 20260622210000 built on top of it)
-- replaced the transfer_shadow_profile_references() call with an inline
-- transfer of ONLY lessons/assignments/user_roles, AND re-introduced the
-- FK-ordering bug fixed in 20260608000000: it UPDATEs FK columns to new.id
-- BEFORE the profiles(id = new.id) row exists. For any shadow with a lesson
-- the trigger throws, the EXCEPTION handler swallows it, and the user ends up
-- with NO profile at all (masked for empty shadows: 0-row updates fire no FK
-- check).
--
-- BUG 2 (C2): even with correct ordering, the inline 3-table transfer would
-- cascade-delete everything else (student_repertoire, practice_sessions,
-- student_skills, chord_*, song_requests, notifications, AI data, settings)
-- when the shadow row is deleted — all of those FK profiles(id) ON DELETE
-- CASCADE.
--
-- BUG 3 (H2): transfer_shadow_profile_references() itself drifted from the
-- schema — missing user_roles, task_management, chord_quiz_attempts
-- (added 2026-05-10) and chord_srs (added 2026-06-19).
--
-- BUG 4 (H1/M1): the admin link endpoint replicated the claim as three
-- non-atomic app-side calls in the wrong order (transfer → insert → delete)
-- and dropped most profile attributes on the way.
--
-- FIX: one atomic claim_shadow_profile() function — insert new profile
-- (copying ALL shadow attributes) → transfer references via the extended
-- unified function → delete shadow → log shadow_link_completed to
-- auth_events. Both handle_new_user and POST /api/admin/link-shadow-user
-- call it, so the two paths can never drift again.
--
-- Also: backfill invite_email for legacy shadows (real address stored in
-- `email`, invite_email NULL) so the deliverable-email chokepoint and the
-- invite flow work for them; guarded against uq_profiles_invite_email
-- collisions.

-- ============================================================================
-- 0. Prerequisites — enum values used by claim_shadow_profile / the trigger.
--    Idempotent re-run of 20260616020000 for environments that missed it
--    (the local stack did). Safe in-transaction: the values are only
--    referenced inside function bodies, never used in this migration.
-- ============================================================================

ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_invite_email_set';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_invite_sent';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_link_completed';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_link_failed';

-- Cloud-drift columns referenced by claim_shadow_profile below: they exist on
-- Cloud/live stacks only via out-of-band DDL (see supabase/baseline/
-- cloud_schema_2026-06-22.sql) and no repo migration creates them. Without
-- these, a from-scratch replay of the migration chain would make every claim
-- throw 'column does not exist' at runtime.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_playlist_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmed_active_at TIMESTAMPTZ;

-- ============================================================================
-- 1. Extend transfer_shadow_profile_references with the four missed tables
-- ============================================================================

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
  v_dropped INTEGER;
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
  GET DIAGNOSTICS v_dropped = ROW_COUNT;
  UPDATE student_repertoire SET student_id = p_new_id WHERE student_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('student_repertoire', v_count);
  IF v_dropped > 0 THEN
    v_result := v_result || jsonb_build_object('student_repertoire_dropped_duplicate', v_dropped);
  END IF;

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

  -- NEW 2026-07-14 (review): song-mastery audit trail — student_id has an
  -- ON DELETE CASCADE FK to profiles(id) on live stacks.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'song_status_history' AND table_schema = 'public') THEN
    UPDATE song_status_history SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('song_status_history', v_count);
  END IF;

  -- NEW 2026-07-14: chord trainer (tables added after the 2026-04-25 function)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chord_quiz_attempts' AND table_schema = 'public') THEN
    UPDATE chord_quiz_attempts SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('chord_quiz_attempts', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chord_srs' AND table_schema = 'public') THEN
    -- unique (student_id, chord_id): keep the real user's row on collision
    DELETE FROM chord_srs WHERE student_id = p_old_id
      AND chord_id IN (SELECT chord_id FROM chord_srs WHERE student_id = p_new_id);
    GET DIAGNOSTICS v_dropped = ROW_COUNT;
    UPDATE chord_srs SET student_id = p_new_id WHERE student_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('chord_srs', v_count);
    IF v_dropped > 0 THEN
      v_result := v_result || jsonb_build_object('chord_srs_dropped_duplicate', v_dropped);
    END IF;
  END IF;

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

  -- NEW 2026-07-14: user_roles — previously only handled by the (regressed)
  -- trigger, cascade-deleted on the admin path. unique (user_id, role).
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    DELETE FROM user_roles WHERE user_id = p_old_id
      AND role IN (SELECT role FROM user_roles WHERE user_id = p_new_id);
    GET DIAGNOSTICS v_dropped = ROW_COUNT;
    UPDATE user_roles SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_roles', v_count);
    IF v_dropped > 0 THEN
      v_result := v_result || jsonb_build_object('user_roles_dropped_duplicate', v_dropped);
    END IF;
  END IF;

  -- NEW 2026-07-14: task_management — never covered.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_management' AND table_schema = 'public') THEN
    UPDATE task_management SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('task_management', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings' AND table_schema = 'public') THEN
    DELETE FROM user_settings WHERE user_id = p_old_id
      AND EXISTS (SELECT 1 FROM user_settings WHERE user_id = p_new_id);
    GET DIAGNOSTICS v_dropped = ROW_COUNT;
    UPDATE user_settings SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_settings', v_count);
    IF v_dropped > 0 THEN
      v_result := v_result || jsonb_build_object('user_settings_dropped_duplicate', v_dropped);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
    DELETE FROM user_preferences WHERE user_id = p_old_id
      AND EXISTS (SELECT 1 FROM user_preferences WHERE user_id = p_new_id);
    GET DIAGNOSTICS v_dropped = ROW_COUNT;
    UPDATE user_preferences SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_preferences', v_count);
    IF v_dropped > 0 THEN
      v_result := v_result || jsonb_build_object('user_preferences_dropped_duplicate', v_dropped);
    END IF;
  END IF;

  UPDATE in_app_notifications SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('in_app_notifications', v_count);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public') THEN
    -- tr_initialize_notification_preferences seeds ALL types for a profile the
    -- moment it is inserted — which claim_shadow_profile() does in the same
    -- transaction, right before calling this function. A plain dedup would
    -- therefore always discard the old profile's explicit choices in favor of
    -- freshly-seeded defaults. Copy the old profile's `enabled` onto colliding
    -- target rows first (old explicit choice wins over a just-seeded default),
    -- then dedup and move the rest.
    UPDATE notification_preferences tgt
    SET enabled = src.enabled, updated_at = now()
    FROM notification_preferences src
    WHERE tgt.user_id = p_new_id
      AND src.user_id = p_old_id
      AND tgt.notification_type = src.notification_type
      AND tgt.enabled IS DISTINCT FROM src.enabled;
    GET DIAGNOSTICS v_dropped = ROW_COUNT;
    IF v_dropped > 0 THEN
      v_result := v_result || jsonb_build_object('notification_preferences_overwritten', v_dropped);
    END IF;
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
  GET DIAGNOSTICS v_dropped = ROW_COUNT;
  UPDATE theoretical_course_access SET user_id = p_new_id WHERE user_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('theoretical_course_access_user', v_count);
  IF v_dropped > 0 THEN
    v_result := v_result || jsonb_build_object('theoretical_course_access_dropped_duplicate', v_dropped);
  END IF;

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

  -- NEW 2026-07-14 (review): remaining SET NULL audit columns, for parity
  -- with audit_log.actor_id. Shadows rarely author changes, but a claimed
  -- teacher/orphaned profile can.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_history' AND column_name = 'changed_by' AND table_schema = 'public') THEN
    UPDATE lesson_history SET changed_by = p_new_id WHERE changed_by = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('lesson_history_changed_by', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_history' AND column_name = 'changed_by' AND table_schema = 'public') THEN
    UPDATE assignment_history SET changed_by = p_new_id WHERE changed_by = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('assignment_history_changed_by', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_history' AND column_name = 'changed_by' AND table_schema = 'public') THEN
    UPDATE user_history SET changed_by = p_new_id WHERE changed_by = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('user_history_changed_by', v_count);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'user_id' AND table_schema = 'public') THEN
    UPDATE system_logs SET user_id = p_new_id WHERE user_id = p_old_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_result := v_result || jsonb_build_object('system_logs_user', v_count);
  END IF;

  -- SELF-REFERENCING ---------------------------------------------------------

  UPDATE profiles SET parent_id = p_new_id WHERE parent_id = p_old_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('profiles_parent', v_count);

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION transfer_shadow_profile_references(UUID, UUID) IS
  'Transfers all FK references from one profile ID to another. Used during shadow user linking. Returns JSONB with row counts per table (plus *_dropped_duplicate/_overwritten counts when dedup discards rows). Extended 2026-07-14 with user_roles, task_management, chord_quiz_attempts, chord_srs, song_status_history and audit changed_by columns.';

-- SECURITY DEFINER with zero internal authz — it moves arbitrary FK references
-- between any two profiles. Supabase default privileges grant EXECUTE to
-- anon/authenticated on public functions (verified live on both stacks), which
-- exposed this as an unauthenticated-reachable PostgREST RPC. Server-side
-- callers only.
REVOKE ALL ON FUNCTION transfer_shadow_profile_references(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION transfer_shadow_profile_references(UUID, UUID) TO service_role;

-- ============================================================================
-- 2. Atomic claim function — single source of truth for BOTH claim paths
-- ============================================================================
-- Order matters (20260608000000): insert new profile FIRST so FK updates in
-- the transfer have a target row, THEN transfer, THEN delete the shadow.
-- Runs in one transaction; any failure rolls the whole claim back.

CREATE OR REPLACE FUNCTION claim_shadow_profile(
  p_old_profile_id UUID,
  p_new_user_id UUID,
  p_new_email TEXT,
  p_meta_first TEXT DEFAULT NULL,
  p_meta_last TEXT DEFAULT NULL,
  p_meta_full TEXT DEFAULT NULL,
  p_meta_avatar TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_profile profiles%ROWTYPE;
  transfer_counts JSONB;
BEGIN
  IF p_old_profile_id IS NULL OR p_new_user_id IS NULL OR p_new_email IS NULL THEN
    RAISE EXCEPTION 'claim_shadow_profile: old profile id, new user id and email are required';
  END IF;

  IF p_old_profile_id = p_new_user_id THEN
    RAISE EXCEPTION 'claim_shadow_profile: old and new ids are identical';
  END IF;

  SELECT * INTO old_profile FROM profiles WHERE id = p_old_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim_shadow_profile: profile % not found', p_old_profile_id;
  END IF;

  -- Only shadows and orphaned profiles (auth user gone / never linked) may be
  -- claimed. A profile backed by a live auth user must never be absorbed.
  IF COALESCE(old_profile.is_shadow, false) = false
     AND old_profile.user_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = old_profile.user_id AND u.id <> p_new_user_id) THEN
    RAISE EXCEPTION 'claim_shadow_profile: profile % belongs to a live auth user', p_old_profile_id;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_new_user_id) THEN
    RAISE EXCEPTION 'claim_shadow_profile: user % already has a profile', p_new_user_id;
  END IF;

  -- 1. Create the real profile, preserving everything the shadow accumulated.
  --    Signup metadata (names, avatar) wins over shadow values when present.
  --
  --    Inserted with a TEMPORARY placeholder email: profiles.email is
  --    UNIQUE (case-sensitive on some environments, unique-on-lower() on
  --    others), and for legacy shadows old_profile.email IS the address the
  --    student signs up with — inserting p_new_email while the shadow row
  --    still holds it would collide (the bug 20260608000000 fixed with a
  --    temp email; do not drop this again). The real email is set in step 4,
  --    after the shadow row is gone.
  INSERT INTO profiles (
    id, user_id, email, invite_email, is_shadow,
    first_name, last_name, full_name, avatar_url,
    notes, phone, parent_id, is_parent,
    is_admin, is_teacher, is_student, is_development, is_active,
    student_status, status_changed_at, confirmed_active_at,
    lead_source, spotify_playlist_url, onboarding_completed,
    created_at, updated_at
  ) VALUES (
    p_new_user_id, p_new_user_id,
    'claiming_' || p_new_user_id || '@placeholder.com', NULL, false,
    COALESCE(NULLIF(p_meta_first, ''), old_profile.first_name),
    COALESCE(NULLIF(p_meta_last, ''), old_profile.last_name),
    -- full_name: explicit metadata full_name wins; otherwise derive from the
    -- fresh signup first/last (which just won above) BEFORE falling back to
    -- the shadow's possibly-stale full_name.
    COALESCE(
      NULLIF(p_meta_full, ''),
      NULLIF(TRIM(CONCAT_WS(' ', NULLIF(p_meta_first, ''), NULLIF(p_meta_last, ''))), ''),
      old_profile.full_name
    ),
    COALESCE(NULLIF(p_meta_avatar, ''), old_profile.avatar_url),
    old_profile.notes, old_profile.phone, old_profile.parent_id,
    COALESCE(old_profile.is_parent, false),
    COALESCE(old_profile.is_admin, false),
    COALESCE(old_profile.is_teacher, false),
    COALESCE(old_profile.is_student, true),
    COALESCE(old_profile.is_development, false),
    -- Always active: a freshly-claimed signup must never inherit a prior
    -- soft-deactivation of the placeholder and start life locked out.
    true,
    old_profile.student_status, old_profile.status_changed_at,
    old_profile.confirmed_active_at,
    old_profile.lead_source, old_profile.spotify_playlist_url,
    COALESCE(old_profile.onboarding_completed, false),
    old_profile.created_at, now()
  );

  -- 2. Move every FK reference onto the real profile.
  transfer_counts := transfer_shadow_profile_references(p_old_profile_id, p_new_user_id);

  -- 3. Remove the shadow. All CASCADE references were already moved.
  DELETE FROM profiles WHERE id = p_old_profile_id;

  -- 4. Now that the shadow no longer holds the address, set the real email.
  UPDATE profiles SET email = p_new_email, updated_at = now()
  WHERE id = p_new_user_id;

  -- 5. Durable audit trail (spec 06 §6.3 — previously app-side/admin-path only).
  INSERT INTO auth_events (event_type, user_email, user_id, success, metadata)
  VALUES (
    'shadow_link_completed', p_new_email, p_new_user_id, true,
    jsonb_build_object(
      'shadow_profile_id', p_old_profile_id,
      'shadow_email', old_profile.email,
      'transfer_counts', transfer_counts
    )
  );

  RETURN transfer_counts;
END;
$$;

COMMENT ON FUNCTION claim_shadow_profile(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) IS
  'Atomically claims a shadow (or orphaned) profile for a real auth user: insert real profile (copying shadow attributes) → transfer_shadow_profile_references() → delete shadow → log shadow_link_completed. Single source of truth for the handle_new_user trigger AND POST /api/admin/link-shadow-user.';

-- Only server-side callers: the trigger (runs as function owner) and the
-- admin API (service role). Revoking PUBLIC also strips service_role's
-- inherited EXECUTE, so re-grant it explicitly.
REVOKE ALL ON FUNCTION claim_shadow_profile(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_shadow_profile(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 3. handle_new_user — claim via claim_shadow_profile(), never strand a user
-- ============================================================================
-- Keeps 20260622121619's invite_email-first matching and 20260622210000's
-- name persistence; restores the unified transfer and correct ordering.
-- Matching is case-insensitive (GoTrue lowercases emails; invite_email is
-- stored as typed by the teacher).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile RECORD;
  v_matched_id uuid;  -- plain uuid: safe to read in the EXCEPTION handler
                      -- even if the SELECT INTO itself threw
  meta_first text := new.raw_user_meta_data->>'first_name';
  meta_last  text := new.raw_user_meta_data->>'last_name';
  meta_full  text := new.raw_user_meta_data->>'full_name';
BEGIN
  RAISE NOTICE 'handle_new_user triggered for email=%, id=%', new.email, new.id;

  -- Prefer shadow profiles matched by invite_email (new flow: placeholder
  -- email + invite_email). Fall back to direct email match (legacy flow:
  -- real email on the shadow row; also re-links profiles orphaned by an
  -- auth-user deletion).
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE (lower(invite_email) = lower(new.email) AND is_shadow = true)
     OR lower(email) = lower(new.email)
  ORDER BY
    CASE WHEN lower(invite_email) = lower(new.email) AND is_shadow = true THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;

  v_matched_id := existing_profile.id;

  IF v_matched_id IS NOT NULL THEN
    RAISE NOTICE 'Claiming profile: old_id=%, new_id=%, email=%',
      v_matched_id, new.id, new.email;
    PERFORM public.claim_shadow_profile(
      v_matched_id, new.id, new.email,
      meta_first, meta_last, meta_full,
      new.raw_user_meta_data->>'avatar_url'
    );
  ELSE
    INSERT INTO public.profiles (
      id, user_id, email, first_name, last_name, full_name, avatar_url
    )
    VALUES (
      new.id, new.id, new.email,
      NULLIF(meta_first, ''),
      NULLIF(meta_last, ''),
      COALESCE(
        NULLIF(meta_full, ''),
        NULLIF(TRIM(CONCAT_WS(' ', meta_first, meta_last)), '')
      ),
      new.raw_user_meta_data->>'avatar_url'
    );
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for email %: % %', new.email, SQLERRM, SQLSTATE;

    -- Never strand the auth user: give them a minimal profile so the app is
    -- usable and the shadow (still intact — the claim rolled back atomically)
    -- can be linked later via POST /api/admin/link-shadow-user.
    BEGIN
      INSERT INTO public.profiles (id, user_id, email)
      VALUES (new.id, new.id, new.email)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN unique_violation THEN
        -- profiles.email is UNIQUE and the intact shadow may still hold this
        -- address. A recovery placeholder still beats no profile at all; the
        -- admin link flow replaces it with the real address on claim.
        BEGIN
          INSERT INTO public.profiles (id, user_id, email)
          VALUES (new.id, new.id, 'recovery_' || new.id || '@placeholder.com')
          ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'handle_new_user recovery profile insert failed for %: %', new.email, SQLERRM;
        END;
      WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user fallback profile insert failed for %: %', new.email, SQLERRM;
    END;

    -- Durable trace of the failed claim (only when a claim was attempted).
    IF v_matched_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.auth_events (event_type, user_email, user_id, success, error_message, metadata)
        VALUES (
          'shadow_link_failed', new.email, new.id, false, SQLERRM,
          jsonb_build_object('shadow_profile_id', v_matched_id, 'source', 'handle_new_user')
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    RETURN new;
END;
$function$;

-- ============================================================================
-- 4. Backfill invite_email for legacy shadows
-- ============================================================================
-- Import-created shadows store the student's real address in `email` and have
-- invite_email NULL, which makes getDeliverableEmail() skip them even though
-- the address is known, and blocks the invite flow. Copy email → invite_email
-- where it is unambiguous; skip placeholder addresses and anything that would
-- collide with another profile's email/invite_email (uq_profiles_invite_email).

DO $$
DECLARE
  v_backfilled INTEGER;
BEGIN
  UPDATE profiles p
  SET invite_email = p.email
  WHERE p.is_shadow = true
    AND p.invite_email IS NULL
    AND p.email IS NOT NULL
    AND p.email <> ''
    AND p.email NOT LIKE '%@placeholder.com'
    AND NOT EXISTS (
      SELECT 1 FROM profiles q
      WHERE q.id <> p.id
        AND (lower(q.email) = lower(p.email) OR lower(q.invite_email) = lower(p.email))
    );
  GET DIAGNOSTICS v_backfilled = ROW_COUNT;
  RAISE NOTICE 'Backfilled invite_email for % legacy shadow profile(s)', v_backfilled;
END;
$$;

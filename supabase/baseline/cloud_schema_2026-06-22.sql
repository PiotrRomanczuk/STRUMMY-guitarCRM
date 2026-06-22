--
-- PostgreSQL database dump
--

\restrict Jzp5N6FcQ6RJEbOStdkRsaYIaC3OPBIFtowIdIbReWIRxB82vkOwBhd8TAnuPdq

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: ai_context_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_context_type AS ENUM (
    'general',
    'student',
    'lesson',
    'song',
    'assignment',
    'practice'
);


--
-- Name: ai_generation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_generation_type AS ENUM (
    'lesson_notes',
    'assignment',
    'email_draft',
    'post_lesson_summary',
    'student_progress',
    'admin_insights',
    'chat'
);


--
-- Name: TYPE ai_generation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.ai_generation_type IS 'Types of AI generation outputs';


--
-- Name: ai_message_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_message_role AS ENUM (
    'system',
    'user',
    'assistant'
);


--
-- Name: ai_prompt_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_prompt_category AS ENUM (
    'email',
    'lesson_notes',
    'practice_plan',
    'progress_report',
    'feedback',
    'reminder',
    'custom'
);


--
-- Name: assignment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_status AS ENUM (
    'not_started',
    'pending',
    'in_progress',
    'completed',
    'overdue',
    'cancelled'
);


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'created',
    'updated',
    'deleted',
    'status_changed',
    'rescheduled',
    'cancelled',
    'completed',
    'role_changed'
);


--
-- Name: audit_entity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_entity AS ENUM (
    'profile',
    'lesson',
    'assignment',
    'song',
    'song_progress'
);


--
-- Name: auth_email_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auth_email_status AS ENUM (
    'not_applicable',
    'sent',
    'failed',
    'skipped'
);


--
-- Name: auth_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auth_event_type AS ENUM (
    'signup_attempted',
    'signup_succeeded',
    'signup_failed',
    'email_confirmed',
    'invite_sent',
    'invite_failed',
    'user_created_by_admin',
    'shadow_user_created',
    'signin_succeeded',
    'signin_failed',
    'signin_locked',
    'signin_rate_limited',
    'password_reset_requested',
    'password_reset_failed',
    'resend_verification_requested',
    'resend_verification_failed',
    'shadow_invite_email_set',
    'shadow_invite_sent',
    'shadow_link_completed',
    'shadow_link_failed'
);


--
-- Name: difficulty_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.difficulty_level AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


--
-- Name: email_address; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.email_address AS text
	CONSTRAINT email_address_check CHECK ((VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text));


--
-- Name: DOMAIN email_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.email_address IS 'Email address with basic format validation';


--
-- Name: lesson_song_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_song_status AS ENUM (
    'to_learn',
    'started',
    'remembered',
    'slow_tempo',
    'with_author',
    'mastered'
);


--
-- Name: lesson_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED'
);


--
-- Name: log_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.log_level AS ENUM (
    'debug',
    'info',
    'warn',
    'error'
);


--
-- Name: long_text; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.long_text AS character varying(50000);


--
-- Name: DOMAIN long_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.long_text IS 'Text limited to 50000 characters - for long content';


--
-- Name: medium_text; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.medium_text AS character varying(5000);


--
-- Name: DOMAIN medium_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.medium_text IS 'Text limited to 5000 characters - for descriptions, notes';


--
-- Name: music_key; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.music_key AS ENUM (
    'C',
    'C#',
    'Db',
    'D',
    'D#',
    'Eb',
    'E',
    'F',
    'F#',
    'Gb',
    'G',
    'G#',
    'Ab',
    'A',
    'A#',
    'Bb',
    'B',
    'Cm',
    'C#m',
    'Dm',
    'D#m',
    'Ebm',
    'Em',
    'Fm',
    'F#m',
    'Gm',
    'G#m',
    'Am',
    'A#m',
    'Bbm',
    'Bm'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'bounced',
    'skipped',
    'cancelled'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'lesson_reminder_24h',
    'lesson_recap',
    'lesson_cancelled',
    'lesson_rescheduled',
    'assignment_created',
    'assignment_due_reminder',
    'assignment_overdue_alert',
    'assignment_completed',
    'song_mastery_achievement',
    'milestone_reached',
    'student_welcome',
    'trial_ending_reminder',
    'teacher_daily_summary',
    'weekly_progress_digest',
    'calendar_conflict_alert',
    'webhook_expiration_notice',
    'admin_error_alert'
);


--
-- Name: percentage; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.percentage AS integer
	CONSTRAINT percentage_check CHECK (((VALUE IS NULL) OR ((VALUE >= 0) AND (VALUE <= 100))));


--
-- Name: DOMAIN percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.percentage IS 'Integer between 0 and 100';


--
-- Name: positive_int; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.positive_int AS integer
	CONSTRAINT positive_int_check CHECK (((VALUE IS NULL) OR (VALUE > 0)));


--
-- Name: DOMAIN positive_int; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.positive_int IS 'Positive integer for counts and durations';


--
-- Name: short_text; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.short_text AS character varying(500);


--
-- Name: DOMAIN short_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.short_text IS 'Text limited to 500 characters - for titles, names';


--
-- Name: song_progress_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.song_progress_status AS ENUM (
    'to_learn',
    'started',
    'remembered',
    'with_author',
    'mastered'
);


--
-- Name: TYPE song_progress_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.song_progress_status IS 'Linear song learning progression (no backwards movement)';


--
-- Name: student_pipeline_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.student_pipeline_status AS ENUM (
    'lead',
    'trial',
    'active',
    'inactive',
    'churned'
);


--
-- Name: student_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.student_status AS ENUM (
    'active',
    'archived'
);


--
-- Name: url; Type: DOMAIN; Schema: public; Owner: -
--

CREATE DOMAIN public.url AS text
	CONSTRAINT url_check CHECK (((VALUE IS NULL) OR (VALUE ~* '^https?://'::text)));


--
-- Name: DOMAIN url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON DOMAIN public.url IS 'URL with http/https protocol validation';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'teacher',
    'student'
);


--
-- Name: check_auth_rate_limit(text, text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INTEGER FROM auth_rate_limits
  WHERE identifier = p_identifier AND operation = p_operation
    AND attempted_at > now() - (p_window_ms || ' milliseconds')::interval;
$$;


--
-- Name: FUNCTION check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint) IS 'Count auth attempts in a time window for rate limiting';


--
-- Name: cleanup_auth_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_auth_rate_limits() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
  DELETE FROM auth_rate_limits WHERE attempted_at < now() - interval '2 hours';
$$;


--
-- Name: FUNCTION cleanup_auth_rate_limits(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cleanup_auth_rate_limits() IS 'Remove expired auth rate limit entries older than 2 hours';


--
-- Name: find_similar_songs(text, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_similar_songs(search_title text, threshold double precision DEFAULT 0.3, max_results integer DEFAULT 5) RETURNS TABLE(id uuid, title character varying, author character varying, similarity double precision)
    LANGUAGE sql STABLE
    AS $$
    SELECT s.id, s.title, s.author, similarity(s.title, search_title) AS similarity
    FROM songs s
    WHERE s.deleted_at IS NULL
      AND similarity(s.title, search_title) >= threshold
    ORDER BY similarity(s.title, search_title) DESC
    LIMIT max_results;
$$;


--
-- Name: FUNCTION find_similar_songs(search_title text, threshold double precision, max_results integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.find_similar_songs(search_title text, threshold double precision, max_results integer) IS 'Finds songs with similar titles using trigram matching for CSV import';


--
-- Name: fn_record_progress_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_record_progress_history() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO song_status_history (
      student_id,
      song_id,
      previous_status,
      new_status,
      changed_at
    ) VALUES (
      NEW.student_id,
      NEW.song_id,
      OLD.current_status::text,
      NEW.current_status::text,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_sync_lesson_song_to_repertoire(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sync_lesson_song_to_repertoire() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_student_id     UUID;
    v_repertoire_id  UUID;
    v_current_status song_progress_status;
    v_new_status     song_progress_status;
    v_status_order   TEXT[] := ARRAY['to_learn','started','remembered','with_author','mastered'];
    v_new_idx        INT;
    v_cur_idx        INT;
BEGIN
    v_new_status := NEW.status::TEXT::song_progress_status;

    SELECT student_id INTO v_student_id
    FROM lessons
    WHERE id = NEW.lesson_id;

    IF v_student_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO student_repertoire (student_id, song_id, current_status)
    VALUES (v_student_id, NEW.song_id, v_new_status)
    ON CONFLICT (student_id, song_id) DO NOTHING;

    SELECT id, current_status
    INTO v_repertoire_id, v_current_status
    FROM student_repertoire
    WHERE student_id = v_student_id AND song_id = NEW.song_id;

    IF NEW.repertoire_id IS NULL THEN
        NEW.repertoire_id := v_repertoire_id;
    END IF;

    v_new_idx := array_position(v_status_order, NEW.status::TEXT);
    v_cur_idx  := array_position(v_status_order, v_current_status::TEXT);

    IF v_new_idx > v_cur_idx THEN
        UPDATE student_repertoire
        SET
            current_status = v_new_status,
            started_at = CASE
                WHEN v_cur_idx = 1 AND started_at IS NULL THEN now()
                ELSE started_at
            END,
            mastered_at = CASE
                WHEN v_new_idx = 5 AND mastered_at IS NULL THEN now()
                ELSE mastered_at
            END
        WHERE id = v_repertoire_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: get_bounce_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_bounce_stats() RETURNS TABLE(notification_type text, bounce_count bigint, total_sent bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT nl.notification_type::text,
        COUNT(*) FILTER (WHERE nl.status = 'bounced') AS bounce_count,
        COUNT(*) AS total_sent
    FROM notification_log nl WHERE nl.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY nl.notification_type HAVING COUNT(*) FILTER (WHERE nl.status = 'bounced') > 0
    ORDER BY COUNT(*) FILTER (WHERE nl.status = 'bounced') DESC;
END; $$;


--
-- Name: get_pending_notifications(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_notifications(batch_size integer DEFAULT 100) RETURNS TABLE(id uuid, notification_type public.notification_type, recipient_user_id uuid, recipient_email text, template_data jsonb, scheduled_for timestamp with time zone, priority integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT nq.id, nq.notification_type, nq.recipient_user_id, p.email, nq.template_data, nq.scheduled_for, nq.priority
    FROM notification_queue nq JOIN profiles p ON p.id = nq.recipient_user_id
    WHERE nq.status = 'pending' AND nq.scheduled_for <= now()
    ORDER BY nq.priority DESC, nq.scheduled_for ASC LIMIT batch_size FOR UPDATE SKIP LOCKED;
END; $$;


--
-- Name: get_system_email_count_last_hour(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_system_email_count_last_hour() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT COUNT(*)::INTEGER FROM notification_log
    WHERE status IN ('sent', 'pending') AND created_at > now() - interval '1 hour';
$$;


--
-- Name: get_user_email_count_last_hour(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_email_count_last_hour(p_user_id uuid) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT COUNT(*)::INTEGER FROM notification_log
    WHERE recipient_user_id = p_user_id AND status IN ('sent', 'pending')
      AND created_at > now() - interval '1 hour';
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  existing_profile RECORD;
  old_profile_id uuid;
BEGIN
  RAISE NOTICE 'handle_new_user triggered for email=%, id=%', new.email, new.id;

  -- Prefer shadow profiles matched by invite_email (new flow: placeholder email + invite_email).
  -- Fall back to direct email match (legacy flow: real email on profile).
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE (invite_email = new.email AND is_shadow = true)
     OR email = new.email
  ORDER BY
    -- invite_email match wins over email match
    CASE WHEN invite_email = new.email AND is_shadow = true THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;

  IF existing_profile.id IS NOT NULL THEN
    old_profile_id := existing_profile.id;
    RAISE NOTICE 'Linking profile: old_id=%, new_id=%, email=%', old_profile_id, new.id, new.email;

    UPDATE public.lessons   SET student_id = new.id WHERE student_id = old_profile_id;
    UPDATE public.lessons   SET teacher_id = new.id WHERE teacher_id = old_profile_id;
    UPDATE public.assignments SET student_id = new.id WHERE student_id = old_profile_id;
    UPDATE public.assignments SET teacher_id = new.id WHERE teacher_id = old_profile_id;
    UPDATE public.user_roles  SET user_id   = new.id WHERE user_id   = old_profile_id;

    DELETE FROM public.profiles WHERE id = old_profile_id;

    INSERT INTO public.profiles (
      id, user_id, email, full_name, avatar_url, notes, phone,
      is_admin, is_teacher, is_student, is_development, created_at, updated_at
    ) VALUES (
      new.id, new.id, new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', existing_profile.full_name),
      COALESCE(new.raw_user_meta_data->>'avatar_url', existing_profile.avatar_url),
      existing_profile.notes, existing_profile.phone,
      existing_profile.is_admin, existing_profile.is_teacher,
      existing_profile.is_student, existing_profile.is_development,
      existing_profile.created_at, now()
    );

  ELSE
    INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url)
    VALUES (new.id, new.id, new.email,
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'avatar_url');
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for email %: % %', new.email, SQLERRM, SQLSTATE;
    RETURN new;
END;
$$;


--
-- Name: has_active_lesson_assignments(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_active_lesson_assignments(song_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM lesson_songs ls
        JOIN lessons l ON ls.lesson_id = l.id
        WHERE ls.song_id = song_uuid
        AND l.status IN ('SCHEDULED', 'IN_PROGRESS')
    );
END;
$$;


--
-- Name: has_role(public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_role public.user_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = _role
  );
$$;


--
-- Name: increment_sign_in_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_sign_in_count(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET sign_in_count = sign_in_count + 1,
      last_sign_in_at = NOW()
  WHERE id = p_user_id;
END;
$$;


--
-- Name: initialize_notification_preferences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_notification_preferences() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    notification_types TEXT[] := ARRAY[
        'lesson_reminder_24h','lesson_recap','lesson_cancelled','lesson_rescheduled',
        'assignment_created','assignment_due_reminder','assignment_overdue_alert',
        'assignment_completed','song_mastery_achievement','milestone_reached',
        'student_welcome','trial_ending_reminder','teacher_daily_summary',
        'weekly_progress_digest','calendar_conflict_alert','webhook_expiration_notice',
        'admin_error_alert'
    ];
    notification_type_val TEXT;
BEGIN
    FOREACH notification_type_val IN ARRAY notification_types LOOP
        INSERT INTO notification_preferences (user_id, notification_type, enabled)
        VALUES (NEW.id, notification_type_val::notification_type,
            CASE WHEN notification_type_val IN ('weekly_progress_digest','teacher_daily_summary') THEN false ELSE true END)
        ON CONFLICT (user_id, notification_type) DO NOTHING;
    END LOOP;
    RETURN NEW;
END; $$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;


--
-- Name: is_admin_or_teacher(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_teacher() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT COALESCE(
        (SELECT is_admin OR is_teacher FROM profiles WHERE id = auth.uid()),
        false
    );
$$;


--
-- Name: is_child_of_parent(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_child_of_parent(_student_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _student_id
      AND parent_id = auth.uid()
  );
$$;


--
-- Name: is_notification_enabled(uuid, public.notification_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_notification_enabled(p_user_id uuid, p_notification_type public.notification_type) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE preference_enabled BOOLEAN;
BEGIN
    SELECT enabled INTO preference_enabled FROM notification_preferences
    WHERE user_id = p_user_id AND notification_type = p_notification_type;
    RETURN COALESCE(preference_enabled, true);
END; $$;


--
-- Name: is_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_parent() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_parent = true
  );
$$;


--
-- Name: is_student(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_student() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT is_student FROM profiles WHERE id = auth.uid()),
    false
  );
$$;


--
-- Name: is_teacher(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_teacher() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT is_teacher FROM profiles WHERE id = auth.uid()),
    false
  );
$$;


--
-- Name: jsonb_diff(jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.jsonb_diff(left_val jsonb, right_val jsonb) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT COALESCE(
    jsonb_object_agg(key, value),
    '{}'::jsonb
  )
  FROM jsonb_each(left_val)
  WHERE right_val -> key IS DISTINCT FROM value;
$$;


--
-- Name: refresh_song_engagement(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_song_engagement() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_song_engagement;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_song_popularity;
END;
$$;


--
-- Name: reverse_song_progress_from_practice(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reverse_song_progress_from_practice() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF OLD.song_id IS NOT NULL THEN
        UPDATE student_song_progress SET
            total_practice_minutes = GREATEST(total_practice_minutes - OLD.duration_minutes, 0),
            practice_session_count = GREATEST(practice_session_count - 1, 0),
            last_practiced_at = (
                SELECT MAX(ps.created_at) FROM practice_sessions ps
                WHERE ps.student_id = OLD.student_id AND ps.song_id = OLD.song_id
            )
        WHERE student_id = OLD.student_id AND song_id = OLD.song_id;
    END IF;
    RETURN OLD;
END; $$;


--
-- Name: FUNCTION reverse_song_progress_from_practice(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.reverse_song_progress_from_practice() IS 'Reverses practice metrics when a session is undone (same-day delete).';


--
-- Name: set_lesson_numbers(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_lesson_numbers() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Find the next lesson_teacher_number for this teacher-student pair
    SELECT COALESCE(MAX(lesson_teacher_number), 0) + 1 INTO next_number
    FROM lessons
    WHERE teacher_id = NEW.teacher_id AND student_id = NEW.student_id;

    -- Set the lesson_teacher_number for the new lesson
    NEW.lesson_teacher_number := next_number;

    RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION set_updated_at(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.set_updated_at() IS 'Generic trigger function to auto-update updated_at timestamp';


--
-- Name: soft_delete_song_with_cascade(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soft_delete_song_with_cascade(song_uuid uuid, user_uuid uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    song_record RECORD;
    lesson_assignments_count INTEGER;
    result JSON;
BEGIN
    -- Check if song exists and is not already deleted
    SELECT * INTO song_record FROM songs WHERE id = song_uuid AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Song not found or already deleted');
    END IF;

    -- Check for active lesson assignments
    IF has_active_lesson_assignments(song_uuid) THEN
        RETURN json_build_object('success', false, 'error', 'Cannot delete song with active lesson assignments');
    END IF;

    -- Count related records before deletion
    SELECT COUNT(*) INTO lesson_assignments_count FROM lesson_songs WHERE song_id = song_uuid;

    -- Soft delete the song
    UPDATE songs SET deleted_at = NOW() WHERE id = song_uuid;

    -- Cascade: Remove lesson song assignments (hard delete since they're junction records)
    DELETE FROM lesson_songs WHERE song_id = song_uuid;

    -- Return success with counts
    RETURN json_build_object(
        'success', true,
        'lesson_assignments_removed', lesson_assignments_count,
        'favorite_assignments_removed', 0
    );
END;
$$;


--
-- Name: sync_full_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_full_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only sync if first_name or last_name actually changed
  IF (NEW.first_name IS DISTINCT FROM OLD.first_name)
     OR (NEW.last_name IS DISTINCT FROM OLD.last_name) THEN
    NEW.full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    IF NEW.full_name = '' THEN
      NEW.full_name := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_profile_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_profile_roles() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Handle Admin
  IF NEW.is_admin = true THEN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM user_roles WHERE user_id = NEW.id AND role = 'admin';
  END IF;

  -- Handle Teacher
  IF NEW.is_teacher = true THEN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM user_roles WHERE user_id = NEW.id AND role = 'teacher';
  END IF;

  -- Handle Student
  IF NEW.is_student = true THEN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM user_roles WHERE user_id = NEW.id AND role = 'student';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: sync_song_video_published_flag(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_song_video_published_flag() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_video_id uuid;
    any_published_tiktok boolean; any_published_instagram boolean; any_published_youtube boolean;
BEGIN
    target_video_id := COALESCE(NEW.song_video_id, OLD.song_video_id);
    IF target_video_id IS NULL THEN RETURN NEW; END IF;
    SELECT
        bool_or(platform = 'tiktok' AND status = 'published'),
        bool_or(platform = 'instagram' AND status = 'published'),
        bool_or(platform = 'youtube_shorts' AND status = 'published')
    INTO any_published_tiktok, any_published_instagram, any_published_youtube
    FROM content_posts WHERE song_video_id = target_video_id;
    UPDATE song_videos SET
        published_to_tiktok = COALESCE(any_published_tiktok, false),
        published_to_instagram = COALESCE(any_published_instagram, false),
        published_to_youtube_shorts = COALESCE(any_published_youtube, false)
    WHERE id = target_video_id;
    RETURN NEW;
END; $$;


--
-- Name: title_case(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.title_case(input text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT string_agg(
    CASE 
      WHEN word IN ('a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'is', 'it', 'my', 'no')
        AND ordinality > 1
      THEN word
      ELSE upper(left(word, 1)) || substring(word from 2)
    END, ' ')
  FROM unnest(string_to_array(input, ' ')) WITH ORDINALITY AS t(word, ordinality)
$$;


--
-- Name: tr_audit_assignments(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_audit_assignments() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_action audit_action; v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_action := 'created'; v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN v_action := 'status_changed'; ELSE v_action := 'updated'; END IF;
        v_changes := jsonb_build_object('old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))), 'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD))));
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted'; v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('assignment', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;
    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('assignment', NEW.id, auth.uid(), v_action, v_changes);
    RETURN NEW;
END; $$;


--
-- Name: tr_audit_lessons(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_audit_lessons() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_action audit_action; v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_action := 'created'; v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'CANCELLED' THEN v_action := 'cancelled';
            ELSIF NEW.status = 'COMPLETED' THEN v_action := 'completed';
            ELSIF NEW.status = 'RESCHEDULED' THEN v_action := 'rescheduled';
            ELSE v_action := 'status_changed'; END IF;
        ELSIF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN v_action := 'rescheduled';
        ELSE v_action := 'updated'; END IF;
        v_changes := jsonb_build_object('old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))), 'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD))));
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted'; v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('lesson', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;
    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('lesson', NEW.id, auth.uid(), v_action, v_changes);
    RETURN NEW;
END; $$;


--
-- Name: tr_audit_profiles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_audit_profiles() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_action audit_action; v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_action := 'created'; v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR (OLD.is_teacher IS DISTINCT FROM NEW.is_teacher) OR (OLD.is_student IS DISTINCT FROM NEW.is_student) THEN v_action := 'role_changed'; ELSE v_action := 'updated'; END IF;
        v_changes := jsonb_build_object('old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))), 'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD))));
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted'; v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('profile', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;
    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('profile', NEW.id, auth.uid(), v_action, v_changes);
    RETURN NEW;
END; $$;


--
-- Name: tr_audit_song_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_audit_song_progress() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_action audit_action; v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN v_action := 'created'; v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN v_action := 'status_changed'; ELSE v_action := 'updated'; END IF;
        v_changes := jsonb_build_object('old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))), 'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD))));
    END IF;
    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes) VALUES ('song_progress', NEW.id, auth.uid(), v_action, v_changes);
    RETURN NEW;
END; $$;


--
-- Name: tr_notify_lesson_cancelled(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_notify_lesson_cancelled() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT; v_teacher_name TEXT;
    v_lesson_date TEXT; v_lesson_time TEXT; v_template_data JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'CANCELLED' THEN
        SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.student_id;
        SELECT full_name INTO v_teacher_name FROM profiles WHERE id = NEW.teacher_id;
        v_lesson_date := to_char(NEW.scheduled_at, 'Day, Month DD, YYYY');
        v_lesson_time := to_char(NEW.scheduled_at, 'HH:MI AM');
        v_template_data := jsonb_build_object(
            'studentName', COALESCE(v_student_name, 'Student'),
            'teacherName', COALESCE(v_teacher_name, 'Your Teacher'),
            'lessonDate', v_lesson_date, 'lessonTime', v_lesson_time,
            'reason', COALESCE(NEW.notes, ''),
            'rescheduleLink', format('%s/dashboard/lessons',
                COALESCE(current_setting('app.base_url', true), 'https://example.com'))
        );
        INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
        VALUES ('lesson_cancelled', NEW.student_id, v_template_data, now(), 8, 'lesson', NEW.id);
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: tr_notify_lesson_completed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_notify_lesson_completed() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT; v_teacher_name TEXT;
    v_lesson_date TEXT; v_lesson_title TEXT; v_songs JSONB; v_template_data JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'COMPLETED' THEN
        SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.student_id;
        SELECT full_name INTO v_teacher_name FROM profiles WHERE id = NEW.teacher_id;
        v_lesson_date := to_char(NEW.scheduled_at, 'Month DD, YYYY');
        v_lesson_title := COALESCE(NEW.title, 'Guitar Lesson');
        SELECT jsonb_agg(jsonb_build_object('title', s.title, 'artist', s.author, 'status', ls.status))
        INTO v_songs FROM lesson_songs ls JOIN songs s ON s.id = ls.song_id WHERE ls.lesson_id = NEW.id;
        v_template_data := jsonb_build_object(
            'studentName', COALESCE(v_student_name, 'Student'),
            'teacherName', COALESCE(v_teacher_name, 'Your Teacher'),
            'lessonDate', v_lesson_date, 'lessonTitle', v_lesson_title,
            'songsWorkedOn', COALESCE(v_songs, '[]'::jsonb),
            'notes', COALESCE(NEW.notes, ''), 'nextLessonDate', NULL
        );
        INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
        VALUES ('lesson_recap', NEW.student_id, v_template_data, now() + interval '1 hour', 5, 'lesson', NEW.id);
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: tr_notify_lesson_rescheduled(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_notify_lesson_rescheduled() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT; v_teacher_name TEXT;
    v_old_date TEXT; v_old_time TEXT; v_new_date TEXT; v_new_time TEXT; v_template_data JSONB;
BEGIN
    IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at AND NEW.status != 'CANCELLED' THEN
        SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.student_id;
        SELECT full_name INTO v_teacher_name FROM profiles WHERE id = NEW.teacher_id;
        v_old_date := to_char(OLD.scheduled_at, 'Day, Month DD, YYYY');
        v_old_time := to_char(OLD.scheduled_at, 'HH:MI AM');
        v_new_date := to_char(NEW.scheduled_at, 'Day, Month DD, YYYY');
        v_new_time := to_char(NEW.scheduled_at, 'HH:MI AM');
        v_template_data := jsonb_build_object(
            'studentName', COALESCE(v_student_name, 'Student'),
            'teacherName', COALESCE(v_teacher_name, 'Your Teacher'),
            'oldDate', v_old_date, 'oldTime', v_old_time,
            'newDate', v_new_date, 'newTime', v_new_time
        );
        INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
        VALUES ('lesson_rescheduled', NEW.student_id, v_template_data, now(), 8, 'lesson', NEW.id);
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: tr_notify_song_mastery(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_notify_song_mastery() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_student_id UUID; v_student_name TEXT;
    v_song_title TEXT; v_song_artist TEXT;
    v_mastered_date TEXT; v_total_mastered INT; v_template_data JSONB;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'mastered' THEN
        SELECT student_id INTO v_student_id FROM lessons WHERE id = NEW.lesson_id;
        SELECT full_name INTO v_student_name FROM profiles WHERE id = v_student_id;
        SELECT title, author INTO v_song_title, v_song_artist FROM songs WHERE id = NEW.song_id;
        v_mastered_date := to_char(now(), 'Month DD, YYYY');
        SELECT COUNT(DISTINCT ls.song_id) INTO v_total_mastered
        FROM lesson_songs ls JOIN lessons l ON l.id = ls.lesson_id
        WHERE l.student_id = v_student_id AND ls.status = 'mastered';
        v_template_data := jsonb_build_object(
            'studentName', COALESCE(v_student_name, 'Student'),
            'songTitle', COALESCE(v_song_title, 'Unknown Song'),
            'songArtist', COALESCE(v_song_artist, 'Unknown Artist'),
            'masteredDate', v_mastered_date, 'totalSongsMastered', v_total_mastered
        );
        INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
        VALUES ('song_mastery_achievement', v_student_id, v_template_data, now(), 6, 'song_progress', NEW.id);
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: tr_notify_student_welcome(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tr_notify_student_welcome() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_teacher_name TEXT; v_template_data JSONB; v_base_url TEXT;
BEGIN
    IF NEW.is_student = true AND NOT NEW.is_shadow THEN
        IF TG_OP = 'INSERT' THEN
            SELECT p.full_name INTO v_teacher_name FROM profiles p
            JOIN lessons l ON l.teacher_id = p.id WHERE l.student_id = NEW.id LIMIT 1;
            v_base_url := COALESCE(current_setting('app.base_url', true), 'https://example.com');
            v_template_data := jsonb_build_object(
                'studentName', COALESCE(NEW.full_name, 'Student'),
                'teacherName', COALESCE(v_teacher_name, 'Your Teacher'),
                'loginLink', format('%s/dashboard', v_base_url), 'firstLessonDate', NULL
            );
            INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
            VALUES ('student_welcome', NEW.id, v_template_data, now(), 7, 'profile', NEW.id);
        ELSIF TG_OP = 'UPDATE' AND OLD.is_shadow = true AND NEW.is_shadow = false THEN
            SELECT p.full_name INTO v_teacher_name FROM profiles p
            JOIN lessons l ON l.teacher_id = p.id WHERE l.student_id = NEW.id LIMIT 1;
            v_base_url := COALESCE(current_setting('app.base_url', true), 'https://example.com');
            v_template_data := jsonb_build_object(
                'studentName', COALESCE(NEW.full_name, 'Student'),
                'teacherName', COALESCE(v_teacher_name, 'Your Teacher'),
                'loginLink', format('%s/dashboard', v_base_url), 'firstLessonDate', NULL
            );
            INSERT INTO notification_queue (notification_type, recipient_user_id, template_data, scheduled_for, priority, entity_type, entity_id)
            VALUES ('student_welcome', NEW.id, v_template_data, now(), 7, 'profile', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END; $$;


--
-- Name: track_assignment_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_assignment_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    change_type_value TEXT;
    previous_data_value JSONB;
    new_data_value JSONB;
BEGIN
    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        change_type_value := 'created';
        previous_data_value := NULL;
        new_data_value := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            change_type_value := 'status_changed';
        ELSE
            change_type_value := 'updated';
        END IF;
        previous_data_value := to_jsonb(OLD);
        new_data_value := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        change_type_value := 'deleted';
        previous_data_value := to_jsonb(OLD);
        new_data_value := to_jsonb(OLD);
        
        -- Insert history record for deletion
        INSERT INTO assignment_history (
            assignment_id,
            changed_by,
            change_type,
            previous_data,
            new_data,
            changed_at
        ) VALUES (
            OLD.id,
            COALESCE(auth.uid(), OLD.teacher_id),
            change_type_value,
            previous_data_value,
            new_data_value,
            now()
        );
        
        RETURN OLD;
    END IF;

    -- Insert history record
    INSERT INTO assignment_history (
        assignment_id,
        changed_by,
        change_type,
        previous_data,
        new_data,
        changed_at
    ) VALUES (
        NEW.id,
        COALESCE(auth.uid(), NEW.teacher_id),
        change_type_value,
        previous_data_value,
        new_data_value,
        now()
    );

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION track_assignment_changes(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.track_assignment_changes() IS 'Automatically tracks all assignment changes to assignment_history table';


--
-- Name: track_lesson_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_lesson_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    change_type_value TEXT;
    previous_data_value JSONB;
    new_data_value JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        change_type_value := 'created';
        previous_data_value := NULL;
        new_data_value := to_jsonb(NEW);

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'cancelled'  THEN change_type_value := 'cancelled';
            ELSIF NEW.status = 'completed' THEN change_type_value := 'completed';
            ELSE change_type_value := 'status_changed';
            END IF;
        ELSIF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
            change_type_value := 'rescheduled';
        ELSE
            change_type_value := 'updated';
        END IF;
        previous_data_value := to_jsonb(OLD);
        new_data_value := to_jsonb(NEW);

    ELSIF TG_OP = 'DELETE' THEN
        -- AFTER DELETE: the lesson row is already gone so the FK on
        -- lesson_history.lesson_id would fail. Best-effort: log and continue.
        BEGIN
            INSERT INTO lesson_history (lesson_id, changed_by, change_type, previous_data, new_data, changed_at)
            VALUES (OLD.id, COALESCE(auth.uid(), OLD.teacher_id), 'deleted', to_jsonb(OLD), to_jsonb(OLD), now());
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'track_lesson_changes DELETE audit skipped for lesson %: %', OLD.id, SQLERRM;
        END;
        RETURN OLD;
    END IF;

    INSERT INTO lesson_history (lesson_id, changed_by, change_type, previous_data, new_data, changed_at)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.teacher_id), change_type_value, previous_data_value, new_data_value, now());

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION track_lesson_changes(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.track_lesson_changes() IS 'Automatically tracks all lesson changes to lesson_history table';


--
-- Name: track_song_status_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_song_status_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    student_id_value UUID;
BEGIN
    -- Get student_id from the lesson
    SELECT l.student_id INTO student_id_value
    FROM lessons l
    WHERE l.id = NEW.lesson_id;

    -- Only track if status changed
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO song_status_history (
            student_id,
            song_id,
            previous_status,
            new_status,
            changed_at
        ) VALUES (
            student_id_value,
            NEW.song_id,
            OLD.status,
            NEW.status,
            now()
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO song_status_history (
            student_id,
            song_id,
            previous_status,
            new_status,
            changed_at
        ) VALUES (
            student_id_value,
            NEW.song_id,
            NULL,
            NEW.status,
            now()
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION track_song_status_changes(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.track_song_status_changes() IS 'Automatically tracks song status changes to song_status_history table';


--
-- Name: track_user_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_user_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- INSERT: New user created
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO user_history (
      user_id,
      changed_by,
      change_type,
      previous_data,
      new_data
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;

  -- UPDATE: User profile modified
  IF (TG_OP = 'UPDATE') THEN
    DECLARE
      v_change_type TEXT := 'updated';
    BEGIN
      -- Check for role flag changes instead of non-existent 'role' column
      IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR
         (OLD.is_teacher IS DISTINCT FROM NEW.is_teacher) OR
         (OLD.is_student IS DISTINCT FROM NEW.is_student) THEN
        v_change_type := 'role_changed';
      ELSIF (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        v_change_type := 'status_changed';
      END IF;

      INSERT INTO user_history (
        user_id,
        changed_by,
        change_type,
        previous_data,
        new_data
      ) VALUES (
        NEW.id,
        auth.uid(),
        v_change_type,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    END;
    RETURN NEW;
  END IF;

  -- DELETE: User deleted
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO user_history (
      user_id,
      changed_by,
      change_type,
      previous_data,
      new_data
    ) VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION track_user_changes(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.track_user_changes() IS 'Automatically tracks all changes to user profiles';


--
-- Name: update_notification_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notification_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


--
-- Name: update_song_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_song_requests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_spotify_matches_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_spotify_matches_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_sync_conflicts_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_sync_conflicts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_execution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id text NOT NULL,
    request_id text NOT NULL,
    user_id uuid,
    successful boolean NOT NULL,
    execution_time integer NOT NULL,
    input_hash text NOT NULL,
    error_code text,
    "timestamp" timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE agent_execution_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agent_execution_logs IS 'Tracks AI agent execution for monitoring and analytics';


--
-- Name: COLUMN agent_execution_logs.agent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_execution_logs.agent_id IS 'ID of the agent that was executed';


--
-- Name: COLUMN agent_execution_logs.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_execution_logs.request_id IS 'Unique request identifier';


--
-- Name: COLUMN agent_execution_logs.execution_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_execution_logs.execution_time IS 'Time taken for agent execution in milliseconds';


--
-- Name: COLUMN agent_execution_logs.input_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_execution_logs.input_hash IS 'Hash of input data for deduplication analysis';


--
-- Name: COLUMN agent_execution_logs.error_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agent_execution_logs.error_code IS 'Error code if execution failed';


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    model_id text NOT NULL,
    context_type public.ai_context_type DEFAULT 'general'::public.ai_context_type NOT NULL,
    context_id uuid,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_conversations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_conversations IS 'Chat sessions between users and AI assistant';


--
-- Name: COLUMN ai_conversations.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.user_id IS 'User who owns this conversation';


--
-- Name: COLUMN ai_conversations.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.title IS 'Auto-generated or user-defined conversation title';


--
-- Name: COLUMN ai_conversations.model_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.model_id IS 'AI model used (e.g., meta-llama/llama-3.3-70b-instruct:free)';


--
-- Name: COLUMN ai_conversations.context_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.context_type IS 'Type of entity this conversation relates to';


--
-- Name: COLUMN ai_conversations.context_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.context_id IS 'UUID of the related entity (student, lesson, song, etc.)';


--
-- Name: COLUMN ai_conversations.is_archived; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_conversations.is_archived IS 'Whether the conversation is archived';


--
-- Name: ai_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    generation_type public.ai_generation_type NOT NULL,
    agent_id character varying(255),
    model_id character varying(255),
    provider character varying(100),
    input_params jsonb NOT NULL,
    output_content text NOT NULL,
    is_successful boolean DEFAULT true NOT NULL,
    error_message text,
    context_entity_type character varying(50),
    context_entity_id uuid,
    is_starred boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_generations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_generations IS 'Stores structured AI generation outputs with input params, model info, and status';


--
-- Name: COLUMN ai_generations.agent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.agent_id IS 'Agent ID used for the generation (null for direct provider calls)';


--
-- Name: COLUMN ai_generations.input_params; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.input_params IS 'JSON object of input parameters passed to the generation';


--
-- Name: COLUMN ai_generations.output_content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.output_content IS 'Full text output of the generation';


--
-- Name: COLUMN ai_generations.context_entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.context_entity_type IS 'Type of related entity (student, lesson, etc.)';


--
-- Name: COLUMN ai_generations.context_entity_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.context_entity_id IS 'UUID of the related entity';


--
-- Name: COLUMN ai_generations.is_starred; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_generations.is_starred IS 'User-starred for quick access';


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role public.ai_message_role NOT NULL,
    content text NOT NULL,
    model_id text,
    tokens_used integer,
    latency_ms integer,
    is_helpful boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_messages IS 'Individual messages within AI conversations';


--
-- Name: COLUMN ai_messages.conversation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.conversation_id IS 'Parent conversation';


--
-- Name: COLUMN ai_messages.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.role IS 'Message role: system, user, or assistant';


--
-- Name: COLUMN ai_messages.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.content IS 'Message content text';


--
-- Name: COLUMN ai_messages.model_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.model_id IS 'AI model that generated this response (for assistant messages)';


--
-- Name: COLUMN ai_messages.tokens_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.tokens_used IS 'Number of tokens consumed by this message';


--
-- Name: COLUMN ai_messages.latency_ms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.latency_ms IS 'Response generation time in milliseconds';


--
-- Name: COLUMN ai_messages.is_helpful; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_messages.is_helpful IS 'User feedback: true=helpful, false=not helpful, null=no feedback';


--
-- Name: ai_prompt_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_prompt_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category public.ai_prompt_category DEFAULT 'custom'::public.ai_prompt_category NOT NULL,
    prompt_template text NOT NULL,
    variables jsonb,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_prompt_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_prompt_templates IS 'Reusable prompt templates for common AI tasks';


--
-- Name: COLUMN ai_prompt_templates.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.name IS 'Template name shown in UI';


--
-- Name: COLUMN ai_prompt_templates.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.description IS 'Description of what this template does';


--
-- Name: COLUMN ai_prompt_templates.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.category IS 'Template category for organization';


--
-- Name: COLUMN ai_prompt_templates.prompt_template; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.prompt_template IS 'The prompt text with {{placeholder}} variables';


--
-- Name: COLUMN ai_prompt_templates.variables; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.variables IS 'JSON array of expected variable names';


--
-- Name: COLUMN ai_prompt_templates.is_system; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.is_system IS 'System-provided template (not deletable by users)';


--
-- Name: COLUMN ai_prompt_templates.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.is_active IS 'Whether template is available for use';


--
-- Name: COLUMN ai_prompt_templates.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_prompt_templates.created_by IS 'User who created this template (null for system templates)';


--
-- Name: ai_usage_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    model_id text NOT NULL,
    request_count integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    total_latency_ms integer DEFAULT 0 NOT NULL,
    error_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ai_usage_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_usage_stats IS 'Daily aggregated AI usage for analytics and rate limiting';


--
-- Name: COLUMN ai_usage_stats.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.user_id IS 'User whose usage is tracked';


--
-- Name: COLUMN ai_usage_stats.date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.date IS 'Date of usage (one row per user/model/day)';


--
-- Name: COLUMN ai_usage_stats.model_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.model_id IS 'AI model identifier';


--
-- Name: COLUMN ai_usage_stats.request_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.request_count IS 'Number of requests made';


--
-- Name: COLUMN ai_usage_stats.total_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.total_tokens IS 'Total tokens consumed';


--
-- Name: COLUMN ai_usage_stats.total_latency_ms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.total_latency_ms IS 'Cumulative response time';


--
-- Name: COLUMN ai_usage_stats.error_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_usage_stats.error_count IS 'Number of failed requests';


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    last_used_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE api_keys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.api_keys IS 'Bearer token API keys for external API authentication';


--
-- Name: COLUMN api_keys.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.id IS 'Unique API key record identifier';


--
-- Name: COLUMN api_keys.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.user_id IS 'User who owns this API key';


--
-- Name: COLUMN api_keys.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.name IS 'Human-friendly name for identifying this key';


--
-- Name: COLUMN api_keys.key_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the API key (actual key is never stored)';


--
-- Name: COLUMN api_keys.last_used_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.last_used_at IS 'Last time this key was used for authentication';


--
-- Name: COLUMN api_keys.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.api_keys.is_active IS 'Whether this key is active - false disables authentication';


--
-- Name: apple_shortcut_song_import_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apple_shortcut_song_import_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    spotify_url text,
    spotify_track_id text,
    song_title text,
    song_artist text,
    song_id uuid,
    status text NOT NULL,
    error_message text,
    http_status integer,
    source text DEFAULT 'shortcut'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT apple_shortcut_song_import_log_source_check CHECK ((source = ANY (ARRAY['shortcut'::text, 'api'::text, 'debug-page'::text]))),
    CONSTRAINT apple_shortcut_song_import_log_status_check CHECK ((status = ANY (ARRAY['success'::text, 'duplicate'::text, 'error'::text])))
);


--
-- Name: assignment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    change_type text NOT NULL,
    previous_data jsonb,
    new_data jsonb NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE assignment_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assignment_history IS 'Audit log tracking all changes to assignments';


--
-- Name: COLUMN assignment_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.id IS 'Unique history record identifier';


--
-- Name: COLUMN assignment_history.assignment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.assignment_id IS 'Assignment that was changed';


--
-- Name: COLUMN assignment_history.changed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.changed_by IS 'User who made the change';


--
-- Name: COLUMN assignment_history.change_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.change_type IS 'Type of change: created, status_changed, updated, deleted';


--
-- Name: COLUMN assignment_history.previous_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.previous_data IS 'Previous assignment data (null for creation)';


--
-- Name: COLUMN assignment_history.new_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.new_data IS 'New assignment data after change';


--
-- Name: COLUMN assignment_history.changed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.changed_at IS 'When the change occurred';


--
-- Name: COLUMN assignment_history.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_history.notes IS 'Optional notes about the change';


--
-- Name: assignment_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE assignment_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assignment_templates IS 'Reusable assignment templates that teachers can apply to students';


--
-- Name: COLUMN assignment_templates.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_templates.id IS 'Unique template identifier';


--
-- Name: COLUMN assignment_templates.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_templates.title IS 'Template title shown in selection lists';


--
-- Name: COLUMN assignment_templates.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_templates.description IS 'Default description applied to assignments created from this template';


--
-- Name: COLUMN assignment_templates.teacher_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignment_templates.teacher_id IS 'Teacher who owns this template';


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    status public.assignment_status DEFAULT 'not_started'::public.assignment_status NOT NULL,
    due_date timestamp with time zone,
    teacher_id uuid NOT NULL,
    student_id uuid NOT NULL,
    lesson_id uuid,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    song_id uuid,
    CONSTRAINT assignments_teacher_not_student CHECK ((teacher_id <> student_id))
);


--
-- Name: TABLE assignments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assignments IS 'Teacher-assigned work/practice for students in the Guitar CRM system';


--
-- Name: COLUMN assignments.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignments.deleted_at IS 'Soft delete timestamp, NULL means active';


--
-- Name: COLUMN assignments.song_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assignments.song_id IS 'Optional link to the song this assignment is about';


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)
PARTITION BY RANGE (created_at);


--
-- Name: TABLE audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_log IS 'Unified audit log for entity changes, partitioned by month. Restored 2026-06-19 (legacy design; live audit data lives in *_history tables).';


--
-- Name: audit_log_2026_01; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_01 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_02; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_02 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_03; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_03 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_04; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_04 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_05; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_05 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_06; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_06 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_07; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_07 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_08; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_08 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_09; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_09 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_10; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_10 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_11; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_11 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_2026_12; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_2026_12 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_default; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_default (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.audit_action NOT NULL,
    changes jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type public.auth_event_type NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    user_email text,
    user_id uuid,
    actor_id uuid,
    ip_address text,
    success boolean NOT NULL,
    error_message text,
    email_status public.auth_email_status DEFAULT 'not_applicable'::public.auth_email_status NOT NULL,
    email_error text,
    metadata jsonb
);


--
-- Name: auth_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    operation text NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE auth_rate_limits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auth_rate_limits IS 'Tracks auth operation attempts for rate limiting';


--
-- Name: chord_quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chord_quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    chord_id text NOT NULL,
    selected_answer text NOT NULL,
    is_correct boolean NOT NULL,
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chord_quiz_attempts_response_time_ms_check CHECK (((response_time_ms IS NULL) OR (response_time_ms >= 0)))
);


--
-- Name: chord_srs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chord_srs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    chord_id text NOT NULL,
    repetitions smallint DEFAULT 0 NOT NULL,
    interval_days real DEFAULT 1 NOT NULL,
    ease_factor real DEFAULT 2.5 NOT NULL,
    next_review_at timestamp with time zone DEFAULT now() NOT NULL,
    last_reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_post_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_post_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    shares_count integer DEFAULT 0 NOT NULL,
    saves_count integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE content_post_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.content_post_metrics IS 'Time-series snapshots of content_posts engagement metrics';


--
-- Name: content_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    song_video_id uuid,
    platform text NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    hook text,
    caption text,
    hashtag_set_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    extra_hashtags text[] DEFAULT ARRAY[]::text[] NOT NULL,
    stories jsonb DEFAULT '{}'::jsonb NOT NULL,
    external_url text,
    external_post_id text,
    views_count integer DEFAULT 0 NOT NULL,
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    shares_count integer DEFAULT 0 NOT NULL,
    saves_count integer DEFAULT 0 NOT NULL,
    engagement_rate numeric(5,2),
    metrics_updated_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_posts_platform_check CHECK ((platform = ANY (ARRAY['tiktok'::text, 'instagram'::text, 'youtube_shorts'::text]))),
    CONSTRAINT content_posts_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'scheduled'::text, 'published'::text, 'archived'::text, 'failed'::text])))
);


--
-- Name: TABLE content_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.content_posts IS 'Per-platform distribution slot for a song video';


--
-- Name: drive_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drive_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    uploaded_by uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    google_drive_file_id text NOT NULL,
    google_drive_folder_id text,
    file_type character varying(50) NOT NULL,
    filename text NOT NULL,
    title text,
    description text,
    mime_type text NOT NULL,
    file_size_bytes bigint,
    metadata jsonb DEFAULT '{}'::jsonb,
    visibility character varying(20) DEFAULT 'private'::character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT drive_files_entity_type_check CHECK (((entity_type)::text = ANY ((ARRAY['song'::character varying, 'lesson'::character varying, 'assignment'::character varying, 'profile'::character varying])::text[]))),
    CONSTRAINT drive_files_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['audio'::character varying, 'pdf'::character varying, 'video'::character varying, 'document'::character varying, 'image'::character varying])::text[]))),
    CONSTRAINT drive_files_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'students'::character varying, 'public'::character varying])::text[])))
);


--
-- Name: TABLE drive_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.drive_files IS 'Unified storage for all Google Drive files (audio, PDF, video, document, image) attached to lessons, songs, assignments, or profiles';


--
-- Name: COLUMN drive_files.entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.entity_type IS 'Type of entity the file is attached to: song, lesson, assignment, profile';


--
-- Name: COLUMN drive_files.entity_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.entity_id IS 'UUID of the entity (not a foreign key to allow polymorphic relationships)';


--
-- Name: COLUMN drive_files.google_drive_file_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.google_drive_file_id IS 'Unique identifier in Google Drive';


--
-- Name: COLUMN drive_files.file_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.file_type IS 'Type of file: audio, pdf, video, document, image';


--
-- Name: COLUMN drive_files.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.metadata IS 'Type-specific metadata stored as JSONB (duration, page_count, thumbnail_url, etc.)';


--
-- Name: COLUMN drive_files.visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.visibility IS 'Who can view the file: private (staff only), students (enrolled students), public (anyone)';


--
-- Name: COLUMN drive_files.display_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.display_order IS 'Order in which files are displayed in UI (lower = first)';


--
-- Name: COLUMN drive_files.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.drive_files.deleted_at IS 'Soft delete timestamp';


--
-- Name: hashtag_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hashtag_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    hashtags text[] DEFAULT ARRAY[]::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE hashtag_sets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hashtag_sets IS 'Reusable hashtag bundles for content posts';


--
-- Name: in_app_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.in_app_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_type public.notification_type NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    icon text,
    variant text DEFAULT 'default'::text,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    action_url text,
    action_label text,
    entity_type text,
    entity_id text,
    priority integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    student_id uuid NOT NULL,
    lesson_teacher_number integer NOT NULL,
    title text,
    scheduled_at timestamp with time zone NOT NULL,
    status public.lesson_status DEFAULT 'SCHEDULED'::public.lesson_status NOT NULL,
    notes text,
    google_event_id text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lessons_teacher_not_student CHECK ((teacher_id <> student_id))
);


--
-- Name: TABLE lessons; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lessons IS 'Guitar lessons between teachers and students';


--
-- Name: COLUMN lessons.lesson_teacher_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lessons.lesson_teacher_number IS 'Sequential lesson number for this teacher-student pair (auto-set by trigger)';


--
-- Name: COLUMN lessons.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lessons.deleted_at IS 'Soft delete timestamp, NULL means active';


--
-- Name: lesson_counts_per_student; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lesson_counts_per_student WITH (security_invoker='true') AS
 SELECT student_id,
    count(*) AS total_lessons
   FROM public.lessons
  GROUP BY student_id;


--
-- Name: lesson_counts_per_teacher; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lesson_counts_per_teacher WITH (security_invoker='true') AS
 SELECT teacher_id,
    count(*) AS total_lessons
   FROM public.lessons
  GROUP BY teacher_id;


--
-- Name: lesson_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    change_type text NOT NULL,
    previous_data jsonb,
    new_data jsonb NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE lesson_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lesson_history IS 'Audit log tracking all changes to lessons';


--
-- Name: COLUMN lesson_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.id IS 'Unique history record identifier';


--
-- Name: COLUMN lesson_history.lesson_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.lesson_id IS 'Lesson that was changed';


--
-- Name: COLUMN lesson_history.changed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.changed_by IS 'User who made the change';


--
-- Name: COLUMN lesson_history.change_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.change_type IS 'Type of change: created, rescheduled, status_changed, updated, cancelled, completed';


--
-- Name: COLUMN lesson_history.previous_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.previous_data IS 'Previous lesson data (null for creation)';


--
-- Name: COLUMN lesson_history.new_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.new_data IS 'New lesson data after change';


--
-- Name: COLUMN lesson_history.changed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.changed_at IS 'When the change occurred';


--
-- Name: COLUMN lesson_history.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_history.notes IS 'Optional notes about the change';


--
-- Name: lesson_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    song_id uuid NOT NULL,
    status public.lesson_song_status DEFAULT 'to_learn'::public.lesson_song_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    repertoire_id uuid
);


--
-- Name: TABLE lesson_songs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lesson_songs IS 'Junction table linking songs to lessons with learning status tracking';


--
-- Name: COLUMN lesson_songs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_songs.id IS 'Unique lesson-song link identifier';


--
-- Name: COLUMN lesson_songs.lesson_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_songs.lesson_id IS 'Reference to the lesson';


--
-- Name: COLUMN lesson_songs.song_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_songs.song_id IS 'Reference to the song being learned';


--
-- Name: COLUMN lesson_songs.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_songs.status IS 'Learning status: to_learn, learning, or learned';


--
-- Name: COLUMN lesson_songs.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lesson_songs.notes IS 'Teacher notes about the song for this lesson';


--
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    author text,
    short_title character varying(50),
    level public.difficulty_level,
    key public.music_key,
    capo_fret integer,
    strumming_pattern text,
    tempo integer,
    time_signature integer,
    duration_ms integer,
    release_year integer,
    category text,
    chords text,
    ultimate_guitar_link text,
    youtube_url text,
    spotify_link_url text,
    cover_image_url text,
    gallery_images text[],
    audio_files jsonb DEFAULT '{}'::jsonb,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS ((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(author, ''::text)), 'B'::"char"))) STORED,
    tiktok_short_url text,
    notes text,
    lyrics_with_chords text,
    is_draft boolean DEFAULT false NOT NULL,
    recording_queued_at timestamp with time zone,
    recorded_at timestamp with time zone,
    priority_bucket text,
    CONSTRAINT songs_capo_fret_check CHECK (((capo_fret IS NULL) OR ((capo_fret >= 0) AND (capo_fret <= 20)))),
    CONSTRAINT songs_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms > 0))),
    CONSTRAINT songs_priority_bucket_check CHECK ((priority_bucket = ANY (ARRAY['done'::text, 'may'::text, 'june'::text, 'later'::text, 'backlog'::text]))),
    CONSTRAINT songs_release_year_check CHECK (((release_year IS NULL) OR ((release_year >= 1900) AND (release_year <= 2100)))),
    CONSTRAINT songs_tempo_check CHECK (((tempo IS NULL) OR ((tempo >= 20) AND (tempo <= 300)))),
    CONSTRAINT songs_time_signature_check CHECK (((time_signature IS NULL) OR ((time_signature >= 1) AND (time_signature <= 16))))
);


--
-- Name: COLUMN songs.short_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.short_title IS 'Optional abbreviated title for display in compact views';


--
-- Name: COLUMN songs.capo_fret; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.capo_fret IS 'Capo position (0-20), null means no capo';


--
-- Name: COLUMN songs.strumming_pattern; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.strumming_pattern IS 'Strumming pattern description (e.g., D-DU-UDU)';


--
-- Name: COLUMN songs.tempo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.tempo IS 'Song tempo in BPM';


--
-- Name: COLUMN songs.time_signature; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.time_signature IS 'Time signature numerator (e.g., 4 for 4/4)';


--
-- Name: COLUMN songs.duration_ms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.duration_ms IS 'Song duration in milliseconds';


--
-- Name: COLUMN songs.release_year; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.release_year IS 'Year the song was released';


--
-- Name: COLUMN songs.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.category IS 'Song category or genre';


--
-- Name: COLUMN songs.spotify_link_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.spotify_link_url IS 'Spotify track URL';


--
-- Name: COLUMN songs.cover_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.cover_image_url IS 'URL to song cover image';


--
-- Name: COLUMN songs.audio_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.audio_files IS 'JSONB object mapping audio type to URL';


--
-- Name: COLUMN songs.search_vector; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.search_vector IS 'Generated tsvector for full-text search (title weighted A, author weighted B)';


--
-- Name: COLUMN songs.tiktok_short_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.tiktok_short_url IS 'TikTok short URL for practice - allows repeated listening of song clips';


--
-- Name: COLUMN songs.recording_queued_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.recording_queued_at IS 'When this song was added to the recording queue. NULL = not queued.';


--
-- Name: COLUMN songs.recorded_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.songs.recorded_at IS 'When this song was marked as recorded. NULL = not recorded yet.';


--
-- Name: student_repertoire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_repertoire (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    song_id uuid NOT NULL,
    preferred_key public.music_key,
    capo_fret smallint,
    custom_strumming character varying(255),
    student_notes text,
    teacher_notes text,
    current_status public.song_progress_status DEFAULT 'to_learn'::public.song_progress_status NOT NULL,
    started_at timestamp with time zone,
    mastered_at timestamp with time zone,
    difficulty_rating smallint,
    total_practice_minutes integer DEFAULT 0,
    practice_session_count integer DEFAULT 0,
    last_practiced_at timestamp with time zone,
    assigned_by uuid,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    priority character varying(20) DEFAULT 'normal'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    self_rating integer,
    self_rating_updated_at timestamp with time zone,
    CONSTRAINT student_repertoire_capo_fret_check CHECK (((capo_fret IS NULL) OR ((capo_fret >= 0) AND (capo_fret <= 20)))),
    CONSTRAINT student_repertoire_difficulty_rating_check CHECK (((difficulty_rating IS NULL) OR ((difficulty_rating >= 1) AND (difficulty_rating <= 5)))),
    CONSTRAINT student_repertoire_practice_session_count_check CHECK ((practice_session_count >= 0)),
    CONSTRAINT student_repertoire_priority_check CHECK (((priority)::text = ANY ((ARRAY['high'::character varying, 'normal'::character varying, 'low'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT student_repertoire_self_rating_check CHECK (((self_rating IS NULL) OR ((self_rating >= 1) AND (self_rating <= 5)))),
    CONSTRAINT student_repertoire_total_practice_minutes_check CHECK ((total_practice_minutes >= 0))
);


--
-- Name: COLUMN student_repertoire.self_rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_repertoire.self_rating IS 'Student self-assessed confidence: 1=struggling, 2=needs work, 3=okay, 4=comfortable, 5=mastered';


--
-- Name: COLUMN student_repertoire.self_rating_updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_repertoire.self_rating_updated_at IS 'When the student last updated their self-rating';


--
-- Name: mv_song_engagement; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_song_engagement AS
 SELECT s.id AS song_id,
    s.title,
    s.author,
    (s.level)::text AS level,
    (s.key)::text AS key,
    s.category,
    count(DISTINCT sr.student_id) AS total_students,
    count(DISTINCT sr.student_id) FILTER (WHERE (sr.current_status = 'mastered'::public.song_progress_status)) AS mastered_count,
    count(DISTINCT sr.student_id) FILTER (WHERE (sr.is_active = true)) AS active_learners,
    COALESCE((avg(sr.total_practice_minutes))::integer, 0) AS avg_practice_minutes,
    COALESCE(round(avg(sr.difficulty_rating), 1), (0)::numeric) AS avg_difficulty,
    count(DISTINCT ls.lesson_id) AS lesson_appearances,
    max(GREATEST(sr.updated_at, ls.updated_at)) AS last_activity
   FROM ((public.songs s
     LEFT JOIN public.student_repertoire sr ON ((sr.song_id = s.id)))
     LEFT JOIN public.lesson_songs ls ON ((ls.song_id = s.id)))
  WHERE (s.deleted_at IS NULL)
  GROUP BY s.id, s.title, s.author, s.level, s.key, s.category
  WITH NO DATA;


--
-- Name: mv_song_popularity; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_song_popularity AS
 SELECT s.id AS song_id,
    s.title,
    s.author,
    (s.level)::text AS level,
    count(DISTINCT sr.student_id) AS times_assigned,
    count(DISTINCT sr.student_id) AS unique_students,
    count(DISTINCT sr.student_id) FILTER (WHERE (sr.current_status = 'mastered'::public.song_progress_status)) AS mastery_count,
        CASE
            WHEN (count(DISTINCT sr.student_id) > 0) THEN round((((count(DISTINCT sr.student_id) FILTER (WHERE (sr.current_status = 'mastered'::public.song_progress_status)))::numeric / (count(DISTINCT sr.student_id))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS mastery_rate,
    COALESCE(round(avg(sr.difficulty_rating), 1), (0)::numeric) AS avg_difficulty_rating
   FROM (public.songs s
     LEFT JOIN public.student_repertoire sr ON ((sr.song_id = s.id)))
  WHERE (s.deleted_at IS NULL)
  GROUP BY s.id, s.title, s.author, s.level
  WITH NO DATA;


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_type public.notification_type NOT NULL,
    recipient_user_id uuid NOT NULL,
    recipient_email text NOT NULL,
    status public.notification_status DEFAULT 'pending'::public.notification_status NOT NULL,
    subject text NOT NULL,
    template_data jsonb,
    sent_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    max_retries integer DEFAULT 5 NOT NULL,
    entity_type text,
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE notification_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_log IS 'Audit trail for all notification delivery attempts';


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_type public.notification_type NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_preferences IS 'User-level notification opt-in/opt-out settings';


--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_type public.notification_type NOT NULL,
    recipient_user_id uuid NOT NULL,
    template_data jsonb NOT NULL,
    scheduled_for timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    status public.notification_status DEFAULT 'pending'::public.notification_status NOT NULL,
    priority integer DEFAULT 5 NOT NULL,
    entity_type text,
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE notification_queue; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_queue IS 'Queue for scheduled and delayed notifications';


--
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid,
    song_id uuid,
    duration_minutes integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bpm_practiced smallint,
    CONSTRAINT practice_sessions_bpm_practiced_check CHECK (((bpm_practiced IS NULL) OR ((bpm_practiced >= 20) AND (bpm_practiced <= 300)))),
    CONSTRAINT practice_sessions_duration_minutes_check CHECK (((duration_minutes > 0) AND (duration_minutes <= 480)))
);


--
-- Name: TABLE practice_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.practice_sessions IS 'Tracks student practice sessions for songs';


--
-- Name: COLUMN practice_sessions.duration_minutes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.practice_sessions.duration_minutes IS 'Practice duration in minutes (1-480)';


--
-- Name: COLUMN practice_sessions.bpm_practiced; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.practice_sessions.bpm_practiced IS 'BPM practiced at (NULL = no specific tempo); enables tempo ladder tracking';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    notes text,
    phone text,
    is_admin boolean DEFAULT false NOT NULL,
    is_teacher boolean DEFAULT false NOT NULL,
    is_student boolean DEFAULT false NOT NULL,
    is_development boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_shadow boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status_changed_at timestamp with time zone DEFAULT now(),
    lead_source text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    student_status public.student_status DEFAULT 'archived'::public.student_status NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    first_name character varying(100),
    last_name character varying(100),
    last_sign_in_at timestamp with time zone,
    sign_in_count integer DEFAULT 0 NOT NULL,
    deletion_requested_at timestamp with time zone,
    deletion_scheduled_for timestamp with time zone,
    parent_id uuid,
    is_parent boolean DEFAULT false NOT NULL,
    spotify_playlist_url text,
    confirmed_active_at timestamp with time zone,
    deleted_at timestamp with time zone,
    invite_email text,
    CONSTRAINT no_self_parent CHECK ((parent_id <> id)),
    CONSTRAINT profiles_email_check CHECK ((email ~* '^.+@.+\..+$'::text))
);


--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users - stores user details and role flags';


--
-- Name: COLUMN profiles.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.id IS 'Unique profile identifier';


--
-- Name: COLUMN profiles.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.user_id IS 'Reference to Supabase auth.users (null for shadow students)';


--
-- Name: COLUMN profiles.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.email IS 'User email address - must be unique across all profiles';


--
-- Name: COLUMN profiles.full_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.full_name IS 'Display name shown in UI';


--
-- Name: COLUMN profiles.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';


--
-- Name: COLUMN profiles.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.notes IS 'Admin/teacher notes about the user';


--
-- Name: COLUMN profiles.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.phone IS 'Contact phone number';


--
-- Name: COLUMN profiles.is_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_admin IS 'Has full system access (synced to user_roles)';


--
-- Name: COLUMN profiles.is_teacher; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_teacher IS 'Can teach students and manage lessons (synced to user_roles)';


--
-- Name: COLUMN profiles.is_student; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_student IS 'Takes lessons (synced to user_roles)';


--
-- Name: COLUMN profiles.is_development; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_development IS 'Development/test account flag';


--
-- Name: COLUMN profiles.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_active IS 'Active account - false disables login';


--
-- Name: COLUMN profiles.is_shadow; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_shadow IS 'Shadow student - created by teacher without real email/auth account';


--
-- Name: COLUMN profiles.status_changed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.status_changed_at IS 'Timestamp when the student_status was last updated';


--
-- Name: COLUMN profiles.lead_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.lead_source IS 'Optional: How did the student find us? (e.g., referral, google, facebook)';


--
-- Name: COLUMN profiles.onboarding_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';


--
-- Name: COLUMN profiles.student_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.student_status IS 'Student engagement status: active (taking lessons) or archived (not currently engaged)';


--
-- Name: COLUMN profiles.failed_login_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.failed_login_attempts IS 'Counter for consecutive failed login attempts';


--
-- Name: COLUMN profiles.locked_until; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.locked_until IS 'Timestamp until which the account is locked out';


--
-- Name: COLUMN profiles.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.first_name IS 'User first name, synced with full_name via trigger';


--
-- Name: COLUMN profiles.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.last_name IS 'User last name, synced with full_name via trigger';


--
-- Name: COLUMN profiles.last_sign_in_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.last_sign_in_at IS 'Timestamp of the user last sign-in';


--
-- Name: COLUMN profiles.sign_in_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.sign_in_count IS 'Total number of sign-ins';


--
-- Name: COLUMN profiles.deletion_requested_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.deletion_requested_at IS 'When user requested account deletion';


--
-- Name: COLUMN profiles.deletion_scheduled_for; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.deletion_scheduled_for IS 'When account will be permanently deleted (30 days after request)';


--
-- Name: COLUMN profiles.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.parent_id IS 'For student profiles: references the parent/guardian profile';


--
-- Name: COLUMN profiles.is_parent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_parent IS 'This profile belongs to a parent/guardian of a student';


--
-- Name: COLUMN profiles.confirmed_active_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.confirmed_active_at IS 'Set when teacher confirms student is still active. Used as virtual last-activity date for inactivity window calculations.';


--
-- Name: COLUMN profiles.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft-delete timestamp; set alongside is_active=false on deactivation';


--
-- Name: COLUMN profiles.invite_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.invite_email IS 'Real email address for shadow users. Used to match when the student signs up.';


--
-- Name: song_of_the_week; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_of_the_week (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    selected_by uuid NOT NULL,
    teacher_message text,
    active_from date DEFAULT CURRENT_DATE NOT NULL,
    active_until date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: song_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    title text NOT NULL,
    artist text,
    notes text,
    url text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    review_notes text,
    song_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT song_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: song_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    section_type text NOT NULL,
    section_number integer DEFAULT 1 NOT NULL,
    order_position integer NOT NULL,
    chords text[] DEFAULT '{}'::text[] NOT NULL,
    lyrics text,
    tab_notation text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT song_sections_section_type_check CHECK ((section_type = ANY (ARRAY['intro'::text, 'verse'::text, 'pre-chorus'::text, 'chorus'::text, 'bridge'::text, 'solo'::text, 'interlude'::text, 'outro'::text])))
);


--
-- Name: song_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    song_id uuid NOT NULL,
    previous_status text,
    new_status text NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE song_status_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.song_status_history IS 'Audit log tracking all song learning status changes per student';


--
-- Name: COLUMN song_status_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.id IS 'Unique history record identifier';


--
-- Name: COLUMN song_status_history.student_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.student_id IS 'Student whose song status changed';


--
-- Name: COLUMN song_status_history.song_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.song_id IS 'Song that had status change';


--
-- Name: COLUMN song_status_history.previous_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.previous_status IS 'Status before the change (null for initial status)';


--
-- Name: COLUMN song_status_history.new_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.new_status IS 'New status after the change';


--
-- Name: COLUMN song_status_history.changed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.changed_at IS 'When the status change occurred';


--
-- Name: COLUMN song_status_history.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_status_history.notes IS 'Optional notes about the status change';


--
-- Name: song_usage_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.song_usage_stats WITH (security_invoker='true') AS
 SELECT s.id AS song_id,
    s.title,
    count(ls.id) AS times_assigned
   FROM (public.songs s
     LEFT JOIN public.lesson_songs ls ON ((ls.song_id = s.id)))
  GROUP BY s.id, s.title;


--
-- Name: song_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    google_drive_file_id text NOT NULL,
    google_drive_folder_id text,
    title text DEFAULT ''::text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    file_size_bytes bigint,
    duration_seconds numeric(8,2),
    thumbnail_url text,
    display_order integer DEFAULT 0 NOT NULL,
    published_to_instagram boolean DEFAULT false NOT NULL,
    published_to_tiktok boolean DEFAULT false NOT NULL,
    published_to_youtube_shorts boolean DEFAULT false NOT NULL,
    instagram_media_id text,
    tiktok_media_id text,
    youtube_shorts_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_recording_correct boolean DEFAULT false NOT NULL,
    is_well_lit boolean DEFAULT false NOT NULL,
    mic_type text,
    is_audio_mixed boolean DEFAULT false NOT NULL,
    is_video_edited boolean DEFAULT false NOT NULL,
    match_confidence integer,
    match_source character varying(20),
    production_status text DEFAULT 'idea'::text NOT NULL,
    CONSTRAINT song_videos_match_confidence_check CHECK (((match_confidence >= 0) AND (match_confidence <= 100))),
    CONSTRAINT song_videos_match_source_check CHECK (((match_source)::text = ANY ((ARRAY['auto'::character varying, 'manual'::character varying, 'spotify'::character varying])::text[]))),
    CONSTRAINT song_videos_mic_type_check CHECK ((mic_type = ANY (ARRAY['iphone'::text, 'external'::text]))),
    CONSTRAINT song_videos_production_status_check CHECK ((production_status = ANY (ARRAY['idea'::text, 'recording'::text, 'edited'::text, 'ready'::text])))
);


--
-- Name: COLUMN song_videos.match_confidence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_videos.match_confidence IS 'Confidence score (0-100) from the matching algorithm. Higher scores indicate better matches.';


--
-- Name: COLUMN song_videos.match_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.song_videos.match_source IS 'Source of the match: auto (algorithm), manual (admin override), spotify (created from Spotify track).';


--
-- Name: spotify_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spotify_matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    song_id uuid NOT NULL,
    spotify_track_id character varying(255) NOT NULL,
    spotify_track_name character varying(500) NOT NULL,
    spotify_artist_name character varying(500) NOT NULL,
    spotify_album_name character varying(500),
    spotify_url character varying(1000) NOT NULL,
    spotify_preview_url character varying(1000),
    spotify_cover_image_url character varying(1000),
    spotify_duration_ms integer,
    spotify_release_date character varying(50),
    spotify_popularity integer,
    confidence_score integer NOT NULL,
    search_query text NOT NULL,
    match_reason text,
    ai_reasoning text,
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT spotify_matches_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
    CONSTRAINT spotify_matches_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'auto_applied'::character varying])::text[])))
);


--
-- Name: TABLE spotify_matches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.spotify_matches IS 'Stores potential Spotify matches for manual review when confidence is below auto-apply threshold';


--
-- Name: COLUMN spotify_matches.confidence_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spotify_matches.confidence_score IS 'AI confidence score (0-100) for the match quality';


--
-- Name: COLUMN spotify_matches.search_query; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spotify_matches.search_query IS 'The search query that found this match';


--
-- Name: COLUMN spotify_matches.match_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spotify_matches.match_reason IS 'Brief explanation of why this was considered a match';


--
-- Name: COLUMN spotify_matches.ai_reasoning; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spotify_matches.ai_reasoning IS 'Detailed AI reasoning for the match';


--
-- Name: COLUMN spotify_matches.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spotify_matches.status IS 'Review status: pending (awaiting review), approved (manually approved), rejected (manually rejected), auto_applied (automatically applied due to high confidence)';


--
-- Name: student_song_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_song_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    song_id uuid NOT NULL,
    current_status public.lesson_song_status DEFAULT 'to_learn'::public.lesson_song_status NOT NULL,
    started_at timestamp with time zone,
    mastered_at timestamp with time zone,
    total_practice_time_minutes integer DEFAULT 0,
    practice_session_count integer DEFAULT 0,
    last_practiced_at timestamp with time zone,
    teacher_notes text,
    student_notes text,
    difficulty_rating integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_song_progress_difficulty_rating_check CHECK (((difficulty_rating IS NULL) OR ((difficulty_rating >= 1) AND (difficulty_rating <= 5)))),
    CONSTRAINT student_song_progress_practice_session_count_check CHECK ((practice_session_count >= 0)),
    CONSTRAINT student_song_progress_total_practice_time_minutes_check CHECK ((total_practice_time_minutes >= 0))
);


--
-- Name: TABLE student_song_progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_song_progress IS 'Tracks overall student progress on songs across all lessons and practice sessions';


--
-- Name: COLUMN student_song_progress.current_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.current_status IS 'Current mastery level of the song';


--
-- Name: COLUMN student_song_progress.started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.started_at IS 'When the student first started learning this song';


--
-- Name: COLUMN student_song_progress.mastered_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.mastered_at IS 'When the student achieved mastered status';


--
-- Name: COLUMN student_song_progress.total_practice_time_minutes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.total_practice_time_minutes IS 'Cumulative practice time from all practice sessions';


--
-- Name: COLUMN student_song_progress.practice_session_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.practice_session_count IS 'Number of practice sessions for this song';


--
-- Name: COLUMN student_song_progress.difficulty_rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.student_song_progress.difficulty_rating IS 'Student self-reported difficulty (1=easy, 5=very hard)';


--
-- Name: sync_conflicts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_conflicts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    google_event_id character varying(255) NOT NULL,
    conflict_data jsonb NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    resolution character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_sync_conflicts_resolution CHECK (((resolution IS NULL) OR ((resolution)::text = ANY ((ARRAY['use_local'::character varying, 'use_remote'::character varying])::text[])))),
    CONSTRAINT check_sync_conflicts_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'resolved'::character varying, 'ignored'::character varying])::text[])))
);


--
-- Name: TABLE sync_conflicts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sync_conflicts IS 'Tracks conflicts between Strummy and Google Calendar for manual resolution';


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    level public.log_level NOT NULL,
    prefix text NOT NULL,
    message text NOT NULL,
    request_id text,
    user_id uuid,
    context jsonb,
    error jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE system_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.system_logs IS 'Persisted warn/error log stream for the admin UI. Phase 2.5 of ADR 0003.';


--
-- Name: COLUMN system_logs.prefix; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_logs.prefix IS 'createLogger() namespace, e.g. "API", "cron:lesson-reminders".';


--
-- Name: COLUMN system_logs.context; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_logs.context IS 'Merged request-scope + log-call context (redacted before insert).';


--
-- Name: COLUMN system_logs.error; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.system_logs.error IS 'Serialized Error object: { type, message, stack }. NULL for non-error levels.';


--
-- Name: teacher_students; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.teacher_students WITH (security_invoker='true') AS
 SELECT DISTINCT teacher_id,
    student_id
   FROM public.lessons
  WHERE (deleted_at IS NULL);


--
-- Name: VIEW teacher_students; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.teacher_students IS 'Derived teacher-student pairs from lessons. A student appears here once they have at least one lesson with a teacher.';


--
-- Name: theoretical_course_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theoretical_course_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    user_id uuid NOT NULL,
    granted_by uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theoretical_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theoretical_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    cover_image_url text,
    level character varying(50) DEFAULT 'beginner'::character varying NOT NULL,
    created_by uuid NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: theoretical_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theoretical_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    excerpt text,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    changed_by uuid,
    change_type text NOT NULL,
    previous_data jsonb,
    new_data jsonb,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    CONSTRAINT user_history_change_type_check CHECK ((change_type = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'role_changed'::text, 'status_changed'::text])))
);


--
-- Name: TABLE user_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_history IS 'Tracks all changes to user profiles including creation, updates, role changes, and deletions';


--
-- Name: COLUMN user_history.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_history.user_id IS 'Profile id at time of audit. Not FK-enforced — audit rows outlive their source. JOIN at read time and tolerate orphans.';


--
-- Name: user_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_integrations (
    user_id uuid NOT NULL,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at bigint,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: TABLE user_integrations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_integrations IS 'OAuth tokens for external service integrations (Google Calendar, etc.)';


--
-- Name: COLUMN user_integrations.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_integrations.user_id IS 'User who authorized this integration';


--
-- Name: COLUMN user_integrations.provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_integrations.provider IS 'Integration provider name (e.g., google, spotify)';


--
-- Name: COLUMN user_integrations.access_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_integrations.access_token IS 'OAuth access token (encrypted at rest)';


--
-- Name: COLUMN user_integrations.refresh_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_integrations.refresh_token IS 'OAuth refresh token for obtaining new access tokens';


--
-- Name: COLUMN user_integrations.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_integrations.expires_at IS 'Token expiration timestamp in milliseconds from epoch';


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_roles IS 'User role assignments - junction table linking profiles to roles for RBAC';


--
-- Name: COLUMN user_roles.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_roles.id IS 'Unique role assignment identifier';


--
-- Name: COLUMN user_roles.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_roles.user_id IS 'Reference to profile receiving the role';


--
-- Name: COLUMN user_roles.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_roles.role IS 'Role type: admin, teacher, or student';


--
-- Name: COLUMN user_roles.assigned_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_roles.assigned_at IS 'When the role was assigned';


--
-- Name: user_overview; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_overview WITH (security_invoker='true') AS
 SELECT p.id AS user_id,
    p.email,
    p.created_at,
    p.updated_at,
    bool_or((ur.role = 'admin'::public.user_role)) AS is_admin,
    bool_or((ur.role = 'teacher'::public.user_role)) AS is_teacher,
    bool_or((ur.role = 'student'::public.user_role)) AS is_student
   FROM (public.profiles p
     LEFT JOIN public.user_roles ur ON ((ur.user_id = p.id)))
  GROUP BY p.id, p.email, p.created_at, p.updated_at;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    goals text[] DEFAULT '{}'::text[] NOT NULL,
    skill_level text DEFAULT 'beginner'::text NOT NULL,
    learning_style text[] DEFAULT '{}'::text[] NOT NULL,
    instrument_preference text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_preferences_skill_level_check CHECK ((skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])))
);


--
-- Name: TABLE user_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_preferences IS 'Stores user onboarding preferences: goals, skill level, learning style, instruments';


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    theme text DEFAULT 'system'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    profile_visibility text DEFAULT 'public'::text NOT NULL,
    show_email boolean DEFAULT false NOT NULL,
    show_last_seen boolean DEFAULT true NOT NULL,
    font_scheme text DEFAULT 'geist'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_settings_language_check CHECK ((language = ANY (ARRAY['en'::text, 'pl'::text, 'es'::text, 'de'::text, 'fr'::text]))),
    CONSTRAINT user_settings_profile_visibility_check CHECK ((profile_visibility = ANY (ARRAY['public'::text, 'private'::text, 'contacts'::text]))),
    CONSTRAINT user_settings_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])))
);


--
-- Name: TABLE user_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_settings IS 'Per-user preferences (theme, language, timezone, visibility) backing the Settings page. Restored 2026-06-19.';


--
-- Name: v_teacher_lesson_trends; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_teacher_lesson_trends WITH (security_invoker='true') AS
 SELECT p.id AS teacher_id,
    date_trunc('month'::text, l.scheduled_at) AS month,
    count(*) FILTER (WHERE (l.status = 'COMPLETED'::public.lesson_status)) AS completed,
    count(*) FILTER (WHERE (l.status = 'CANCELLED'::public.lesson_status)) AS cancelled,
    count(*) FILTER (WHERE (l.status = 'SCHEDULED'::public.lesson_status)) AS scheduled,
    count(*) AS total
   FROM (public.profiles p
     LEFT JOIN public.lessons l ON (((l.teacher_id = p.id) AND (l.deleted_at IS NULL) AND (l.scheduled_at >= date_trunc('month'::text, (now() - '1 year'::interval))) AND (l.scheduled_at < date_trunc('month'::text, (now() + '1 mon'::interval))))))
  WHERE ((p.is_teacher OR p.is_admin) AND (p.is_active = true))
  GROUP BY p.id, (date_trunc('month'::text, l.scheduled_at))
  ORDER BY p.id, (date_trunc('month'::text, l.scheduled_at)) DESC;


--
-- Name: VIEW v_teacher_lesson_trends; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_teacher_lesson_trends IS 'Monthly lesson trends per teacher for the last 12 months';


--
-- Name: webhook_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    channel_id text NOT NULL,
    resource_id text NOT NULL,
    expiration bigint NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: TABLE webhook_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.webhook_subscriptions IS 'External webhook subscriptions for push notifications (Google Calendar sync)';


--
-- Name: COLUMN webhook_subscriptions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.id IS 'Unique subscription identifier';


--
-- Name: COLUMN webhook_subscriptions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.user_id IS 'User who owns this webhook subscription';


--
-- Name: COLUMN webhook_subscriptions.provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.provider IS 'Provider name (e.g., google)';


--
-- Name: COLUMN webhook_subscriptions.channel_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.channel_id IS 'Unique channel ID for receiving webhook callbacks';


--
-- Name: COLUMN webhook_subscriptions.resource_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.resource_id IS 'External resource ID being watched';


--
-- Name: COLUMN webhook_subscriptions.expiration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.webhook_subscriptions.expiration IS 'Subscription expiration timestamp in milliseconds';


--
-- Name: audit_log_2026_01; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_01 FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');


--
-- Name: audit_log_2026_02; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_02 FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');


--
-- Name: audit_log_2026_03; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_03 FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');


--
-- Name: audit_log_2026_04; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_04 FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');


--
-- Name: audit_log_2026_05; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_05 FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');


--
-- Name: audit_log_2026_06; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_06 FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');


--
-- Name: audit_log_2026_07; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_07 FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');


--
-- Name: audit_log_2026_08; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_08 FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');


--
-- Name: audit_log_2026_09; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_09 FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');


--
-- Name: audit_log_2026_10; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_10 FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');


--
-- Name: audit_log_2026_11; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_11 FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');


--
-- Name: audit_log_2026_12; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_2026_12 FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');


--
-- Name: audit_log_default; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ATTACH PARTITION public.audit_log_default DEFAULT;


--
-- Name: agent_execution_logs agent_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs
    ADD CONSTRAINT agent_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_generations ai_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_prompt_templates ai_prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_stats ai_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_stats ai_usage_stats_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_unique UNIQUE (user_id, date, model_id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: apple_shortcut_song_import_log apple_shortcut_song_import_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_shortcut_song_import_log
    ADD CONSTRAINT apple_shortcut_song_import_log_pkey PRIMARY KEY (id);


--
-- Name: assignment_history assignment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_history
    ADD CONSTRAINT assignment_history_pkey PRIMARY KEY (id);


--
-- Name: assignment_templates assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_01 audit_log_2026_01_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_01
    ADD CONSTRAINT audit_log_2026_01_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_02 audit_log_2026_02_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_02
    ADD CONSTRAINT audit_log_2026_02_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_03 audit_log_2026_03_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_03
    ADD CONSTRAINT audit_log_2026_03_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_04 audit_log_2026_04_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_04
    ADD CONSTRAINT audit_log_2026_04_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_05 audit_log_2026_05_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_05
    ADD CONSTRAINT audit_log_2026_05_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_06 audit_log_2026_06_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_06
    ADD CONSTRAINT audit_log_2026_06_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_07 audit_log_2026_07_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_07
    ADD CONSTRAINT audit_log_2026_07_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_08 audit_log_2026_08_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_08
    ADD CONSTRAINT audit_log_2026_08_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_09 audit_log_2026_09_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_09
    ADD CONSTRAINT audit_log_2026_09_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_10 audit_log_2026_10_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_10
    ADD CONSTRAINT audit_log_2026_10_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_11 audit_log_2026_11_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_11
    ADD CONSTRAINT audit_log_2026_11_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_2026_12 audit_log_2026_12_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_2026_12
    ADD CONSTRAINT audit_log_2026_12_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_log_default audit_log_default_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_default
    ADD CONSTRAINT audit_log_default_pkey PRIMARY KEY (id, created_at);


--
-- Name: auth_events auth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_events
    ADD CONSTRAINT auth_events_pkey PRIMARY KEY (id);


--
-- Name: auth_rate_limits auth_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_rate_limits
    ADD CONSTRAINT auth_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: chord_quiz_attempts chord_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chord_quiz_attempts
    ADD CONSTRAINT chord_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: chord_srs chord_srs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chord_srs
    ADD CONSTRAINT chord_srs_pkey PRIMARY KEY (id);


--
-- Name: content_post_metrics content_post_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_post_metrics
    ADD CONSTRAINT content_post_metrics_pkey PRIMARY KEY (id);


--
-- Name: content_posts content_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_posts
    ADD CONSTRAINT content_posts_pkey PRIMARY KEY (id);


--
-- Name: content_posts content_posts_unique_slot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_posts
    ADD CONSTRAINT content_posts_unique_slot UNIQUE (song_id, platform, scheduled_at);


--
-- Name: drive_files drive_files_google_drive_file_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drive_files
    ADD CONSTRAINT drive_files_google_drive_file_id_key UNIQUE (google_drive_file_id);


--
-- Name: drive_files drive_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drive_files
    ADD CONSTRAINT drive_files_pkey PRIMARY KEY (id);


--
-- Name: hashtag_sets hashtag_sets_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hashtag_sets
    ADD CONSTRAINT hashtag_sets_name_key UNIQUE (name);


--
-- Name: hashtag_sets hashtag_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hashtag_sets
    ADD CONSTRAINT hashtag_sets_pkey PRIMARY KEY (id);


--
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


--
-- Name: lesson_history lesson_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_history
    ADD CONSTRAINT lesson_history_pkey PRIMARY KEY (id);


--
-- Name: lesson_songs lesson_songs_lesson_song_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_songs
    ADD CONSTRAINT lesson_songs_lesson_song_unique UNIQUE (lesson_id, song_id);


--
-- Name: lesson_songs lesson_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_songs
    ADD CONSTRAINT lesson_songs_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_google_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_google_event_id_key UNIQUE (google_event_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_teacher_student_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_teacher_student_number_unique UNIQUE (teacher_id, student_id, lesson_teacher_number);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_notification_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_notification_type_key UNIQUE (user_id, notification_type);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: song_of_the_week song_of_the_week_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_of_the_week
    ADD CONSTRAINT song_of_the_week_pkey PRIMARY KEY (id);


--
-- Name: song_requests song_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_requests
    ADD CONSTRAINT song_requests_pkey PRIMARY KEY (id);


--
-- Name: song_sections song_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_sections
    ADD CONSTRAINT song_sections_pkey PRIMARY KEY (id);


--
-- Name: song_status_history song_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_status_history
    ADD CONSTRAINT song_status_history_pkey PRIMARY KEY (id);


--
-- Name: song_videos song_videos_google_drive_file_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_videos
    ADD CONSTRAINT song_videos_google_drive_file_id_key UNIQUE (google_drive_file_id);


--
-- Name: song_videos song_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_videos
    ADD CONSTRAINT song_videos_pkey PRIMARY KEY (id);


--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);


--
-- Name: spotify_matches spotify_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spotify_matches
    ADD CONSTRAINT spotify_matches_pkey PRIMARY KEY (id);


--
-- Name: spotify_matches spotify_matches_song_id_spotify_track_id_status_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spotify_matches
    ADD CONSTRAINT spotify_matches_song_id_spotify_track_id_status_key UNIQUE (song_id, spotify_track_id, status) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: student_repertoire student_repertoire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_repertoire
    ADD CONSTRAINT student_repertoire_pkey PRIMARY KEY (id);


--
-- Name: student_song_progress student_song_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_song_progress
    ADD CONSTRAINT student_song_progress_pkey PRIMARY KEY (id);


--
-- Name: student_song_progress student_song_progress_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_song_progress
    ADD CONSTRAINT student_song_progress_unique UNIQUE (student_id, song_id);


--
-- Name: sync_conflicts sync_conflicts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_conflicts
    ADD CONSTRAINT sync_conflicts_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: theoretical_course_access theoretical_course_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_course_access
    ADD CONSTRAINT theoretical_course_access_pkey PRIMARY KEY (id);


--
-- Name: theoretical_courses theoretical_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_courses
    ADD CONSTRAINT theoretical_courses_pkey PRIMARY KEY (id);


--
-- Name: theoretical_lessons theoretical_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_lessons
    ADD CONSTRAINT theoretical_lessons_pkey PRIMARY KEY (id);


--
-- Name: chord_srs uq_chord_srs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chord_srs
    ADD CONSTRAINT uq_chord_srs UNIQUE (student_id, chord_id);


--
-- Name: theoretical_course_access uq_course_access; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_course_access
    ADD CONSTRAINT uq_course_access UNIQUE (course_id, user_id);


--
-- Name: student_repertoire uq_student_repertoire; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_repertoire
    ADD CONSTRAINT uq_student_repertoire UNIQUE (student_id, song_id);


--
-- Name: user_history user_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_history
    ADD CONSTRAINT user_history_pkey PRIMARY KEY (id);


--
-- Name: user_integrations user_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_integrations
    ADD CONSTRAINT user_integrations_pkey PRIMARY KEY (user_id, provider);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_unique UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: webhook_subscriptions webhook_subscriptions_channel_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_channel_id_key UNIQUE (channel_id);


--
-- Name: webhook_subscriptions webhook_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_log_action ON ONLY public.audit_log USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_01_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_01_action_created_at_idx ON public.audit_log_2026_01 USING btree (action, created_at DESC);


--
-- Name: ix_audit_log_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_log_actor ON ONLY public.audit_log USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_01_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_01_actor_id_created_at_idx ON public.audit_log_2026_01 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: ix_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_log_created_at ON ONLY public.audit_log USING btree (created_at DESC);


--
-- Name: audit_log_2026_01_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_01_created_at_idx ON public.audit_log_2026_01 USING btree (created_at DESC);


--
-- Name: ix_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_log_entity ON ONLY public.audit_log USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_01_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_01_entity_type_entity_id_created_at_idx ON public.audit_log_2026_01 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_02_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_02_action_created_at_idx ON public.audit_log_2026_02 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_02_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_02_actor_id_created_at_idx ON public.audit_log_2026_02 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_02_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_02_created_at_idx ON public.audit_log_2026_02 USING btree (created_at DESC);


--
-- Name: audit_log_2026_02_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_02_entity_type_entity_id_created_at_idx ON public.audit_log_2026_02 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_03_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_03_action_created_at_idx ON public.audit_log_2026_03 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_03_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_03_actor_id_created_at_idx ON public.audit_log_2026_03 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_03_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_03_created_at_idx ON public.audit_log_2026_03 USING btree (created_at DESC);


--
-- Name: audit_log_2026_03_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_03_entity_type_entity_id_created_at_idx ON public.audit_log_2026_03 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_04_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_04_action_created_at_idx ON public.audit_log_2026_04 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_04_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_04_actor_id_created_at_idx ON public.audit_log_2026_04 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_04_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_04_created_at_idx ON public.audit_log_2026_04 USING btree (created_at DESC);


--
-- Name: audit_log_2026_04_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_04_entity_type_entity_id_created_at_idx ON public.audit_log_2026_04 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_05_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_05_action_created_at_idx ON public.audit_log_2026_05 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_05_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_05_actor_id_created_at_idx ON public.audit_log_2026_05 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_05_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_05_created_at_idx ON public.audit_log_2026_05 USING btree (created_at DESC);


--
-- Name: audit_log_2026_05_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_05_entity_type_entity_id_created_at_idx ON public.audit_log_2026_05 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_06_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_06_action_created_at_idx ON public.audit_log_2026_06 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_06_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_06_actor_id_created_at_idx ON public.audit_log_2026_06 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_06_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_06_created_at_idx ON public.audit_log_2026_06 USING btree (created_at DESC);


--
-- Name: audit_log_2026_06_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_06_entity_type_entity_id_created_at_idx ON public.audit_log_2026_06 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_07_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_07_action_created_at_idx ON public.audit_log_2026_07 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_07_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_07_actor_id_created_at_idx ON public.audit_log_2026_07 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_07_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_07_created_at_idx ON public.audit_log_2026_07 USING btree (created_at DESC);


--
-- Name: audit_log_2026_07_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_07_entity_type_entity_id_created_at_idx ON public.audit_log_2026_07 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_08_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_08_action_created_at_idx ON public.audit_log_2026_08 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_08_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_08_actor_id_created_at_idx ON public.audit_log_2026_08 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_08_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_08_created_at_idx ON public.audit_log_2026_08 USING btree (created_at DESC);


--
-- Name: audit_log_2026_08_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_08_entity_type_entity_id_created_at_idx ON public.audit_log_2026_08 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_09_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_09_action_created_at_idx ON public.audit_log_2026_09 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_09_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_09_actor_id_created_at_idx ON public.audit_log_2026_09 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_09_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_09_created_at_idx ON public.audit_log_2026_09 USING btree (created_at DESC);


--
-- Name: audit_log_2026_09_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_09_entity_type_entity_id_created_at_idx ON public.audit_log_2026_09 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_10_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_10_action_created_at_idx ON public.audit_log_2026_10 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_10_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_10_actor_id_created_at_idx ON public.audit_log_2026_10 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_10_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_10_created_at_idx ON public.audit_log_2026_10 USING btree (created_at DESC);


--
-- Name: audit_log_2026_10_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_10_entity_type_entity_id_created_at_idx ON public.audit_log_2026_10 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_11_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_11_action_created_at_idx ON public.audit_log_2026_11 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_11_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_11_actor_id_created_at_idx ON public.audit_log_2026_11 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_11_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_11_created_at_idx ON public.audit_log_2026_11 USING btree (created_at DESC);


--
-- Name: audit_log_2026_11_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_11_entity_type_entity_id_created_at_idx ON public.audit_log_2026_11 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_2026_12_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_12_action_created_at_idx ON public.audit_log_2026_12 USING btree (action, created_at DESC);


--
-- Name: audit_log_2026_12_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_12_actor_id_created_at_idx ON public.audit_log_2026_12 USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_2026_12_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_12_created_at_idx ON public.audit_log_2026_12 USING btree (created_at DESC);


--
-- Name: audit_log_2026_12_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_2026_12_entity_type_entity_id_created_at_idx ON public.audit_log_2026_12 USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: audit_log_default_action_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_default_action_created_at_idx ON public.audit_log_default USING btree (action, created_at DESC);


--
-- Name: audit_log_default_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_default_actor_id_created_at_idx ON public.audit_log_default USING btree (actor_id, created_at DESC) WHERE (actor_id IS NOT NULL);


--
-- Name: audit_log_default_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_default_created_at_idx ON public.audit_log_default USING btree (created_at DESC);


--
-- Name: audit_log_default_entity_type_entity_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_default_entity_type_entity_id_created_at_idx ON public.audit_log_default USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: chord_quiz_attempts_chord_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chord_quiz_attempts_chord_idx ON public.chord_quiz_attempts USING btree (chord_id);


--
-- Name: chord_quiz_attempts_student_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chord_quiz_attempts_student_created_idx ON public.chord_quiz_attempts USING btree (student_id, created_at DESC);


--
-- Name: idx_agent_execution_logs_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_execution_logs_agent_id ON public.agent_execution_logs USING btree (agent_id);


--
-- Name: idx_agent_execution_logs_successful; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_execution_logs_successful ON public.agent_execution_logs USING btree (successful);


--
-- Name: idx_agent_execution_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_execution_logs_timestamp ON public.agent_execution_logs USING btree ("timestamp");


--
-- Name: idx_agent_execution_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_execution_logs_user_id ON public.agent_execution_logs USING btree (user_id);


--
-- Name: idx_ai_conversations_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_context ON public.ai_conversations USING btree (context_type, context_id);


--
-- Name: idx_ai_conversations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations USING btree (created_at DESC);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);


--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);


--
-- Name: idx_ai_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_messages_created_at ON public.ai_messages USING btree (created_at DESC);


--
-- Name: idx_ai_prompt_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_prompt_templates_active ON public.ai_prompt_templates USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_ai_prompt_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_prompt_templates_category ON public.ai_prompt_templates USING btree (category);


--
-- Name: idx_ai_prompt_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_prompt_templates_created_by ON public.ai_prompt_templates USING btree (created_by);


--
-- Name: idx_ai_usage_stats_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_stats_date ON public.ai_usage_stats USING btree (date DESC);


--
-- Name: idx_ai_usage_stats_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_stats_user_date ON public.ai_usage_stats USING btree (user_id, date);


--
-- Name: idx_api_keys_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key_hash ON public.api_keys USING btree (key_hash);


--
-- Name: idx_api_keys_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);


--
-- Name: idx_assignment_history_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_history_assignment_id ON public.assignment_history USING btree (assignment_id);


--
-- Name: idx_assignment_history_change_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_history_change_type ON public.assignment_history USING btree (change_type);


--
-- Name: idx_assignment_history_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_history_changed_at ON public.assignment_history USING btree (changed_at DESC);


--
-- Name: idx_assignment_history_changed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_history_changed_by ON public.assignment_history USING btree (changed_by);


--
-- Name: idx_assignment_templates_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_templates_teacher_id ON public.assignment_templates USING btree (teacher_id);


--
-- Name: idx_assignments_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_deleted_at ON public.assignments USING btree (deleted_at);


--
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- Name: idx_assignments_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_lesson_id ON public.assignments USING btree (lesson_id);


--
-- Name: idx_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_status ON public.assignments USING btree (status);


--
-- Name: idx_assignments_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_student_id ON public.assignments USING btree (student_id);


--
-- Name: idx_assignments_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_teacher_id ON public.assignments USING btree (teacher_id);


--
-- Name: idx_auth_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_events_event_type ON public.auth_events USING btree (event_type);


--
-- Name: idx_auth_events_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_events_occurred_at ON public.auth_events USING btree (occurred_at DESC);


--
-- Name: idx_auth_events_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_events_success ON public.auth_events USING btree (success);


--
-- Name: idx_auth_events_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_events_user_email ON public.auth_events USING btree (user_email);


--
-- Name: idx_content_post_metrics_post_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_post_metrics_post_time ON public.content_post_metrics USING btree (post_id, captured_at DESC);


--
-- Name: idx_content_posts_platform_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_posts_platform_status ON public.content_posts USING btree (platform, status);


--
-- Name: idx_content_posts_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_posts_scheduled_at ON public.content_posts USING btree (scheduled_at);


--
-- Name: idx_content_posts_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_posts_song ON public.content_posts USING btree (song_id);


--
-- Name: idx_content_posts_song_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_posts_song_video ON public.content_posts USING btree (song_video_id);


--
-- Name: idx_drive_files_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_display_order ON public.drive_files USING btree (entity_type, entity_id, display_order) WHERE (deleted_at IS NULL);


--
-- Name: idx_drive_files_drive_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_drive_id ON public.drive_files USING btree (google_drive_file_id);


--
-- Name: idx_drive_files_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_entity ON public.drive_files USING btree (entity_type, entity_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_drive_files_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_type ON public.drive_files USING btree (file_type) WHERE (deleted_at IS NULL);


--
-- Name: idx_drive_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_uploaded_by ON public.drive_files USING btree (uploaded_by) WHERE (deleted_at IS NULL);


--
-- Name: idx_drive_files_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drive_files_visibility ON public.drive_files USING btree (visibility) WHERE (deleted_at IS NULL);


--
-- Name: idx_hashtag_sets_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hashtag_sets_active ON public.hashtag_sets USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_in_app_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifications_created_at ON public.in_app_notifications USING btree (created_at DESC);


--
-- Name: idx_in_app_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifications_user_id ON public.in_app_notifications USING btree (user_id);


--
-- Name: idx_in_app_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_in_app_notifications_user_unread ON public.in_app_notifications USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_lesson_history_change_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_history_change_type ON public.lesson_history USING btree (change_type);


--
-- Name: idx_lesson_history_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_history_changed_at ON public.lesson_history USING btree (changed_at DESC);


--
-- Name: idx_lesson_history_changed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_history_changed_by ON public.lesson_history USING btree (changed_by);


--
-- Name: idx_lesson_history_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_history_lesson_id ON public.lesson_history USING btree (lesson_id);


--
-- Name: idx_lessons_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_deleted_at ON public.lessons USING btree (deleted_at);


--
-- Name: idx_lessons_google_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_google_event_id ON public.lessons USING btree (google_event_id);


--
-- Name: idx_profiles_deletion_requested; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_deletion_requested ON public.profiles USING btree (deletion_requested_at) WHERE (deletion_requested_at IS NOT NULL);


--
-- Name: idx_profiles_email_locked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email_locked ON public.profiles USING btree (email, locked_until) WHERE (locked_until IS NOT NULL);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_shortcut_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shortcut_log_status ON public.apple_shortcut_song_import_log USING btree (status);


--
-- Name: idx_shortcut_log_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shortcut_log_user_created ON public.apple_shortcut_song_import_log USING btree (user_id, created_at DESC);


--
-- Name: idx_song_sections_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_sections_order ON public.song_sections USING btree (song_id, order_position);


--
-- Name: idx_song_sections_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_sections_song_id ON public.song_sections USING btree (song_id);


--
-- Name: idx_song_status_history_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_status_history_changed_at ON public.song_status_history USING btree (changed_at DESC);


--
-- Name: idx_song_status_history_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_status_history_song_id ON public.song_status_history USING btree (song_id);


--
-- Name: idx_song_status_history_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_status_history_student_id ON public.song_status_history USING btree (student_id);


--
-- Name: idx_song_videos_drive_file; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_drive_file ON public.song_videos USING btree (google_drive_file_id);


--
-- Name: idx_song_videos_match_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_match_confidence ON public.song_videos USING btree (match_confidence);


--
-- Name: idx_song_videos_match_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_match_source ON public.song_videos USING btree (match_source);


--
-- Name: idx_song_videos_production_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_production_status ON public.song_videos USING btree (production_status);


--
-- Name: idx_song_videos_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_song_id ON public.song_videos USING btree (song_id);


--
-- Name: idx_song_videos_song_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_videos_song_order ON public.song_videos USING btree (song_id, display_order);


--
-- Name: idx_songs_author_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_author_trgm ON public.songs USING gin (author public.gin_trgm_ops);


--
-- Name: INDEX idx_songs_author_trgm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_songs_author_trgm IS 'Trigram index for fuzzy author matching (LIKE/ILIKE)';


--
-- Name: idx_songs_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_deleted_at ON public.songs USING btree (deleted_at);


--
-- Name: idx_songs_priority_bucket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_priority_bucket ON public.songs USING btree (priority_bucket) WHERE (priority_bucket IS NOT NULL);


--
-- Name: idx_songs_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_recorded_at ON public.songs USING btree (recorded_at) WHERE (recorded_at IS NOT NULL);


--
-- Name: idx_songs_recording_queued_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_recording_queued_at ON public.songs USING btree (recording_queued_at) WHERE (recording_queued_at IS NOT NULL);


--
-- Name: idx_songs_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_search ON public.songs USING gin (search_vector);


--
-- Name: INDEX idx_songs_search; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_songs_search IS 'GIN index for full-text search queries';


--
-- Name: idx_songs_title_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_songs_title_trgm ON public.songs USING gin (title public.gin_trgm_ops);


--
-- Name: INDEX idx_songs_title_trgm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_songs_title_trgm IS 'Trigram index for fuzzy title matching (LIKE/ILIKE)';


--
-- Name: idx_spotify_matches_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_confidence ON public.spotify_matches USING btree (confidence_score);


--
-- Name: idx_spotify_matches_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_created_at ON public.spotify_matches USING btree (created_at);


--
-- Name: idx_spotify_matches_reviewed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_reviewed_by ON public.spotify_matches USING btree (reviewed_by);


--
-- Name: idx_spotify_matches_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_song_id ON public.spotify_matches USING btree (song_id);


--
-- Name: idx_spotify_matches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_status ON public.spotify_matches USING btree (status);


--
-- Name: idx_spotify_matches_status_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spotify_matches_status_confidence ON public.spotify_matches USING btree (status, confidence_score DESC);


--
-- Name: idx_student_song_progress_last_practiced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_song_progress_last_practiced ON public.student_song_progress USING btree (last_practiced_at DESC);


--
-- Name: idx_student_song_progress_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_song_progress_song_id ON public.student_song_progress USING btree (song_id);


--
-- Name: idx_student_song_progress_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_song_progress_status ON public.student_song_progress USING btree (current_status);


--
-- Name: idx_student_song_progress_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_song_progress_student_id ON public.student_song_progress USING btree (student_id);


--
-- Name: idx_sync_conflicts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_conflicts_created_at ON public.sync_conflicts USING btree (created_at DESC);


--
-- Name: idx_sync_conflicts_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_conflicts_lesson_id ON public.sync_conflicts USING btree (lesson_id);


--
-- Name: idx_sync_conflicts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_conflicts_status ON public.sync_conflicts USING btree (status);


--
-- Name: idx_sync_conflicts_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_conflicts_status_created ON public.sync_conflicts USING btree (status, created_at DESC) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_system_logs_level_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_level_occurred_at ON public.system_logs USING btree (level, occurred_at DESC);


--
-- Name: idx_system_logs_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_occurred_at ON public.system_logs USING btree (occurred_at DESC);


--
-- Name: idx_system_logs_prefix_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_prefix_occurred_at ON public.system_logs USING btree (prefix, occurred_at DESC);


--
-- Name: idx_system_logs_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_request_id ON public.system_logs USING btree (request_id) WHERE (request_id IS NOT NULL);


--
-- Name: idx_system_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_user_id ON public.system_logs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_user_history_change_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_history_change_type ON public.user_history USING btree (change_type);


--
-- Name: idx_user_history_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_history_changed_at ON public.user_history USING btree (changed_at DESC);


--
-- Name: idx_user_history_changed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_history_changed_by ON public.user_history USING btree (changed_by);


--
-- Name: idx_user_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_history_user_id ON public.user_history USING btree (user_id);


--
-- Name: idx_webhook_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_subscriptions_user_id ON public.webhook_subscriptions USING btree (user_id);


--
-- Name: ix_ai_generations_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_generations_context ON public.ai_generations USING btree (context_entity_type, context_entity_id) WHERE (context_entity_type IS NOT NULL);


--
-- Name: ix_ai_generations_starred; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_generations_starred ON public.ai_generations USING btree (user_id, created_at DESC) WHERE (is_starred = true);


--
-- Name: ix_ai_generations_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_generations_type_date ON public.ai_generations USING btree (generation_type, created_at DESC);


--
-- Name: ix_ai_generations_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_generations_user_date ON public.ai_generations USING btree (user_id, created_at DESC);


--
-- Name: ix_ai_generations_user_type_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_generations_user_type_date ON public.ai_generations USING btree (user_id, generation_type, created_at DESC);


--
-- Name: ix_assignments_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assignments_song ON public.assignments USING btree (song_id) WHERE (song_id IS NOT NULL);


--
-- Name: ix_auth_rate_limits_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_auth_rate_limits_lookup ON public.auth_rate_limits USING btree (identifier, operation, attempted_at DESC);


--
-- Name: ix_chord_srs_student_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_chord_srs_student_due ON public.chord_srs USING btree (student_id, next_review_at);


--
-- Name: ix_lesson_songs_repertoire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lesson_songs_repertoire ON public.lesson_songs USING btree (repertoire_id) WHERE (repertoire_id IS NOT NULL);


--
-- Name: ix_mv_song_engagement_pk; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_mv_song_engagement_pk ON public.mv_song_engagement USING btree (song_id);


--
-- Name: ix_mv_song_engagement_popularity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mv_song_engagement_popularity ON public.mv_song_engagement USING btree (total_students DESC);


--
-- Name: ix_notification_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_entity ON public.notification_log USING btree (entity_type, entity_id) WHERE (entity_type IS NOT NULL);


--
-- Name: ix_notification_log_rate_limit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_rate_limit ON public.notification_log USING btree (created_at DESC) WHERE (status = ANY (ARRAY['sent'::public.notification_status, 'pending'::public.notification_status]));


--
-- Name: ix_notification_log_retry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_retry ON public.notification_log USING btree (status, retry_count) WHERE (status = 'failed'::public.notification_status);


--
-- Name: ix_notification_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_status ON public.notification_log USING btree (status, created_at DESC);


--
-- Name: ix_notification_log_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_type ON public.notification_log USING btree (notification_type, created_at DESC);


--
-- Name: ix_notification_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_log_user ON public.notification_log USING btree (recipient_user_id, created_at DESC);


--
-- Name: ix_notification_preferences_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_preferences_enabled ON public.notification_preferences USING btree (user_id, enabled) WHERE (enabled = true);


--
-- Name: ix_notification_preferences_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_preferences_type ON public.notification_preferences USING btree (notification_type);


--
-- Name: ix_notification_preferences_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_preferences_user ON public.notification_preferences USING btree (user_id);


--
-- Name: ix_notification_queue_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_queue_priority ON public.notification_queue USING btree (priority DESC, scheduled_for) WHERE (status = 'pending'::public.notification_status);


--
-- Name: ix_notification_queue_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_queue_scheduled ON public.notification_queue USING btree (scheduled_for) WHERE (status = 'pending'::public.notification_status);


--
-- Name: ix_notification_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_queue_status ON public.notification_queue USING btree (status);


--
-- Name: ix_notification_queue_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notification_queue_user ON public.notification_queue USING btree (recipient_user_id);


--
-- Name: ix_profiles_deletion_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_deletion_scheduled ON public.profiles USING btree (deletion_scheduled_for) WHERE (deletion_scheduled_for IS NOT NULL);


--
-- Name: ix_profiles_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_profiles_email_lower ON public.profiles USING btree (lower(email));


--
-- Name: INDEX ix_profiles_email_lower; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.ix_profiles_email_lower IS 'Case-insensitive unique email constraint';


--
-- Name: ix_profiles_invite_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_invite_email ON public.profiles USING btree (invite_email) WHERE (invite_email IS NOT NULL);


--
-- Name: ix_profiles_is_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_is_parent ON public.profiles USING btree (is_parent) WHERE (is_parent = true);


--
-- Name: ix_profiles_locked_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_locked_until ON public.profiles USING btree (locked_until) WHERE (locked_until IS NOT NULL);


--
-- Name: ix_profiles_onboarding_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_onboarding_completed ON public.profiles USING btree (onboarding_completed) WHERE ((onboarding_completed = false) AND (is_student = true));


--
-- Name: ix_profiles_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_profiles_parent_id ON public.profiles USING btree (parent_id);


--
-- Name: ix_song_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_song_requests_status ON public.song_requests USING btree (status);


--
-- Name: ix_song_requests_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_song_requests_student_id ON public.song_requests USING btree (student_id);


--
-- Name: ix_songs_is_draft; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_songs_is_draft ON public.songs USING btree (is_draft) WHERE (is_draft = true);


--
-- Name: ix_sotw_active_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sotw_active_from ON public.song_of_the_week USING btree (active_from DESC);


--
-- Name: ix_sotw_song_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sotw_song_id ON public.song_of_the_week USING btree (song_id);


--
-- Name: ix_student_repertoire_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_priority ON public.student_repertoire USING btree (student_id, priority, sort_order);


--
-- Name: ix_student_repertoire_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_song ON public.student_repertoire USING btree (song_id);


--
-- Name: ix_student_repertoire_song_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_song_status ON public.student_repertoire USING btree (song_id, current_status);


--
-- Name: ix_student_repertoire_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_student ON public.student_repertoire USING btree (student_id);


--
-- Name: ix_student_repertoire_student_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_student_active ON public.student_repertoire USING btree (student_id, is_active) WHERE (is_active = true);


--
-- Name: ix_student_repertoire_student_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_student_repertoire_student_status ON public.student_repertoire USING btree (student_id, current_status);


--
-- Name: ix_theoretical_course_access_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_theoretical_course_access_course ON public.theoretical_course_access USING btree (course_id);


--
-- Name: ix_theoretical_course_access_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_theoretical_course_access_user ON public.theoretical_course_access USING btree (user_id);


--
-- Name: ix_user_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: lesson_songs_lesson_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_songs_lesson_id_idx ON public.lesson_songs USING btree (lesson_id);


--
-- Name: lesson_songs_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_songs_song_id_idx ON public.lesson_songs USING btree (song_id);


--
-- Name: lessons_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_student_id_idx ON public.lessons USING btree (student_id);


--
-- Name: lessons_teacher_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_teacher_id_idx ON public.lessons USING btree (teacher_id);


--
-- Name: mv_song_popularity_level_times_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mv_song_popularity_level_times_assigned_idx ON public.mv_song_popularity USING btree (level, times_assigned DESC);


--
-- Name: mv_song_popularity_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mv_song_popularity_song_id_idx ON public.mv_song_popularity USING btree (song_id);


--
-- Name: mv_song_popularity_times_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mv_song_popularity_times_assigned_idx ON public.mv_song_popularity USING btree (times_assigned DESC);


--
-- Name: practice_sessions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX practice_sessions_created_at_idx ON public.practice_sessions USING btree (created_at DESC);


--
-- Name: practice_sessions_song_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX practice_sessions_song_id_idx ON public.practice_sessions USING btree (song_id);


--
-- Name: practice_sessions_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX practice_sessions_student_id_idx ON public.practice_sessions USING btree (student_id);


--
-- Name: songs_author_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX songs_author_idx ON public.songs USING btree (author);


--
-- Name: songs_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX songs_title_idx ON public.songs USING btree (title);


--
-- Name: uix_songs_title_author_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uix_songs_title_author_active ON public.songs USING btree (lower(TRIM(BOTH FROM title)), lower(TRIM(BOTH FROM COALESCE(author, ''::text)))) WHERE (deleted_at IS NULL);


--
-- Name: uq_sotw_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_sotw_active ON public.song_of_the_week USING btree (is_active) WHERE (is_active = true);


--
-- Name: user_roles_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_role_idx ON public.user_roles USING btree (role);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: audit_log_2026_01_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_01_action_created_at_idx;


--
-- Name: audit_log_2026_01_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_01_actor_id_created_at_idx;


--
-- Name: audit_log_2026_01_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_01_created_at_idx;


--
-- Name: audit_log_2026_01_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_01_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_01_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_01_pkey;


--
-- Name: audit_log_2026_02_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_02_action_created_at_idx;


--
-- Name: audit_log_2026_02_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_02_actor_id_created_at_idx;


--
-- Name: audit_log_2026_02_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_02_created_at_idx;


--
-- Name: audit_log_2026_02_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_02_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_02_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_02_pkey;


--
-- Name: audit_log_2026_03_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_03_action_created_at_idx;


--
-- Name: audit_log_2026_03_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_03_actor_id_created_at_idx;


--
-- Name: audit_log_2026_03_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_03_created_at_idx;


--
-- Name: audit_log_2026_03_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_03_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_03_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_03_pkey;


--
-- Name: audit_log_2026_04_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_04_action_created_at_idx;


--
-- Name: audit_log_2026_04_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_04_actor_id_created_at_idx;


--
-- Name: audit_log_2026_04_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_04_created_at_idx;


--
-- Name: audit_log_2026_04_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_04_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_04_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_04_pkey;


--
-- Name: audit_log_2026_05_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_05_action_created_at_idx;


--
-- Name: audit_log_2026_05_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_05_actor_id_created_at_idx;


--
-- Name: audit_log_2026_05_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_05_created_at_idx;


--
-- Name: audit_log_2026_05_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_05_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_05_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_05_pkey;


--
-- Name: audit_log_2026_06_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_06_action_created_at_idx;


--
-- Name: audit_log_2026_06_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_06_actor_id_created_at_idx;


--
-- Name: audit_log_2026_06_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_06_created_at_idx;


--
-- Name: audit_log_2026_06_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_06_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_06_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_06_pkey;


--
-- Name: audit_log_2026_07_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_07_action_created_at_idx;


--
-- Name: audit_log_2026_07_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_07_actor_id_created_at_idx;


--
-- Name: audit_log_2026_07_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_07_created_at_idx;


--
-- Name: audit_log_2026_07_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_07_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_07_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_07_pkey;


--
-- Name: audit_log_2026_08_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_08_action_created_at_idx;


--
-- Name: audit_log_2026_08_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_08_actor_id_created_at_idx;


--
-- Name: audit_log_2026_08_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_08_created_at_idx;


--
-- Name: audit_log_2026_08_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_08_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_08_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_08_pkey;


--
-- Name: audit_log_2026_09_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_09_action_created_at_idx;


--
-- Name: audit_log_2026_09_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_09_actor_id_created_at_idx;


--
-- Name: audit_log_2026_09_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_09_created_at_idx;


--
-- Name: audit_log_2026_09_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_09_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_09_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_09_pkey;


--
-- Name: audit_log_2026_10_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_10_action_created_at_idx;


--
-- Name: audit_log_2026_10_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_10_actor_id_created_at_idx;


--
-- Name: audit_log_2026_10_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_10_created_at_idx;


--
-- Name: audit_log_2026_10_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_10_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_10_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_10_pkey;


--
-- Name: audit_log_2026_11_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_11_action_created_at_idx;


--
-- Name: audit_log_2026_11_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_11_actor_id_created_at_idx;


--
-- Name: audit_log_2026_11_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_11_created_at_idx;


--
-- Name: audit_log_2026_11_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_11_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_11_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_11_pkey;


--
-- Name: audit_log_2026_12_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_2026_12_action_created_at_idx;


--
-- Name: audit_log_2026_12_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_2026_12_actor_id_created_at_idx;


--
-- Name: audit_log_2026_12_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_2026_12_created_at_idx;


--
-- Name: audit_log_2026_12_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_2026_12_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_2026_12_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_2026_12_pkey;


--
-- Name: audit_log_default_action_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_action ATTACH PARTITION public.audit_log_default_action_created_at_idx;


--
-- Name: audit_log_default_actor_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_actor ATTACH PARTITION public.audit_log_default_actor_id_created_at_idx;


--
-- Name: audit_log_default_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_created_at ATTACH PARTITION public.audit_log_default_created_at_idx;


--
-- Name: audit_log_default_entity_type_entity_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.ix_audit_log_entity ATTACH PARTITION public.audit_log_default_entity_type_entity_id_created_at_idx;


--
-- Name: audit_log_default_pkey; Type: INDEX ATTACH; Schema: public; Owner: -
--

ALTER INDEX public.audit_log_pkey ATTACH PARTITION public.audit_log_default_pkey;


--
-- Name: content_posts content_posts_sync_published_flag; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER content_posts_sync_published_flag AFTER INSERT OR DELETE OR UPDATE OF status, song_video_id, platform ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.sync_song_video_published_flag();


--
-- Name: song_of_the_week handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.song_of_the_week FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_posts set_content_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_content_posts_updated_at BEFORE UPDATE ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hashtag_sets set_hashtag_sets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_hashtag_sets_updated_at BEFORE UPDATE ON public.hashtag_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: in_app_notifications set_in_app_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_in_app_notifications_updated_at BEFORE UPDATE ON public.in_app_notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: song_videos set_song_videos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_song_videos_updated_at BEFORE UPDATE ON public.song_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles tr_initialize_notification_preferences; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_initialize_notification_preferences AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_notification_preferences();


--
-- Name: lesson_songs tr_lesson_songs_notify_mastery; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lesson_songs_notify_mastery AFTER UPDATE ON public.lesson_songs FOR EACH ROW EXECUTE FUNCTION public.tr_notify_song_mastery();


--
-- Name: lesson_songs tr_lesson_songs_sync_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lesson_songs_sync_on_insert BEFORE INSERT ON public.lesson_songs FOR EACH ROW EXECUTE FUNCTION public.fn_sync_lesson_song_to_repertoire();


--
-- Name: lesson_songs tr_lesson_songs_sync_on_status_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lesson_songs_sync_on_status_update BEFORE UPDATE OF status ON public.lesson_songs FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.fn_sync_lesson_song_to_repertoire();


--
-- Name: lessons tr_lessons_notify_cancelled; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lessons_notify_cancelled AFTER UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.tr_notify_lesson_cancelled();


--
-- Name: lessons tr_lessons_notify_completed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lessons_notify_completed AFTER UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.tr_notify_lesson_completed();


--
-- Name: lessons tr_lessons_notify_rescheduled; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_lessons_notify_rescheduled AFTER UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.tr_notify_lesson_rescheduled();


--
-- Name: notification_log tr_notification_log_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_notification_log_updated BEFORE UPDATE ON public.notification_log FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();


--
-- Name: notification_preferences tr_notification_preferences_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_notification_preferences_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();


--
-- Name: notification_queue tr_notification_queue_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_notification_queue_updated BEFORE UPDATE ON public.notification_queue FOR EACH ROW EXECUTE FUNCTION public.update_notification_timestamp();


--
-- Name: practice_sessions tr_practice_sessions_reverse_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_practice_sessions_reverse_progress AFTER DELETE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION public.reverse_song_progress_from_practice();


--
-- Name: profiles tr_profiles_notify_welcome; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_profiles_notify_welcome AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tr_notify_student_welcome();


--
-- Name: student_repertoire tr_student_repertoire_record_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_student_repertoire_record_history AFTER UPDATE OF current_status ON public.student_repertoire FOR EACH ROW EXECUTE FUNCTION public.fn_record_progress_history();


--
-- Name: student_repertoire tr_student_repertoire_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_student_repertoire_updated_at BEFORE UPDATE ON public.student_repertoire FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: song_requests trg_song_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_song_requests_updated_at BEFORE UPDATE ON public.song_requests FOR EACH ROW EXECUTE FUNCTION public.update_song_requests_updated_at();


--
-- Name: profiles trg_sync_full_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_full_name BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_full_name();


--
-- Name: lessons trigger_set_lesson_numbers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_lesson_numbers BEFORE INSERT ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_lesson_numbers();


--
-- Name: profiles trigger_sync_profile_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_profile_roles AFTER INSERT OR UPDATE OF is_admin, is_teacher, is_student ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_profile_roles();


--
-- Name: assignments trigger_track_assignment_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_assignment_changes AFTER INSERT OR DELETE OR UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.track_assignment_changes();


--
-- Name: lessons trigger_track_lesson_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_lesson_changes AFTER INSERT OR DELETE OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.track_lesson_changes();


--
-- Name: lesson_songs trigger_track_song_status_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_song_status_changes AFTER INSERT OR UPDATE OF status ON public.lesson_songs FOR EACH ROW EXECUTE FUNCTION public.track_song_status_changes();


--
-- Name: profiles trigger_track_user_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_track_user_changes AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.track_user_changes();


--
-- Name: sync_conflicts trigger_update_sync_conflicts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_sync_conflicts_updated_at BEFORE UPDATE ON public.sync_conflicts FOR EACH ROW EXECUTE FUNCTION public.update_sync_conflicts_updated_at();


--
-- Name: ai_conversations trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_generations trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.ai_generations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_prompt_templates trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.ai_prompt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_usage_stats trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.ai_usage_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignment_templates trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.assignment_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignments trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lesson_songs trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.lesson_songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lessons trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: practice_sessions trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: songs trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_song_progress trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.student_song_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_integrations trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.user_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: webhook_subscriptions trigger_update_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_updated_at BEFORE UPDATE ON public.webhook_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: drive_files update_drive_files_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_drive_files_updated_at BEFORE UPDATE ON public.drive_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: spotify_matches update_spotify_matches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_spotify_matches_updated_at BEFORE UPDATE ON public.spotify_matches FOR EACH ROW EXECUTE FUNCTION public.update_spotify_matches_updated_at();


--
-- Name: user_settings user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_user_settings_updated_at();


--
-- Name: agent_execution_logs agent_execution_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_execution_logs
    ADD CONSTRAINT agent_execution_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_conversations ai_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_generations ai_generations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: ai_prompt_templates ai_prompt_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_prompt_templates
    ADD CONSTRAINT ai_prompt_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: ai_usage_stats ai_usage_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: apple_shortcut_song_import_log apple_shortcut_song_import_log_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_shortcut_song_import_log
    ADD CONSTRAINT apple_shortcut_song_import_log_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE SET NULL;


--
-- Name: apple_shortcut_song_import_log apple_shortcut_song_import_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apple_shortcut_song_import_log
    ADD CONSTRAINT apple_shortcut_song_import_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assignment_history assignment_history_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_history
    ADD CONSTRAINT assignment_history_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_history assignment_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_history
    ADD CONSTRAINT assignment_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: assignment_templates assignment_templates_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_templates
    ADD CONSTRAINT assignment_templates_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: assignments assignments_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE SET NULL;


--
-- Name: assignments assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignments assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public.audit_log
    ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: chord_quiz_attempts chord_quiz_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chord_quiz_attempts
    ADD CONSTRAINT chord_quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: chord_srs chord_srs_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chord_srs
    ADD CONSTRAINT chord_srs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: content_post_metrics content_post_metrics_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_post_metrics
    ADD CONSTRAINT content_post_metrics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.content_posts(id) ON DELETE CASCADE;


--
-- Name: content_posts content_posts_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_posts
    ADD CONSTRAINT content_posts_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: content_posts content_posts_song_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_posts
    ADD CONSTRAINT content_posts_song_video_id_fkey FOREIGN KEY (song_video_id) REFERENCES public.song_videos(id) ON DELETE SET NULL;


--
-- Name: drive_files drive_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drive_files
    ADD CONSTRAINT drive_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assignment_history fk_assignment_history_changed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_history
    ADD CONSTRAINT fk_assignment_history_changed_by FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: lesson_history fk_lesson_history_changed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_history
    ADD CONSTRAINT fk_lesson_history_changed_by FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: in_app_notifications in_app_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lesson_history lesson_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_history
    ADD CONSTRAINT lesson_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lesson_history lesson_history_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_history
    ADD CONSTRAINT lesson_history_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_songs lesson_songs_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_songs
    ADD CONSTRAINT lesson_songs_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_songs lesson_songs_repertoire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_songs
    ADD CONSTRAINT lesson_songs_repertoire_id_fkey FOREIGN KEY (repertoire_id) REFERENCES public.student_repertoire(id) ON DELETE SET NULL;


--
-- Name: lesson_songs lesson_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_songs
    ADD CONSTRAINT lesson_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lessons lessons_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_log notification_log_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notification_queue notification_queue_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: practice_sessions practice_sessions_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE SET NULL;


--
-- Name: practice_sessions practice_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: song_of_the_week song_of_the_week_selected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_of_the_week
    ADD CONSTRAINT song_of_the_week_selected_by_fkey FOREIGN KEY (selected_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: song_of_the_week song_of_the_week_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_of_the_week
    ADD CONSTRAINT song_of_the_week_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: song_requests song_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_requests
    ADD CONSTRAINT song_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);


--
-- Name: song_requests song_requests_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_requests
    ADD CONSTRAINT song_requests_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id);


--
-- Name: song_requests song_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_requests
    ADD CONSTRAINT song_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: song_sections song_sections_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_sections
    ADD CONSTRAINT song_sections_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: song_status_history song_status_history_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_status_history
    ADD CONSTRAINT song_status_history_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: song_status_history song_status_history_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_status_history
    ADD CONSTRAINT song_status_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: song_status_history song_status_history_student_id_profiles_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_status_history
    ADD CONSTRAINT song_status_history_student_id_profiles_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: song_videos song_videos_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_videos
    ADD CONSTRAINT song_videos_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: song_videos song_videos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_videos
    ADD CONSTRAINT song_videos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: spotify_matches spotify_matches_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spotify_matches
    ADD CONSTRAINT spotify_matches_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: spotify_matches spotify_matches_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spotify_matches
    ADD CONSTRAINT spotify_matches_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: student_repertoire student_repertoire_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_repertoire
    ADD CONSTRAINT student_repertoire_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_repertoire student_repertoire_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_repertoire
    ADD CONSTRAINT student_repertoire_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: student_repertoire student_repertoire_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_repertoire
    ADD CONSTRAINT student_repertoire_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: student_song_progress student_song_progress_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_song_progress
    ADD CONSTRAINT student_song_progress_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;


--
-- Name: student_song_progress student_song_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_song_progress
    ADD CONSTRAINT student_song_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: sync_conflicts sync_conflicts_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_conflicts
    ADD CONSTRAINT sync_conflicts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: theoretical_course_access theoretical_course_access_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_course_access
    ADD CONSTRAINT theoretical_course_access_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.theoretical_courses(id) ON DELETE CASCADE;


--
-- Name: theoretical_course_access theoretical_course_access_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_course_access
    ADD CONSTRAINT theoretical_course_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: theoretical_course_access theoretical_course_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_course_access
    ADD CONSTRAINT theoretical_course_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: theoretical_courses theoretical_courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_courses
    ADD CONSTRAINT theoretical_courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: theoretical_lessons theoretical_lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theoretical_lessons
    ADD CONSTRAINT theoretical_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.theoretical_courses(id) ON DELETE CASCADE;


--
-- Name: user_history user_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_history
    ADD CONSTRAINT user_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: user_integrations user_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_integrations
    ADD CONSTRAINT user_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: webhook_subscriptions webhook_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: spotify_matches Admins and teachers can insert spotify matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and teachers can insert spotify matches" ON public.spotify_matches FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_overview
  WHERE ((user_overview.user_id = auth.uid()) AND ((user_overview.is_admin = true) OR (user_overview.is_teacher = true))))));


--
-- Name: spotify_matches Admins and teachers can update spotify matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and teachers can update spotify matches" ON public.spotify_matches FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_overview
  WHERE ((user_overview.user_id = auth.uid()) AND ((user_overview.is_admin = true) OR (user_overview.is_teacher = true))))));


--
-- Name: chord_quiz_attempts Admins and teachers can view all chord quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and teachers can view all chord quiz attempts" ON public.chord_quiz_attempts FOR SELECT USING (public.is_admin_or_teacher());


--
-- Name: spotify_matches Admins and teachers can view spotify matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and teachers can view spotify matches" ON public.spotify_matches FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_overview
  WHERE ((user_overview.user_id = auth.uid()) AND ((user_overview.is_admin = true) OR (user_overview.is_teacher = true))))));


--
-- Name: song_of_the_week Admins can delete SOTW; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete SOTW" ON public.song_of_the_week FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: assignment_templates Admins can delete all assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all assignment templates" ON public.assignment_templates FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: spotify_matches Admins can delete spotify matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete spotify matches" ON public.spotify_matches FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_overview
  WHERE ((user_overview.user_id = auth.uid()) AND (user_overview.is_admin = true)))));


--
-- Name: song_of_the_week Admins can insert SOTW; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert SOTW" ON public.song_of_the_week FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: assignment_templates Admins can insert assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert assignment templates" ON public.assignment_templates FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: user_preferences Admins can read all preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all preferences" ON public.user_preferences FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: user_settings Admins can read all settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all settings" ON public.user_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: song_of_the_week Admins can update SOTW; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update SOTW" ON public.song_of_the_week FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: assignment_templates Admins can update all assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all assignment templates" ON public.assignment_templates FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: agent_execution_logs Admins can view all agent execution logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all agent execution logs" ON public.agent_execution_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: assignment_templates Admins can view all assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all assignment templates" ON public.assignment_templates FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: practice_sessions Admins can view all practice sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all practice sessions" ON public.practice_sessions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: auth_events Admins can view auth events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view auth events" ON public.auth_events FOR SELECT USING (public.is_admin());


--
-- Name: user_history Allow admins to insert user history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to insert user history" ON public.user_history FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: agent_execution_logs Allow agent execution log inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow agent execution log inserts" ON public.agent_execution_logs FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: lesson_songs Allow authenticated users to read lesson_songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read lesson_songs" ON public.lesson_songs FOR SELECT TO authenticated USING (true);


--
-- Name: user_history Allow authenticated users to view user history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view user history" ON public.user_history FOR SELECT TO authenticated USING (true);


--
-- Name: song_of_the_week Authenticated users can view SOTW; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view SOTW" ON public.song_of_the_week FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: assignment_history Only system can insert assignment history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only system can insert assignment history" ON public.assignment_history FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: lesson_history Only system can insert lesson history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only system can insert lesson history" ON public.lesson_history FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: in_app_notifications Service role can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert notifications" ON public.in_app_notifications FOR INSERT WITH CHECK (true);


--
-- Name: chord_srs Staff read all SRS state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff read all SRS state" ON public.chord_srs FOR SELECT USING (public.is_admin_or_teacher());


--
-- Name: song_requests Students can create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can create requests" ON public.song_requests FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: practice_sessions Students can insert own practice sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert own practice sessions" ON public.practice_sessions FOR INSERT WITH CHECK ((student_id = auth.uid()));


--
-- Name: chord_quiz_attempts Students can insert their own chord quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own chord quiz attempts" ON public.chord_quiz_attempts FOR INSERT WITH CHECK ((student_id = auth.uid()));


--
-- Name: student_song_progress Students can insert their own song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own song progress" ON public.student_song_progress FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: song_status_history Students can insert their own song status changes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own song status changes" ON public.song_status_history FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: song_requests Students can read own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can read own requests" ON public.song_requests FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: practice_sessions Students can update own practice sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update own practice sessions" ON public.practice_sessions FOR UPDATE USING ((student_id = auth.uid()));


--
-- Name: student_song_progress Students can update their own song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own song progress" ON public.student_song_progress FOR UPDATE USING ((auth.uid() = student_id));


--
-- Name: practice_sessions Students can view own practice sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own practice sessions" ON public.practice_sessions FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: chord_quiz_attempts Students can view their own chord quiz attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own chord quiz attempts" ON public.chord_quiz_attempts FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: student_song_progress Students can view their own song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own song progress" ON public.student_song_progress FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: song_status_history Students can view their own song status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own song status history" ON public.song_status_history FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: chord_srs Students insert own SRS state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students insert own SRS state" ON public.chord_srs FOR INSERT WITH CHECK ((student_id = auth.uid()));


--
-- Name: chord_srs Students read own SRS state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students read own SRS state" ON public.chord_srs FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: chord_srs Students update own SRS state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students update own SRS state" ON public.chord_srs FOR UPDATE USING ((student_id = auth.uid()));


--
-- Name: student_song_progress Teachers and admins can view all song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers and admins can view all song progress" ON public.student_song_progress FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: song_status_history Teachers and admins can view all song status history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers and admins can view all song status history" ON public.song_status_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: profiles Teachers can create student profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can create student profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role('teacher'::public.user_role));


--
-- Name: assignment_templates Teachers can delete their own assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can delete their own assignment templates" ON public.assignment_templates FOR DELETE USING ((auth.uid() = teacher_id));


--
-- Name: student_song_progress Teachers can insert student song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can insert student song progress" ON public.student_song_progress FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: assignment_templates Teachers can insert their own assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can insert their own assignment templates" ON public.assignment_templates FOR INSERT WITH CHECK (((auth.uid() = teacher_id) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_teacher = true))))));


--
-- Name: profiles Teachers can read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (((public.has_role('teacher'::public.user_role) AND ((is_active = true) OR (id = auth.uid()))) OR public.is_admin()));


--
-- Name: song_requests Teachers can read all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can read all requests" ON public.song_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_teacher = true) OR (profiles.is_admin = true))))));


--
-- Name: song_requests Teachers can update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can update requests" ON public.song_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_teacher = true) OR (profiles.is_admin = true))))));


--
-- Name: student_song_progress Teachers can update student song progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can update student song progress" ON public.student_song_progress FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: assignment_templates Teachers can update their own assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can update their own assignment templates" ON public.assignment_templates FOR UPDATE USING ((auth.uid() = teacher_id));


--
-- Name: assignment_templates Teachers can view their own assignment templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view their own assignment templates" ON public.assignment_templates FOR SELECT USING ((auth.uid() = teacher_id));


--
-- Name: api_keys Users can create their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own API keys" ON public.api_keys FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: in_app_notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications" ON public.in_app_notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can delete their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own API keys" ON public.api_keys FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_integrations Users can delete their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own integrations" ON public.user_integrations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: webhook_subscriptions Users can delete their own webhook subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own webhook subscriptions" ON public.webhook_subscriptions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: apple_shortcut_song_import_log Users can insert own import logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own import logs" ON public.apple_shortcut_song_import_log FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can insert own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_integrations Users can insert their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own integrations" ON public.user_integrations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: webhook_subscriptions Users can insert their own webhook subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own webhook subscriptions" ON public.webhook_subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: apple_shortcut_song_import_log Users can read own import logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own import logs" ON public.apple_shortcut_song_import_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can read own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can read own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: in_app_notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.in_app_notifications FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can update own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: api_keys Users can update their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own API keys" ON public.api_keys FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_integrations Users can update their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own integrations" ON public.user_integrations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: webhook_subscriptions Users can update their own webhook subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own webhook subscriptions" ON public.webhook_subscriptions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: assignment_history Users can view assignment history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view assignment history" ON public.assignment_history FOR SELECT TO authenticated USING (true);


--
-- Name: lesson_history Users can view lesson history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view lesson history" ON public.lesson_history FOR SELECT TO authenticated USING (true);


--
-- Name: in_app_notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.in_app_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: api_keys Users can view their own API keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own API keys" ON public.api_keys FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_execution_logs Users can view their own agent execution logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agent execution logs" ON public.agent_execution_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_integrations Users can view their own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own integrations" ON public.user_integrations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: webhook_subscriptions Users can view their own webhook subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own webhook subscriptions" ON public.webhook_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_usage_stats admin_select_all_usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_usage ON public.ai_usage_stats FOR SELECT USING (public.is_admin());


--
-- Name: agent_execution_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_generations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_generations ai_generations_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_delete_admin ON public.ai_generations FOR DELETE USING (public.is_admin());


--
-- Name: ai_generations ai_generations_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_delete_own ON public.ai_generations FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: ai_generations ai_generations_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_insert ON public.ai_generations FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: ai_generations ai_generations_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_select_admin ON public.ai_generations FOR SELECT USING (public.is_admin());


--
-- Name: ai_generations ai_generations_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_select_own ON public.ai_generations FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ai_generations ai_generations_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generations_update_own ON public.ai_generations FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_prompt_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: apple_shortcut_song_import_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apple_shortcut_song_import_log ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments assignments_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_delete_policy ON public.assignments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: assignments assignments_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_insert_policy ON public.assignments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: assignments assignments_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_select_parent ON public.assignments FOR SELECT TO authenticated USING (public.is_child_of_parent(student_id));


--
-- Name: assignments assignments_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_select_policy ON public.assignments FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))) OR (teacher_id = auth.uid()) OR (student_id = auth.uid())));


--
-- Name: assignments assignments_student_status_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_student_status_update ON public.assignments FOR UPDATE TO authenticated USING ((student_id = auth.uid())) WITH CHECK ((student_id = auth.uid()));


--
-- Name: POLICY assignments_student_status_update ON assignments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY assignments_student_status_update ON public.assignments IS 'Allows a student to UPDATE their own assignment row (status transitions). Column-scope enforced in app layer.';


--
-- Name: assignments assignments_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_update_policy ON public.assignments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_01; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_01 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_02; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_02 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_03; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_03 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_04; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_04 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_05; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_05 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_06; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_06 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_07; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_07 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_08; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_08 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_09; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_09 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_10; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_10 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_11; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_11 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_2026_12; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_2026_12 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_default; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_default ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_log_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select_admin ON public.audit_log FOR SELECT USING (public.is_admin());


--
-- Name: audit_log audit_log_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select_own ON public.audit_log FOR SELECT USING ((actor_id = auth.uid()));


--
-- Name: auth_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_rate_limits auth_rate_limits_service_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_rate_limits_service_only ON public.auth_rate_limits USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: chord_quiz_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chord_quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: chord_srs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chord_srs ENABLE ROW LEVEL SECURITY;

--
-- Name: content_post_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_post_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: content_post_metrics content_post_metrics_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_post_metrics_delete ON public.content_post_metrics FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: content_post_metrics content_post_metrics_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_post_metrics_insert ON public.content_post_metrics FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


--
-- Name: content_post_metrics content_post_metrics_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_post_metrics_select ON public.content_post_metrics FOR SELECT TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: content_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: content_posts content_posts_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_posts_delete ON public.content_posts FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: content_posts content_posts_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_posts_insert ON public.content_posts FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


--
-- Name: content_posts content_posts_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_posts_select ON public.content_posts FOR SELECT TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: content_posts content_posts_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_posts_update ON public.content_posts FOR UPDATE TO authenticated USING (public.is_admin_or_teacher()) WITH CHECK (public.is_admin_or_teacher());


--
-- Name: ai_conversations delete_own_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_own_conversations ON public.ai_conversations FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: profiles delete_own_or_admin_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_own_or_admin_profile ON public.profiles FOR DELETE USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));


--
-- Name: ai_prompt_templates delete_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_templates ON public.ai_prompt_templates FOR DELETE USING ((((created_by = auth.uid()) AND (is_system = false)) OR public.is_admin()));


--
-- Name: user_roles delete_user_roles_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_user_roles_admin ON public.user_roles FOR DELETE USING (public.is_admin());


--
-- Name: drive_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

--
-- Name: drive_files drive_files_delete_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY drive_files_delete_staff ON public.drive_files FOR DELETE USING (public.is_admin_or_teacher());


--
-- Name: drive_files drive_files_insert_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY drive_files_insert_staff ON public.drive_files FOR INSERT WITH CHECK ((public.is_admin_or_teacher() AND (uploaded_by = auth.uid())));


--
-- Name: drive_files drive_files_select_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY drive_files_select_staff ON public.drive_files FOR SELECT USING (((deleted_at IS NULL) AND public.is_admin_or_teacher()));


--
-- Name: drive_files drive_files_select_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY drive_files_select_student ON public.drive_files FOR SELECT USING (((deleted_at IS NULL) AND public.is_student() AND (((visibility)::text = 'public'::text) OR (((visibility)::text = 'students'::text) AND ((((entity_type)::text = 'lesson'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons
  WHERE ((lessons.id = drive_files.entity_id) AND (lessons.student_id = auth.uid()) AND (lessons.deleted_at IS NULL))))) OR (((entity_type)::text = 'assignment'::text) AND (EXISTS ( SELECT 1
   FROM public.assignments
  WHERE ((assignments.id = drive_files.entity_id) AND (assignments.student_id = auth.uid()))))) OR (((entity_type)::text = 'song'::text) AND (EXISTS ( SELECT 1
   FROM (public.lesson_songs ls
     JOIN public.lessons l ON ((ls.lesson_id = l.id)))
  WHERE ((ls.song_id = drive_files.entity_id) AND (l.student_id = auth.uid()) AND (l.deleted_at IS NULL))))) OR (((entity_type)::text = 'profile'::text) AND (entity_id = auth.uid())))))));


--
-- Name: drive_files drive_files_update_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY drive_files_update_staff ON public.drive_files FOR UPDATE USING (((deleted_at IS NULL) AND public.is_admin_or_teacher()));


--
-- Name: hashtag_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hashtag_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: hashtag_sets hashtag_sets_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hashtag_sets_delete ON public.hashtag_sets FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: hashtag_sets hashtag_sets_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hashtag_sets_insert ON public.hashtag_sets FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


--
-- Name: hashtag_sets hashtag_sets_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hashtag_sets_select ON public.hashtag_sets FOR SELECT TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: hashtag_sets hashtag_sets_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hashtag_sets_update ON public.hashtag_sets FOR UPDATE TO authenticated USING (public.is_admin_or_teacher()) WITH CHECK (public.is_admin_or_teacher());


--
-- Name: in_app_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversations insert_own_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_own_conversations ON public.ai_conversations FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: ai_messages insert_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_own_messages ON public.ai_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: ai_prompt_templates insert_own_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_own_templates ON public.ai_prompt_templates FOR INSERT WITH CHECK (((created_by = auth.uid()) AND (is_system = false)));


--
-- Name: profiles insert_profile_admin_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_profile_admin_only ON public.profiles FOR INSERT WITH CHECK (public.is_admin());


--
-- Name: user_roles insert_user_roles_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_user_roles_admin ON public.user_roles FOR INSERT WITH CHECK (public.is_admin());


--
-- Name: lesson_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_history ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_songs lesson_songs_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_songs_delete_policy ON public.lesson_songs FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: lesson_songs lesson_songs_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_songs_insert_policy ON public.lesson_songs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: lesson_songs lesson_songs_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_songs_select_policy ON public.lesson_songs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lessons
  WHERE (lessons.id = lesson_songs.lesson_id))));


--
-- Name: lesson_songs lesson_songs_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_songs_update_policy ON public.lesson_songs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons lessons_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_delete_policy ON public.lessons FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: lessons lessons_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_insert_policy ON public.lessons FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: lessons lessons_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select_parent ON public.lessons FOR SELECT TO authenticated USING (public.is_child_of_parent(student_id));


--
-- Name: lessons lessons_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select_policy ON public.lessons FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))) OR (teacher_id = auth.uid()) OR (student_id = auth.uid())));


--
-- Name: lessons lessons_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_update_policy ON public.lessons FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: notification_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_log notification_log_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_log_select_admin ON public.notification_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: notification_log notification_log_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_log_select_own ON public.notification_log FOR SELECT USING ((recipient_user_id = auth.uid()));


--
-- Name: notification_log notification_log_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_log_service_all ON public.notification_log USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences notification_preferences_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_preferences_select_admin ON public.notification_preferences FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: notification_preferences notification_preferences_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_preferences_select_own ON public.notification_preferences FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: notification_preferences notification_preferences_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_preferences_update_own ON public.notification_preferences FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: notification_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_queue notification_queue_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_queue_select_admin ON public.notification_queue FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


--
-- Name: notification_queue notification_queue_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_queue_select_own ON public.notification_queue FOR SELECT USING ((recipient_user_id = auth.uid()));


--
-- Name: notification_queue notification_queue_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notification_queue_service_all ON public.notification_queue USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: practice_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: practice_sessions practice_sessions_delete_own_today; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY practice_sessions_delete_own_today ON public.practice_sessions FOR DELETE TO authenticated USING (((student_id = auth.uid()) AND ((created_at)::date = CURRENT_DATE)));


--
-- Name: practice_sessions practice_sessions_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY practice_sessions_select_parent ON public.practice_sessions FOR SELECT TO authenticated USING (public.is_child_of_parent(student_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_parent ON public.profiles FOR SELECT TO authenticated USING ((public.is_parent() AND (parent_id = auth.uid())));


--
-- Name: ai_conversations select_own_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_own_conversations ON public.ai_conversations FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ai_messages select_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_own_messages ON public.ai_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: profiles select_own_or_admin_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_own_or_admin_profile ON public.profiles FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));


--
-- Name: user_roles select_own_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_own_roles ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ai_usage_stats select_own_usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_own_usage ON public.ai_usage_stats FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ai_prompt_templates select_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_templates ON public.ai_prompt_templates FOR SELECT USING (((is_system = true) OR (created_by = auth.uid()) OR public.is_admin()));


--
-- Name: user_roles select_user_roles_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_user_roles_admin ON public.user_roles FOR SELECT USING (public.is_admin());


--
-- Name: song_of_the_week; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_of_the_week ENABLE ROW LEVEL SECURITY;

--
-- Name: song_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: song_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: song_sections song_sections_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_sections_delete_policy ON public.song_sections FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: song_sections song_sections_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_sections_insert_policy ON public.song_sections FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: song_sections song_sections_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_sections_select_parent ON public.song_sections FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.songs s
  WHERE ((s.id = song_sections.song_id) AND (s.deleted_at IS NULL) AND (EXISTS ( SELECT 1
           FROM (public.lesson_songs ls
             JOIN public.lessons l ON ((ls.lesson_id = l.id)))
          WHERE ((ls.song_id = s.id) AND public.is_child_of_parent(l.student_id) AND (l.deleted_at IS NULL))))))));


--
-- Name: song_sections song_sections_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_sections_select_policy ON public.song_sections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.songs s
  WHERE ((s.id = song_sections.song_id) AND (s.deleted_at IS NULL) AND ((EXISTS ( SELECT 1
           FROM public.profiles
          WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))) OR ((EXISTS ( SELECT 1
           FROM public.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.is_student = true)))) AND (EXISTS ( SELECT 1
           FROM (public.lesson_songs ls
             JOIN public.lessons l ON ((ls.lesson_id = l.id)))
          WHERE ((ls.song_id = s.id) AND (l.student_id = auth.uid()))))))))));


--
-- Name: song_sections song_sections_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_sections_update_policy ON public.song_sections FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: song_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: song_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: song_videos song_videos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_videos_delete ON public.song_videos FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: song_videos song_videos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_videos_insert ON public.song_videos FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


--
-- Name: song_videos song_videos_select_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_videos_select_staff ON public.song_videos FOR SELECT TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: song_videos song_videos_select_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_videos_select_student ON public.song_videos FOR SELECT TO authenticated USING ((public.is_student() AND ((EXISTS ( SELECT 1
   FROM public.student_repertoire sr
  WHERE ((sr.song_id = song_videos.song_id) AND (sr.student_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.lesson_songs ls
     JOIN public.lessons l ON ((l.id = ls.lesson_id)))
  WHERE ((ls.song_id = song_videos.song_id) AND (l.student_id = auth.uid()) AND (l.deleted_at IS NULL)))))));


--
-- Name: song_videos song_videos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY song_videos_update ON public.song_videos FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


--
-- Name: songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

--
-- Name: songs songs_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY songs_delete_policy ON public.songs FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: songs songs_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY songs_insert_policy ON public.songs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))));


--
-- Name: songs songs_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY songs_select_parent ON public.songs FOR SELECT TO authenticated USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM (public.lesson_songs ls
     JOIN public.lessons l ON ((ls.lesson_id = l.id)))
  WHERE ((ls.song_id = songs.id) AND public.is_child_of_parent(l.student_id) AND (l.deleted_at IS NULL))))));


--
-- Name: songs songs_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY songs_select_policy ON public.songs FOR SELECT USING (((deleted_at IS NULL) AND ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true))))) OR ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_student = true)))) AND (EXISTS ( SELECT 1
   FROM (public.lesson_songs ls
     JOIN public.lessons l ON ((ls.lesson_id = l.id)))
  WHERE ((ls.song_id = songs.id) AND (l.student_id = auth.uid()))))))));


--
-- Name: songs songs_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY songs_update_policy ON public.songs FOR UPDATE USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.is_admin = true) OR (profiles.is_teacher = true)))))));


--
-- Name: spotify_matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spotify_matches ENABLE ROW LEVEL SECURITY;

--
-- Name: student_repertoire sr_delete_admin_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_delete_admin_teacher ON public.student_repertoire FOR DELETE USING (public.is_admin_or_teacher());


--
-- Name: student_repertoire sr_insert_admin_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_insert_admin_teacher ON public.student_repertoire FOR INSERT WITH CHECK (public.is_admin_or_teacher());


--
-- Name: student_repertoire sr_select_admin_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_select_admin_teacher ON public.student_repertoire FOR SELECT USING (public.is_admin_or_teacher());


--
-- Name: student_repertoire sr_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_select_own ON public.student_repertoire FOR SELECT USING ((student_id = auth.uid()));


--
-- Name: student_repertoire sr_update_admin_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_update_admin_teacher ON public.student_repertoire FOR UPDATE USING (public.is_admin_or_teacher());


--
-- Name: student_repertoire sr_update_own_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sr_update_own_notes ON public.student_repertoire FOR UPDATE USING ((student_id = auth.uid())) WITH CHECK ((student_id = auth.uid()));


--
-- Name: student_repertoire; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_repertoire ENABLE ROW LEVEL SECURITY;

--
-- Name: student_song_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_song_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: student_song_progress student_song_progress_select_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_song_progress_select_parent ON public.student_song_progress FOR SELECT TO authenticated USING (public.is_child_of_parent(student_id));


--
-- Name: sync_conflicts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_conflicts sync_conflicts_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sync_conflicts_delete_own ON public.sync_conflicts FOR DELETE USING ((((status)::text = 'resolved'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons
  WHERE ((lessons.id = sync_conflicts.lesson_id) AND (lessons.teacher_id = auth.uid()))))));


--
-- Name: sync_conflicts sync_conflicts_insert_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sync_conflicts_insert_staff ON public.sync_conflicts FOR INSERT WITH CHECK (public.is_admin_or_teacher());


--
-- Name: sync_conflicts sync_conflicts_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sync_conflicts_select_own ON public.sync_conflicts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lessons
  WHERE ((lessons.id = sync_conflicts.lesson_id) AND (lessons.teacher_id = auth.uid())))));


--
-- Name: sync_conflicts sync_conflicts_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sync_conflicts_update_own ON public.sync_conflicts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.lessons
  WHERE ((lessons.id = sync_conflicts.lesson_id) AND (lessons.teacher_id = auth.uid())))));


--
-- Name: system_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: system_logs system_logs_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY system_logs_select_admin ON public.system_logs FOR SELECT USING (public.is_admin());


--
-- Name: theoretical_courses tc_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_delete ON public.theoretical_courses FOR DELETE USING (((created_by = auth.uid()) OR public.is_admin()));


--
-- Name: theoretical_courses tc_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_insert ON public.theoretical_courses FOR INSERT WITH CHECK (public.is_admin_or_teacher());


--
-- Name: theoretical_courses tc_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_select_admin ON public.theoretical_courses FOR SELECT USING (((deleted_at IS NULL) AND public.is_admin()));


--
-- Name: theoretical_courses tc_select_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_select_student ON public.theoretical_courses FOR SELECT USING (((deleted_at IS NULL) AND (is_published = true) AND public.is_student() AND (EXISTS ( SELECT 1
   FROM public.theoretical_course_access tca
  WHERE ((tca.course_id = theoretical_courses.id) AND (tca.user_id = auth.uid()))))));


--
-- Name: theoretical_courses tc_select_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_select_teacher ON public.theoretical_courses FOR SELECT USING (((deleted_at IS NULL) AND public.is_teacher()));


--
-- Name: theoretical_courses tc_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_update ON public.theoretical_courses FOR UPDATE USING (((created_by = auth.uid()) OR public.is_admin()));


--
-- Name: theoretical_course_access tca_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tca_delete ON public.theoretical_course_access FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.theoretical_courses tc
  WHERE ((tc.id = theoretical_course_access.course_id) AND ((tc.created_by = auth.uid()) OR public.is_admin())))));


--
-- Name: theoretical_course_access tca_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tca_insert ON public.theoretical_course_access FOR INSERT WITH CHECK (public.is_admin_or_teacher());


--
-- Name: theoretical_course_access tca_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tca_select_admin ON public.theoretical_course_access FOR SELECT USING (public.is_admin());


--
-- Name: theoretical_course_access tca_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tca_select_own ON public.theoretical_course_access FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: theoretical_course_access tca_select_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tca_select_teacher ON public.theoretical_course_access FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.theoretical_courses tc
  WHERE ((tc.id = theoretical_course_access.course_id) AND (tc.created_by = auth.uid())))));


--
-- Name: theoretical_course_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.theoretical_course_access ENABLE ROW LEVEL SECURITY;

--
-- Name: theoretical_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.theoretical_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: theoretical_lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.theoretical_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: theoretical_lessons tl_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_delete ON public.theoretical_lessons FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.theoretical_courses tc
  WHERE ((tc.id = theoretical_lessons.course_id) AND ((tc.created_by = auth.uid()) OR public.is_admin())))));


--
-- Name: theoretical_lessons tl_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_insert ON public.theoretical_lessons FOR INSERT WITH CHECK (public.is_admin_or_teacher());


--
-- Name: theoretical_lessons tl_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_select_admin ON public.theoretical_lessons FOR SELECT USING (((deleted_at IS NULL) AND public.is_admin()));


--
-- Name: theoretical_lessons tl_select_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_select_student ON public.theoretical_lessons FOR SELECT USING (((deleted_at IS NULL) AND (is_published = true) AND public.is_student() AND (EXISTS ( SELECT 1
   FROM public.theoretical_course_access tca
  WHERE ((tca.course_id = theoretical_lessons.course_id) AND (tca.user_id = auth.uid()))))));


--
-- Name: theoretical_lessons tl_select_teacher; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_select_teacher ON public.theoretical_lessons FOR SELECT USING (((deleted_at IS NULL) AND public.is_teacher()));


--
-- Name: theoretical_lessons tl_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tl_update ON public.theoretical_lessons FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.theoretical_courses tc
  WHERE ((tc.id = theoretical_lessons.course_id) AND ((tc.created_by = auth.uid()) OR public.is_admin())))));


--
-- Name: ai_conversations update_own_conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_own_conversations ON public.ai_conversations FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: ai_messages update_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_own_messages ON public.ai_messages FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


--
-- Name: profiles update_own_or_admin_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_own_or_admin_profile ON public.profiles FOR UPDATE USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));


--
-- Name: ai_usage_stats update_own_usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_own_usage ON public.ai_usage_stats FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: ai_prompt_templates update_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_templates ON public.ai_prompt_templates FOR UPDATE USING ((((created_by = auth.uid()) AND (is_system = false)) OR public.is_admin()));


--
-- Name: user_roles update_user_roles_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_user_roles_admin ON public.user_roles FOR UPDATE USING (public.is_admin());


--
-- Name: ai_usage_stats upsert_own_usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upsert_own_usage ON public.ai_usage_stats FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint) TO anon;
GRANT ALL ON FUNCTION public.check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint) TO authenticated;
GRANT ALL ON FUNCTION public.check_auth_rate_limit(p_identifier text, p_operation text, p_window_ms bigint) TO service_role;


--
-- Name: FUNCTION cleanup_auth_rate_limits(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.cleanup_auth_rate_limits() TO anon;
GRANT ALL ON FUNCTION public.cleanup_auth_rate_limits() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_auth_rate_limits() TO service_role;


--
-- Name: FUNCTION find_similar_songs(search_title text, threshold double precision, max_results integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.find_similar_songs(search_title text, threshold double precision, max_results integer) TO anon;
GRANT ALL ON FUNCTION public.find_similar_songs(search_title text, threshold double precision, max_results integer) TO authenticated;
GRANT ALL ON FUNCTION public.find_similar_songs(search_title text, threshold double precision, max_results integer) TO service_role;


--
-- Name: FUNCTION fn_record_progress_history(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fn_record_progress_history() TO anon;
GRANT ALL ON FUNCTION public.fn_record_progress_history() TO authenticated;
GRANT ALL ON FUNCTION public.fn_record_progress_history() TO service_role;


--
-- Name: FUNCTION fn_sync_lesson_song_to_repertoire(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fn_sync_lesson_song_to_repertoire() TO anon;
GRANT ALL ON FUNCTION public.fn_sync_lesson_song_to_repertoire() TO authenticated;
GRANT ALL ON FUNCTION public.fn_sync_lesson_song_to_repertoire() TO service_role;


--
-- Name: FUNCTION get_bounce_stats(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_bounce_stats() TO anon;
GRANT ALL ON FUNCTION public.get_bounce_stats() TO authenticated;
GRANT ALL ON FUNCTION public.get_bounce_stats() TO service_role;


--
-- Name: FUNCTION get_pending_notifications(batch_size integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_pending_notifications(batch_size integer) TO anon;
GRANT ALL ON FUNCTION public.get_pending_notifications(batch_size integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_pending_notifications(batch_size integer) TO service_role;


--
-- Name: FUNCTION get_system_email_count_last_hour(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_system_email_count_last_hour() TO anon;
GRANT ALL ON FUNCTION public.get_system_email_count_last_hour() TO authenticated;
GRANT ALL ON FUNCTION public.get_system_email_count_last_hour() TO service_role;


--
-- Name: FUNCTION get_user_email_count_last_hour(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_user_email_count_last_hour(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_email_count_last_hour(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_email_count_last_hour(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_active_lesson_assignments(song_uuid uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_active_lesson_assignments(song_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.has_active_lesson_assignments(song_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_active_lesson_assignments(song_uuid uuid) TO service_role;


--
-- Name: FUNCTION has_role(_role public.user_role); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_role(_role public.user_role) TO anon;
GRANT ALL ON FUNCTION public.has_role(_role public.user_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_role public.user_role) TO service_role;


--
-- Name: FUNCTION increment_sign_in_count(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.increment_sign_in_count(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_sign_in_count(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_sign_in_count(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION initialize_notification_preferences(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.initialize_notification_preferences() TO anon;
GRANT ALL ON FUNCTION public.initialize_notification_preferences() TO authenticated;
GRANT ALL ON FUNCTION public.initialize_notification_preferences() TO service_role;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--
-- Name: FUNCTION is_admin_or_teacher(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO service_role;


--
-- Name: FUNCTION is_child_of_parent(_student_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_child_of_parent(_student_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_child_of_parent(_student_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_child_of_parent(_student_id uuid) TO service_role;


--
-- Name: FUNCTION is_notification_enabled(p_user_id uuid, p_notification_type public.notification_type); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_notification_enabled(p_user_id uuid, p_notification_type public.notification_type) TO anon;
GRANT ALL ON FUNCTION public.is_notification_enabled(p_user_id uuid, p_notification_type public.notification_type) TO authenticated;
GRANT ALL ON FUNCTION public.is_notification_enabled(p_user_id uuid, p_notification_type public.notification_type) TO service_role;


--
-- Name: FUNCTION is_parent(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_parent() TO anon;
GRANT ALL ON FUNCTION public.is_parent() TO authenticated;
GRANT ALL ON FUNCTION public.is_parent() TO service_role;


--
-- Name: FUNCTION is_student(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_student() TO anon;
GRANT ALL ON FUNCTION public.is_student() TO authenticated;
GRANT ALL ON FUNCTION public.is_student() TO service_role;


--
-- Name: FUNCTION is_teacher(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_teacher() TO anon;
GRANT ALL ON FUNCTION public.is_teacher() TO authenticated;
GRANT ALL ON FUNCTION public.is_teacher() TO service_role;


--
-- Name: FUNCTION jsonb_diff(left_val jsonb, right_val jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.jsonb_diff(left_val jsonb, right_val jsonb) TO anon;
GRANT ALL ON FUNCTION public.jsonb_diff(left_val jsonb, right_val jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.jsonb_diff(left_val jsonb, right_val jsonb) TO service_role;


--
-- Name: FUNCTION refresh_song_engagement(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.refresh_song_engagement() TO anon;
GRANT ALL ON FUNCTION public.refresh_song_engagement() TO authenticated;
GRANT ALL ON FUNCTION public.refresh_song_engagement() TO service_role;


--
-- Name: FUNCTION reverse_song_progress_from_practice(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.reverse_song_progress_from_practice() TO anon;
GRANT ALL ON FUNCTION public.reverse_song_progress_from_practice() TO authenticated;
GRANT ALL ON FUNCTION public.reverse_song_progress_from_practice() TO service_role;


--
-- Name: FUNCTION set_lesson_numbers(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_lesson_numbers() TO anon;
GRANT ALL ON FUNCTION public.set_lesson_numbers() TO authenticated;
GRANT ALL ON FUNCTION public.set_lesson_numbers() TO service_role;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION soft_delete_song_with_cascade(song_uuid uuid, user_uuid uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.soft_delete_song_with_cascade(song_uuid uuid, user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.soft_delete_song_with_cascade(song_uuid uuid, user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.soft_delete_song_with_cascade(song_uuid uuid, user_uuid uuid) TO service_role;


--
-- Name: FUNCTION sync_full_name(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_full_name() TO anon;
GRANT ALL ON FUNCTION public.sync_full_name() TO authenticated;
GRANT ALL ON FUNCTION public.sync_full_name() TO service_role;


--
-- Name: FUNCTION sync_profile_roles(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_profile_roles() TO anon;
GRANT ALL ON FUNCTION public.sync_profile_roles() TO authenticated;
GRANT ALL ON FUNCTION public.sync_profile_roles() TO service_role;


--
-- Name: FUNCTION sync_song_video_published_flag(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_song_video_published_flag() TO anon;
GRANT ALL ON FUNCTION public.sync_song_video_published_flag() TO authenticated;
GRANT ALL ON FUNCTION public.sync_song_video_published_flag() TO service_role;


--
-- Name: FUNCTION title_case(input text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.title_case(input text) TO anon;
GRANT ALL ON FUNCTION public.title_case(input text) TO authenticated;
GRANT ALL ON FUNCTION public.title_case(input text) TO service_role;


--
-- Name: FUNCTION tr_audit_assignments(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_audit_assignments() TO anon;
GRANT ALL ON FUNCTION public.tr_audit_assignments() TO authenticated;
GRANT ALL ON FUNCTION public.tr_audit_assignments() TO service_role;


--
-- Name: FUNCTION tr_audit_lessons(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_audit_lessons() TO anon;
GRANT ALL ON FUNCTION public.tr_audit_lessons() TO authenticated;
GRANT ALL ON FUNCTION public.tr_audit_lessons() TO service_role;


--
-- Name: FUNCTION tr_audit_profiles(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_audit_profiles() TO anon;
GRANT ALL ON FUNCTION public.tr_audit_profiles() TO authenticated;
GRANT ALL ON FUNCTION public.tr_audit_profiles() TO service_role;


--
-- Name: FUNCTION tr_audit_song_progress(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_audit_song_progress() TO anon;
GRANT ALL ON FUNCTION public.tr_audit_song_progress() TO authenticated;
GRANT ALL ON FUNCTION public.tr_audit_song_progress() TO service_role;


--
-- Name: FUNCTION tr_notify_lesson_cancelled(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_notify_lesson_cancelled() TO anon;
GRANT ALL ON FUNCTION public.tr_notify_lesson_cancelled() TO authenticated;
GRANT ALL ON FUNCTION public.tr_notify_lesson_cancelled() TO service_role;


--
-- Name: FUNCTION tr_notify_lesson_completed(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_notify_lesson_completed() TO anon;
GRANT ALL ON FUNCTION public.tr_notify_lesson_completed() TO authenticated;
GRANT ALL ON FUNCTION public.tr_notify_lesson_completed() TO service_role;


--
-- Name: FUNCTION tr_notify_lesson_rescheduled(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_notify_lesson_rescheduled() TO anon;
GRANT ALL ON FUNCTION public.tr_notify_lesson_rescheduled() TO authenticated;
GRANT ALL ON FUNCTION public.tr_notify_lesson_rescheduled() TO service_role;


--
-- Name: FUNCTION tr_notify_song_mastery(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_notify_song_mastery() TO anon;
GRANT ALL ON FUNCTION public.tr_notify_song_mastery() TO authenticated;
GRANT ALL ON FUNCTION public.tr_notify_song_mastery() TO service_role;


--
-- Name: FUNCTION tr_notify_student_welcome(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tr_notify_student_welcome() TO anon;
GRANT ALL ON FUNCTION public.tr_notify_student_welcome() TO authenticated;
GRANT ALL ON FUNCTION public.tr_notify_student_welcome() TO service_role;


--
-- Name: FUNCTION track_assignment_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.track_assignment_changes() TO anon;
GRANT ALL ON FUNCTION public.track_assignment_changes() TO authenticated;
GRANT ALL ON FUNCTION public.track_assignment_changes() TO service_role;


--
-- Name: FUNCTION track_lesson_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.track_lesson_changes() TO anon;
GRANT ALL ON FUNCTION public.track_lesson_changes() TO authenticated;
GRANT ALL ON FUNCTION public.track_lesson_changes() TO service_role;


--
-- Name: FUNCTION track_song_status_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.track_song_status_changes() TO anon;
GRANT ALL ON FUNCTION public.track_song_status_changes() TO authenticated;
GRANT ALL ON FUNCTION public.track_song_status_changes() TO service_role;


--
-- Name: FUNCTION track_user_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.track_user_changes() TO anon;
GRANT ALL ON FUNCTION public.track_user_changes() TO authenticated;
GRANT ALL ON FUNCTION public.track_user_changes() TO service_role;


--
-- Name: FUNCTION update_notification_timestamp(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_notification_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_notification_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_notification_timestamp() TO service_role;


--
-- Name: FUNCTION update_song_requests_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_song_requests_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_song_requests_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_song_requests_updated_at() TO service_role;


--
-- Name: FUNCTION update_spotify_matches_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_spotify_matches_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_spotify_matches_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_spotify_matches_updated_at() TO service_role;


--
-- Name: FUNCTION update_sync_conflicts_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_sync_conflicts_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_sync_conflicts_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_sync_conflicts_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION update_user_settings_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_user_settings_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_user_settings_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_user_settings_updated_at() TO service_role;


--
-- Name: TABLE agent_execution_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.agent_execution_logs TO anon;
GRANT ALL ON TABLE public.agent_execution_logs TO authenticated;
GRANT ALL ON TABLE public.agent_execution_logs TO service_role;


--
-- Name: TABLE ai_conversations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_conversations TO anon;
GRANT ALL ON TABLE public.ai_conversations TO authenticated;
GRANT ALL ON TABLE public.ai_conversations TO service_role;


--
-- Name: TABLE ai_generations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_generations TO anon;
GRANT ALL ON TABLE public.ai_generations TO authenticated;
GRANT ALL ON TABLE public.ai_generations TO service_role;


--
-- Name: TABLE ai_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_messages TO anon;
GRANT ALL ON TABLE public.ai_messages TO authenticated;
GRANT ALL ON TABLE public.ai_messages TO service_role;


--
-- Name: TABLE ai_prompt_templates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_prompt_templates TO anon;
GRANT ALL ON TABLE public.ai_prompt_templates TO authenticated;
GRANT ALL ON TABLE public.ai_prompt_templates TO service_role;


--
-- Name: TABLE ai_usage_stats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_usage_stats TO anon;
GRANT ALL ON TABLE public.ai_usage_stats TO authenticated;
GRANT ALL ON TABLE public.ai_usage_stats TO service_role;


--
-- Name: TABLE api_keys; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.api_keys TO anon;
GRANT ALL ON TABLE public.api_keys TO authenticated;
GRANT ALL ON TABLE public.api_keys TO service_role;


--
-- Name: TABLE apple_shortcut_song_import_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.apple_shortcut_song_import_log TO anon;
GRANT ALL ON TABLE public.apple_shortcut_song_import_log TO authenticated;
GRANT ALL ON TABLE public.apple_shortcut_song_import_log TO service_role;


--
-- Name: TABLE assignment_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignment_history TO anon;
GRANT ALL ON TABLE public.assignment_history TO authenticated;
GRANT ALL ON TABLE public.assignment_history TO service_role;


--
-- Name: TABLE assignment_templates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignment_templates TO anon;
GRANT ALL ON TABLE public.assignment_templates TO authenticated;
GRANT ALL ON TABLE public.assignment_templates TO service_role;


--
-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.assignments TO anon;
GRANT ALL ON TABLE public.assignments TO authenticated;
GRANT ALL ON TABLE public.assignments TO service_role;


--
-- Name: TABLE audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log TO anon;
GRANT ALL ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;


--
-- Name: TABLE audit_log_2026_01; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_01 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_01 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_01 TO service_role;


--
-- Name: TABLE audit_log_2026_02; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_02 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_02 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_02 TO service_role;


--
-- Name: TABLE audit_log_2026_03; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_03 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_03 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_03 TO service_role;


--
-- Name: TABLE audit_log_2026_04; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_04 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_04 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_04 TO service_role;


--
-- Name: TABLE audit_log_2026_05; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_05 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_05 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_05 TO service_role;


--
-- Name: TABLE audit_log_2026_06; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_06 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_06 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_06 TO service_role;


--
-- Name: TABLE audit_log_2026_07; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_07 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_07 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_07 TO service_role;


--
-- Name: TABLE audit_log_2026_08; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_08 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_08 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_08 TO service_role;


--
-- Name: TABLE audit_log_2026_09; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_09 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_09 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_09 TO service_role;


--
-- Name: TABLE audit_log_2026_10; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_10 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_10 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_10 TO service_role;


--
-- Name: TABLE audit_log_2026_11; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_11 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_11 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_11 TO service_role;


--
-- Name: TABLE audit_log_2026_12; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_2026_12 TO anon;
GRANT ALL ON TABLE public.audit_log_2026_12 TO authenticated;
GRANT ALL ON TABLE public.audit_log_2026_12 TO service_role;


--
-- Name: TABLE audit_log_default; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log_default TO anon;
GRANT ALL ON TABLE public.audit_log_default TO authenticated;
GRANT ALL ON TABLE public.audit_log_default TO service_role;


--
-- Name: TABLE auth_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.auth_events TO anon;
GRANT ALL ON TABLE public.auth_events TO authenticated;
GRANT ALL ON TABLE public.auth_events TO service_role;


--
-- Name: TABLE auth_rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.auth_rate_limits TO anon;
GRANT ALL ON TABLE public.auth_rate_limits TO authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;


--
-- Name: TABLE chord_quiz_attempts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.chord_quiz_attempts TO anon;
GRANT ALL ON TABLE public.chord_quiz_attempts TO authenticated;
GRANT ALL ON TABLE public.chord_quiz_attempts TO service_role;


--
-- Name: TABLE chord_srs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.chord_srs TO anon;
GRANT ALL ON TABLE public.chord_srs TO authenticated;
GRANT ALL ON TABLE public.chord_srs TO service_role;


--
-- Name: TABLE content_post_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.content_post_metrics TO anon;
GRANT ALL ON TABLE public.content_post_metrics TO authenticated;
GRANT ALL ON TABLE public.content_post_metrics TO service_role;


--
-- Name: TABLE content_posts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.content_posts TO anon;
GRANT ALL ON TABLE public.content_posts TO authenticated;
GRANT ALL ON TABLE public.content_posts TO service_role;


--
-- Name: TABLE drive_files; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.drive_files TO anon;
GRANT ALL ON TABLE public.drive_files TO authenticated;
GRANT ALL ON TABLE public.drive_files TO service_role;


--
-- Name: TABLE hashtag_sets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hashtag_sets TO anon;
GRANT ALL ON TABLE public.hashtag_sets TO authenticated;
GRANT ALL ON TABLE public.hashtag_sets TO service_role;


--
-- Name: TABLE in_app_notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.in_app_notifications TO anon;
GRANT ALL ON TABLE public.in_app_notifications TO authenticated;
GRANT ALL ON TABLE public.in_app_notifications TO service_role;


--
-- Name: TABLE lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lessons TO anon;
GRANT ALL ON TABLE public.lessons TO authenticated;
GRANT ALL ON TABLE public.lessons TO service_role;


--
-- Name: TABLE lesson_counts_per_student; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_counts_per_student TO anon;
GRANT ALL ON TABLE public.lesson_counts_per_student TO authenticated;
GRANT ALL ON TABLE public.lesson_counts_per_student TO service_role;


--
-- Name: TABLE lesson_counts_per_teacher; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_counts_per_teacher TO anon;
GRANT ALL ON TABLE public.lesson_counts_per_teacher TO authenticated;
GRANT ALL ON TABLE public.lesson_counts_per_teacher TO service_role;


--
-- Name: TABLE lesson_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_history TO anon;
GRANT ALL ON TABLE public.lesson_history TO authenticated;
GRANT ALL ON TABLE public.lesson_history TO service_role;


--
-- Name: TABLE lesson_songs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lesson_songs TO anon;
GRANT ALL ON TABLE public.lesson_songs TO authenticated;
GRANT ALL ON TABLE public.lesson_songs TO service_role;


--
-- Name: TABLE songs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.songs TO anon;
GRANT ALL ON TABLE public.songs TO authenticated;
GRANT ALL ON TABLE public.songs TO service_role;


--
-- Name: TABLE student_repertoire; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_repertoire TO anon;
GRANT ALL ON TABLE public.student_repertoire TO authenticated;
GRANT ALL ON TABLE public.student_repertoire TO service_role;


--
-- Name: TABLE mv_song_engagement; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mv_song_engagement TO anon;
GRANT ALL ON TABLE public.mv_song_engagement TO authenticated;
GRANT ALL ON TABLE public.mv_song_engagement TO service_role;


--
-- Name: TABLE mv_song_popularity; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mv_song_popularity TO anon;
GRANT ALL ON TABLE public.mv_song_popularity TO authenticated;
GRANT ALL ON TABLE public.mv_song_popularity TO service_role;


--
-- Name: TABLE notification_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notification_log TO anon;
GRANT ALL ON TABLE public.notification_log TO authenticated;
GRANT ALL ON TABLE public.notification_log TO service_role;


--
-- Name: TABLE notification_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notification_preferences TO anon;
GRANT ALL ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;


--
-- Name: TABLE notification_queue; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notification_queue TO anon;
GRANT ALL ON TABLE public.notification_queue TO authenticated;
GRANT ALL ON TABLE public.notification_queue TO service_role;


--
-- Name: TABLE practice_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.practice_sessions TO anon;
GRANT ALL ON TABLE public.practice_sessions TO authenticated;
GRANT ALL ON TABLE public.practice_sessions TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE song_of_the_week; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_of_the_week TO anon;
GRANT ALL ON TABLE public.song_of_the_week TO authenticated;
GRANT ALL ON TABLE public.song_of_the_week TO service_role;


--
-- Name: TABLE song_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_requests TO anon;
GRANT ALL ON TABLE public.song_requests TO authenticated;
GRANT ALL ON TABLE public.song_requests TO service_role;


--
-- Name: TABLE song_sections; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_sections TO anon;
GRANT ALL ON TABLE public.song_sections TO authenticated;
GRANT ALL ON TABLE public.song_sections TO service_role;


--
-- Name: TABLE song_status_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_status_history TO anon;
GRANT ALL ON TABLE public.song_status_history TO authenticated;
GRANT ALL ON TABLE public.song_status_history TO service_role;


--
-- Name: TABLE song_usage_stats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_usage_stats TO anon;
GRANT ALL ON TABLE public.song_usage_stats TO authenticated;
GRANT ALL ON TABLE public.song_usage_stats TO service_role;


--
-- Name: TABLE song_videos; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.song_videos TO anon;
GRANT ALL ON TABLE public.song_videos TO authenticated;
GRANT ALL ON TABLE public.song_videos TO service_role;


--
-- Name: TABLE spotify_matches; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.spotify_matches TO anon;
GRANT ALL ON TABLE public.spotify_matches TO authenticated;
GRANT ALL ON TABLE public.spotify_matches TO service_role;


--
-- Name: TABLE student_song_progress; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.student_song_progress TO anon;
GRANT ALL ON TABLE public.student_song_progress TO authenticated;
GRANT ALL ON TABLE public.student_song_progress TO service_role;


--
-- Name: TABLE sync_conflicts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sync_conflicts TO anon;
GRANT ALL ON TABLE public.sync_conflicts TO authenticated;
GRANT ALL ON TABLE public.sync_conflicts TO service_role;


--
-- Name: TABLE system_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.system_logs TO anon;
GRANT ALL ON TABLE public.system_logs TO authenticated;
GRANT ALL ON TABLE public.system_logs TO service_role;


--
-- Name: TABLE teacher_students; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.teacher_students TO anon;
GRANT ALL ON TABLE public.teacher_students TO authenticated;
GRANT ALL ON TABLE public.teacher_students TO service_role;


--
-- Name: TABLE theoretical_course_access; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.theoretical_course_access TO anon;
GRANT ALL ON TABLE public.theoretical_course_access TO authenticated;
GRANT ALL ON TABLE public.theoretical_course_access TO service_role;


--
-- Name: TABLE theoretical_courses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.theoretical_courses TO anon;
GRANT ALL ON TABLE public.theoretical_courses TO authenticated;
GRANT ALL ON TABLE public.theoretical_courses TO service_role;


--
-- Name: TABLE theoretical_lessons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.theoretical_lessons TO anon;
GRANT ALL ON TABLE public.theoretical_lessons TO authenticated;
GRANT ALL ON TABLE public.theoretical_lessons TO service_role;


--
-- Name: TABLE user_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_history TO anon;
GRANT ALL ON TABLE public.user_history TO authenticated;
GRANT ALL ON TABLE public.user_history TO service_role;


--
-- Name: TABLE user_integrations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_integrations TO anon;
GRANT ALL ON TABLE public.user_integrations TO authenticated;
GRANT ALL ON TABLE public.user_integrations TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE user_overview; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_overview TO anon;
GRANT ALL ON TABLE public.user_overview TO authenticated;
GRANT ALL ON TABLE public.user_overview TO service_role;


--
-- Name: TABLE user_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_preferences TO anon;
GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.user_preferences TO service_role;


--
-- Name: TABLE user_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_settings TO anon;
GRANT ALL ON TABLE public.user_settings TO authenticated;
GRANT ALL ON TABLE public.user_settings TO service_role;


--
-- Name: TABLE v_teacher_lesson_trends; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_teacher_lesson_trends TO anon;
GRANT ALL ON TABLE public.v_teacher_lesson_trends TO authenticated;
GRANT ALL ON TABLE public.v_teacher_lesson_trends TO service_role;


--
-- Name: TABLE webhook_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.webhook_subscriptions TO anon;
GRANT ALL ON TABLE public.webhook_subscriptions TO authenticated;
GRANT ALL ON TABLE public.webhook_subscriptions TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict Jzp5N6FcQ6RJEbOStdkRsaYIaC3OPBIFtowIdIbReWIRxB82vkOwBhd8TAnuPdq


-- ============================================================================
-- Migration: Fix audit triggers — replace invalid jsonb - jsonb operator
-- ============================================================================
-- 2026-06-22
--
-- BUG: All four audit trigger functions use `to_jsonb(OLD) - to_jsonb(NEW)`,
-- but there is no `jsonb - jsonb` operator in PostgreSQL. The only valid `-`
-- overloads for jsonb are `jsonb - text` (remove one key) and
-- `jsonb - text[]` (remove multiple keys).
--
-- This caused inviteUserByEmail to fail with:
--   ERROR: operator does not exist: jsonb - jsonb
-- because the invite flow triggers handle_new_user → transfer_shadow_profile_references
-- → UPDATE lessons SET student_id = new_id → tr_audit_lessons fires → crash.
--
-- FIX: Replace the invalid expression with a correlated subquery that
-- returns only the key/value pairs that DIFFER between OLD and NEW.

-- ── Helper: jsonb_diff(left, right) ─────────────────────────────────────────
-- Returns all key/value pairs from `left` whose value differs from `right`.
-- Used to build the "old" and "new" sides of an audit change record.
CREATE OR REPLACE FUNCTION public.jsonb_diff(left_val jsonb, right_val jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    jsonb_object_agg(key, value),
    '{}'::jsonb
  )
  FROM jsonb_each(left_val)
  WHERE right_val -> key IS DISTINCT FROM value;
$$;

-- ── tr_audit_profiles ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tr_audit_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action audit_action;
    v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR
           (OLD.is_teacher IS DISTINCT FROM NEW.is_teacher) OR
           (OLD.is_student IS DISTINCT FROM NEW.is_student) THEN
            v_action := 'role_changed';
        ELSE
            v_action := 'updated';
        END IF;
        v_changes := jsonb_build_object(
            'old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))),
            'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD)))
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
        VALUES ('profile', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;

    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
    VALUES ('profile', NEW.id, auth.uid(), v_action, v_changes);

    RETURN NEW;
END;
$$;

-- ── tr_audit_lessons ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tr_audit_lessons()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action audit_action;
    v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'CANCELLED' THEN
                v_action := 'cancelled';
            ELSIF NEW.status = 'COMPLETED' THEN
                v_action := 'completed';
            ELSIF NEW.status = 'RESCHEDULED' THEN
                v_action := 'rescheduled';
            ELSE
                v_action := 'status_changed';
            END IF;
        ELSIF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
            v_action := 'rescheduled';
        ELSE
            v_action := 'updated';
        END IF;
        v_changes := jsonb_build_object(
            'old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))),
            'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD)))
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
        VALUES ('lesson', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;

    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
    VALUES ('lesson', NEW.id, auth.uid(), v_action, v_changes);

    RETURN NEW;
END;
$$;

-- ── tr_audit_assignments ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tr_audit_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action audit_action;
    v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_action := 'status_changed';
        ELSE
            v_action := 'updated';
        END IF;
        v_changes := jsonb_build_object(
            'old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))),
            'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD)))
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_changes := to_jsonb(OLD);
        INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
        VALUES ('assignment', OLD.id, auth.uid(), v_action, v_changes);
        RETURN OLD;
    END IF;

    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
    VALUES ('assignment', NEW.id, auth.uid(), v_action, v_changes);

    RETURN NEW;
END;
$$;

-- ── tr_audit_song_progress ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION tr_audit_song_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action audit_action;
    v_changes jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_changes := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_action := 'status_changed';
        ELSE
            v_action := 'updated';
        END IF;
        v_changes := jsonb_build_object(
            'old', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))),
            'new', jsonb_strip_nulls(public.jsonb_diff(to_jsonb(NEW), to_jsonb(OLD)))
        );
    END IF;

    INSERT INTO audit_log (entity_type, entity_id, actor_id, action, changes)
    VALUES ('song_progress', NEW.id, auth.uid(), v_action, v_changes);

    RETURN NEW;
END;
$$;

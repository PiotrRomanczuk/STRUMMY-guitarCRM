-- ============================================================================
-- Migration: Aggregate practice_sessions into student_repertoire
-- ============================================================================
-- The student_repertoire table is the SSOT for student song progress, but its
-- practice metrics (total_practice_minutes, practice_session_count,
-- last_practiced_at) were never updated when new practice sessions were saved.
--
-- This migration creates a trigger that fires AFTER INSERT on practice_sessions
-- and increments the matching student_repertoire row (if one exists).
--
-- Note: the old trigger (tr_practice_sessions_update_progress) updates the
-- legacy student_song_progress table. This new trigger targets student_repertoire.
-- ============================================================================

-- ============================================================================
-- FUNCTION: fn_aggregate_practice_to_repertoire
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_aggregate_practice_to_repertoire()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only aggregate when the session is linked to a specific song
    IF NEW.song_id IS NOT NULL THEN
        UPDATE student_repertoire
        SET
            total_practice_minutes = total_practice_minutes + NEW.duration_minutes,
            practice_session_count = practice_session_count + 1,
            last_practiced_at = GREATEST(COALESCE(last_practiced_at, NEW.created_at), NEW.created_at)
        WHERE student_id = NEW.student_id
          AND song_id = NEW.song_id;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_aggregate_practice_to_repertoire IS
    'AFTER INSERT trigger function: increments total_practice_minutes, '
    'practice_session_count, and last_practiced_at on the matching '
    'student_repertoire row when a practice session is recorded.';

-- ============================================================================
-- TRIGGER: tr_practice_sessions_aggregate
-- ============================================================================

CREATE TRIGGER tr_practice_sessions_aggregate
    AFTER INSERT ON practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION fn_aggregate_practice_to_repertoire();

COMMENT ON TRIGGER tr_practice_sessions_aggregate ON practice_sessions IS
    'Aggregates practice session metrics into student_repertoire (the SSOT table)';

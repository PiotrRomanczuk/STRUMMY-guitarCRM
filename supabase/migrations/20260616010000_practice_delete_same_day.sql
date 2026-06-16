-- Spec 05 (Repertoire & Practice) — same-day practice undo.
--
-- Adds:
--   1. RLS DELETE policy `practice_sessions_delete_own_today` — a student may
--      delete a session ONLY on the day it was logged (created_at::date =
--      current_date, server tz). Older sessions are immutable (D-08).
--   2. AFTER DELETE trigger that REVERSES the metric increment performed by the
--      AFTER INSERT trigger (`tr_practice_sessions_update_progress` →
--      update_song_progress_from_practice), so undoing a session does not leave
--      total_practice_minutes / practice_session_count / last_practiced_at drift.

-- ----------------------------------------------------------------------------
-- 1. Same-day DELETE policy
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS practice_sessions_delete_own_today ON practice_sessions;
CREATE POLICY practice_sessions_delete_own_today ON practice_sessions
    FOR DELETE TO authenticated
    USING (student_id = auth.uid() AND created_at::date = current_date);

-- ----------------------------------------------------------------------------
-- 2. Metric reversal on delete (mirror of update_song_progress_from_practice)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reverse_song_progress_from_practice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.song_id IS NOT NULL THEN
        UPDATE student_song_progress
        SET
            total_practice_minutes = GREATEST(total_practice_minutes - OLD.duration_minutes, 0),
            practice_session_count = GREATEST(practice_session_count - 1, 0),
            -- Recompute last_practiced_at from the remaining sessions (the
            -- deleted row is already gone), NULL if none remain.
            last_practiced_at = (
                SELECT MAX(ps.created_at)
                FROM practice_sessions ps
                WHERE ps.student_id = OLD.student_id
                  AND ps.song_id = OLD.song_id
            )
        WHERE student_id = OLD.student_id
          AND song_id = OLD.song_id;
    END IF;
    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION reverse_song_progress_from_practice IS
    'Reverses practice metrics when a session is undone (same-day delete).';

DROP TRIGGER IF EXISTS tr_practice_sessions_reverse_progress ON practice_sessions;
CREATE TRIGGER tr_practice_sessions_reverse_progress
    AFTER DELETE ON practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION reverse_song_progress_from_practice();

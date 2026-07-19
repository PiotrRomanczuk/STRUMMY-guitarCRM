-- ============================================================================
-- Migration: Fix practice_sessions → student_repertoire metric triggers
-- ============================================================================
-- Blueprint gap PRA-1 (docs/app-blueprint/04-practice-progress.md) — hard launch
-- gate 9 (docs/app-blueprint/92-launch-runbook.md).
--
-- Two bugs in the production baseline (supabase/baseline/cloud_schema_2026-06-22.sql):
--
-- 1. The AFTER INSERT aggregation trigger (fn_aggregate_practice_to_repertoire /
--    tr_practice_sessions_aggregate, introduced in 20260322000000) is entirely
--    absent from the baseline. Logging a practice session never updates
--    student_repertoire.total_practice_minutes / practice_session_count /
--    last_practiced_at.
--
-- 2. The AFTER DELETE trigger (tr_practice_sessions_reverse_progress /
--    reverse_song_progress_from_practice) survived, but still targets the
--    deprecated student_song_progress table using a column name
--    (total_practice_minutes) that only exists on student_repertoire —
--    student_song_progress calls it total_practice_time_minutes. Undoing any
--    song-linked practice session therefore raises 42703 and the delete fails.
--    Existing E2E only passes because its test sessions use song_id = NULL,
--    which skips the trigger body entirely.
--
-- This migration (a) recreates the INSERT aggregation trigger against
-- student_repertoire, (b) repoints the DELETE reversal trigger at
-- student_repertoire with correct column names, and (c) backfills the three
-- aggregate columns from the practice_sessions history that accrued while the
-- INSERT trigger was missing.
-- ============================================================================

-- ============================================================================
-- FUNCTION: fn_aggregate_practice_to_repertoire (AFTER INSERT)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_aggregate_practice_to_repertoire()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only aggregate when the session is linked to a specific song
    IF NEW.song_id IS NOT NULL THEN
        UPDATE public.student_repertoire
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

COMMENT ON FUNCTION public.fn_aggregate_practice_to_repertoire() IS
    'AFTER INSERT trigger function: increments total_practice_minutes, '
    'practice_session_count, and last_practiced_at on the matching '
    'student_repertoire row when a practice session is recorded. '
    'Restored 2026-07-18 (PRA-1) — absent from the 2026-06-22 baseline.';

DROP TRIGGER IF EXISTS tr_practice_sessions_aggregate ON public.practice_sessions;

CREATE TRIGGER tr_practice_sessions_aggregate
    AFTER INSERT ON public.practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_aggregate_practice_to_repertoire();

COMMENT ON TRIGGER tr_practice_sessions_aggregate ON public.practice_sessions IS
    'Aggregates practice session metrics into student_repertoire (the SSOT table).';

-- ============================================================================
-- FUNCTION: reverse_song_progress_from_practice (AFTER DELETE)
-- ============================================================================
-- Repoint at student_repertoire with its actual column name
-- (total_practice_minutes, not student_song_progress's
-- total_practice_time_minutes), and recompute last_practiced_at from the
-- remaining rows for that student+song rather than trusting a running max.

CREATE OR REPLACE FUNCTION public.reverse_song_progress_from_practice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.song_id IS NOT NULL THEN
        UPDATE public.student_repertoire SET
            total_practice_minutes = GREATEST(total_practice_minutes - OLD.duration_minutes, 0),
            practice_session_count = GREATEST(practice_session_count - 1, 0),
            last_practiced_at = (
                SELECT MAX(ps.created_at) FROM public.practice_sessions ps
                WHERE ps.student_id = OLD.student_id AND ps.song_id = OLD.song_id
            )
        WHERE student_id = OLD.student_id AND song_id = OLD.song_id;
    END IF;
    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.reverse_song_progress_from_practice() IS
    'AFTER DELETE trigger function: reverses practice metrics on student_repertoire '
    'when a same-day session is undone. Repointed 2026-07-18 (PRA-1) — the baseline '
    'version targeted the deprecated student_song_progress table with a column name '
    '(total_practice_minutes) that does not exist there, raising 42703 on any '
    'song-linked undo.';

-- tr_practice_sessions_reverse_progress already exists in the baseline and
-- points at this function by name — CREATE OR REPLACE above rewires it in
-- place, no DROP/CREATE TRIGGER needed.

-- ============================================================================
-- BACKFILL: recompute student_repertoire aggregates from practice_sessions
-- ============================================================================
-- The INSERT trigger has been missing since the baseline was captured (at
-- least), so existing aggregate columns have drifted from the true session
-- history. Recompute all three from source rather than trusting partial data.

WITH agg AS (
    SELECT
        student_id,
        song_id,
        SUM(duration_minutes) AS total_minutes,
        COUNT(*) AS session_count,
        MAX(created_at) AS last_practiced
    FROM public.practice_sessions
    WHERE song_id IS NOT NULL
    GROUP BY student_id, song_id
)
UPDATE public.student_repertoire sr
SET
    total_practice_minutes = agg.total_minutes,
    practice_session_count = agg.session_count,
    last_practiced_at = agg.last_practiced
FROM agg
WHERE sr.student_id = agg.student_id
  AND sr.song_id = agg.song_id;

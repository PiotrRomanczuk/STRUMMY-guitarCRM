-- ============================================================================
-- Migration: Deprecate student_song_progress (superseded by student_repertoire)
-- ============================================================================
-- student_repertoire is the single source of truth since migration 20260222000000.
-- This migration:
--   1. Drops triggers that write to the old table
--   2. Adds a deprecation comment
--   3. Does NOT drop the table yet (data preservation, can drop in future migration)

-- Drop the old trigger that wrote to student_song_progress from practice_sessions
DROP TRIGGER IF EXISTS tr_practice_sessions_update_progress ON practice_sessions;

-- Comment the table as deprecated
COMMENT ON TABLE student_song_progress IS 'DEPRECATED: Use student_repertoire instead. Data was migrated in 20260222000000. Will be dropped in a future migration.';

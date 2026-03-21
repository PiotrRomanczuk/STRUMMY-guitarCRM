-- ============================================================================
-- Migration: Fix drive_files.uploaded_by FK conflict
-- The column is NOT NULL but ON DELETE SET NULL would violate that constraint
-- when a user is deleted. Change to nullable so SET NULL works correctly.
-- ============================================================================

ALTER TABLE drive_files ALTER COLUMN uploaded_by DROP NOT NULL;

-- Same issue on song_of_the_week.selected_by: NOT NULL + ON DELETE SET NULL
ALTER TABLE song_of_the_week ALTER COLUMN selected_by DROP NOT NULL;

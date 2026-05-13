-- This migration was originally authored 2026-03-22 but only landed in production on 2026-05-13
-- (registered remotely as version 20260513133730 via mcp__supabase__apply_migration).
-- It is kept here with IF NOT EXISTS guards so re-runs against any environment are safe.

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS song_id UUID REFERENCES songs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_assignments_song
  ON assignments(song_id)
  WHERE song_id IS NOT NULL;

COMMENT ON COLUMN assignments.song_id IS 'Optional link to the song this assignment is about';

-- ============================================================================
-- Migration: Songs Recording Queue
-- Adds a per-song "to record" flag so admins can build a recording shortlist
-- directly from the song library. NULL = not queued; timestamp = order added.
-- Admin/teacher-only via existing songs RLS (no new policy needed).
-- ============================================================================

ALTER TABLE songs
  ADD COLUMN recording_queued_at TIMESTAMPTZ;

COMMENT ON COLUMN songs.recording_queued_at IS
  'When this song was added to the recording queue. NULL = not queued.';

CREATE INDEX idx_songs_recording_queued_at
  ON songs(recording_queued_at)
  WHERE recording_queued_at IS NOT NULL;

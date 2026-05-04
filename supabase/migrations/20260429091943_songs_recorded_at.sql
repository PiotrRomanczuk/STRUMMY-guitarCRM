-- ============================================================================
-- Migration: Songs Recorded Timestamp
-- Adds a second flag so a song can be marked as "recorded already" after it
-- leaves the queue. NULL = not yet recorded; timestamp = when marked recorded.
-- Combined with recording_queued_at this gives three states per song:
--   idle (both NULL) -> queued (queued_at set) -> recorded (recorded_at set).
-- ============================================================================

ALTER TABLE songs
  ADD COLUMN recorded_at TIMESTAMPTZ;

COMMENT ON COLUMN songs.recorded_at IS
  'When this song was marked as recorded. NULL = not recorded yet.';

CREATE INDEX idx_songs_recorded_at
  ON songs(recorded_at)
  WHERE recorded_at IS NOT NULL;

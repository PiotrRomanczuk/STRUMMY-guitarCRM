-- Add BPM tracking to practice sessions for tempo progression analysis.
ALTER TABLE practice_sessions
  ADD COLUMN bpm_practiced SMALLINT
    CHECK (bpm_practiced IS NULL OR (bpm_practiced >= 20 AND bpm_practiced <= 300));

COMMENT ON COLUMN practice_sessions.bpm_practiced IS 'BPM practiced at (NULL = no specific tempo); enables tempo ladder tracking';

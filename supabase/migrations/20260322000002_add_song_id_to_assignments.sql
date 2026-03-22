ALTER TABLE assignments ADD COLUMN song_id UUID REFERENCES songs(id) ON DELETE SET NULL;
CREATE INDEX ix_assignments_song ON assignments(song_id) WHERE song_id IS NOT NULL;
COMMENT ON COLUMN assignments.song_id IS 'Optional link to the song this assignment is about';

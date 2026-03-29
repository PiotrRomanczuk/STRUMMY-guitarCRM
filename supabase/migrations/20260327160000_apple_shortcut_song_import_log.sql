-- Log every Apple Shortcut song import attempt (success and failure)
CREATE TABLE IF NOT EXISTS apple_shortcut_song_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  spotify_url TEXT,
  spotify_track_id TEXT,
  song_title TEXT,
  song_artist TEXT,
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'duplicate', 'error')),
  error_message TEXT,
  http_status INTEGER,
  source TEXT NOT NULL DEFAULT 'shortcut' CHECK (source IN ('shortcut', 'api', 'debug-page')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by user and time
CREATE INDEX idx_shortcut_log_user_created ON apple_shortcut_song_import_log(user_id, created_at DESC);
CREATE INDEX idx_shortcut_log_status ON apple_shortcut_song_import_log(status);

-- RLS: admins and teachers can read all logs, users can read their own
ALTER TABLE apple_shortcut_song_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own import logs"
  ON apple_shortcut_song_import_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import logs"
  ON apple_shortcut_song_import_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS for API key auth inserts

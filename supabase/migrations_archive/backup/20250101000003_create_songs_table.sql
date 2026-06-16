-- Create songs table
-- Step 3: Songs table (no foreign keys, no RLS policies)
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  level public.difficulty_level NOT NULL,
  key public.music_key NOT NULL,
  chords TEXT,
  audio_files TEXT [],
  ultimate_guitar_link TEXT NOT NULL,
  short_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Basic index on title for searches (no other indexes yet)
CREATE INDEX idx_songs_title ON public.songs (title);
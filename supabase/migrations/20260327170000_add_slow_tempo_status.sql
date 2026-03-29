-- Add 'slow_tempo' to lesson_song_status enum
-- Represents: student can play along with the original at 75-80% tempo
ALTER TYPE lesson_song_status ADD VALUE IF NOT EXISTS 'slow_tempo' BEFORE 'with_author';

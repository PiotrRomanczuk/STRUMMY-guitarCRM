-- Migration: Add category column to song_of_the_week
-- Supports separate "teacher" and "student" songs of the week

-- Add category column (default 'student' so existing rows keep working)
ALTER TABLE song_of_the_week
  ADD COLUMN category TEXT NOT NULL DEFAULT 'student';

-- Drop old unique index (only allowed one active SOTW globally)
DROP INDEX IF EXISTS uq_sotw_active;

-- Create new unique index: one active SOTW per category
CREATE UNIQUE INDEX uq_sotw_active_per_category
  ON song_of_the_week (category, is_active)
  WHERE is_active = true;

-- Add check constraint to restrict valid categories
ALTER TABLE song_of_the_week
  ADD CONSTRAINT chk_sotw_category CHECK (category IN ('student', 'teacher'));

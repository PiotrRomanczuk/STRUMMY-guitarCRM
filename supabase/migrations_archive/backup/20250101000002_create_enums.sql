-- Create all enums (no tables yet)
-- Step 2: Enums only
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.music_key AS ENUM (
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bbm',
  'Bm'
);
CREATE TYPE public.lesson_status AS ENUM (
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED'
);
CREATE TYPE public.learning_status AS ENUM (
  'to_learn',
  'started',
  'remembered',
  'with_author',
  'mastered'
);
CREATE TYPE public.task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE public.task_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'COMPLETED',
  'CANCELLED',
  'BLOCKED'
);
-- Create user_role ENUM type
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');
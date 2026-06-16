-- Migration: Create lessons table with foreign keys to profiles
-- Step 7: Lessons table with student_id, teacher_id, creator_user_id FKs
CREATE TABLE IF NOT EXISTS public.lessons (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Foreign keys to profiles
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  -- Lesson details
  title TEXT,
  notes TEXT,
  date DATE NOT NULL,
  start_time TIME,
  status public.lesson_status NOT NULL DEFAULT 'SCHEDULED',
  -- Auto-incrementing lesson number per teacher-student pair
  lesson_number INTEGER,
  lesson_teacher_number INTEGER,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Create indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON public.lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON public.lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_creator_user_id ON public.lessons(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
-- Composite index for teacher-student queries
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_student ON public.lessons(teacher_id, student_id, date DESC);
-- ✅ Lessons table created with foreign keys and indexes
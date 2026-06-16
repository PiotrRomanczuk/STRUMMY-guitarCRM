-- Migration: Create lesson_songs junction table
-- Step 9: Junction table linking lessons and songs with learning status
CREATE TABLE IF NOT EXISTS public.lesson_songs (
  -- Composite primary key
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  -- Learning progress status
  song_status public.learning_status NOT NULL DEFAULT 'to_learn',
  -- Optional FK references (legacy fields, may be NULL)
  teacher_id UUID REFERENCES public.profiles(user_id) ON DELETE
  SET
    NULL,
    student_id UUID REFERENCES public.profiles(user_id) ON DELETE
  SET
    NULL,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    -- Primary key constraint
    PRIMARY KEY (lesson_id, song_id)
);
-- Create indexes for foreign keys and queries
CREATE INDEX IF NOT EXISTS idx_lesson_songs_lesson_id ON public.lesson_songs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_songs_song_id ON public.lesson_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_lesson_songs_status ON public.lesson_songs(song_status);
CREATE INDEX IF NOT EXISTS idx_lesson_songs_teacher_id ON public.lesson_songs(teacher_id)
WHERE
  teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_songs_student_id ON public.lesson_songs(student_id)
WHERE
  student_id IS NOT NULL;
-- ✅ Lesson_songs junction table created with foreign keys and indexes
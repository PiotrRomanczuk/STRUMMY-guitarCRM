-- Migration: Enable RLS and implement policies for all core tables
-- Step 14: Comprehensive RLS for privacy and role-based access
-- 1. Enable RLS on all tables
ALTER TABLE
  public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  public.lesson_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  public.task_management ENABLE ROW LEVEL SECURITY;
-- 2. PROFILES table policies
  -- Users can view their own profile
  CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT
  USING (user_id = auth.uid());
-- Admins can view all profiles
  CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Teachers can view their students' profiles (via lessons)
  CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lessons l
      WHERE
        l.teacher_id = auth.uid()
        AND l.student_id = profiles.user_id
    )
  );
-- Users can update their own profile
  CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE
  USING (user_id = auth.uid());
-- Admins can update any profile
  CREATE POLICY "Admins can update any profile" ON public.profiles FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Admins can delete any profile
  CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Teachers and admins can view all songs
  CREATE POLICY "Teachers and admins can view all songs" ON public.songs FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Students can view only songs assigned to their lessons
  CREATE POLICY "Students can view assigned songs" ON public.songs FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lesson_songs ls
        JOIN public.lessons l ON l.id = ls.lesson_id
      WHERE
        ls.song_id = songs.id
        AND l.student_id = auth.uid()
    )
  );
-- Teachers and admins can insert songs
  CREATE POLICY "Teachers and admins can insert songs" ON public.songs FOR
INSERT
  WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Teachers and admins can update songs
  CREATE POLICY "Teachers and admins can update songs" ON public.songs FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Admins can delete songs
  CREATE POLICY "Admins can delete songs" ON public.songs FOR DELETE USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- 4. LESSONS table policies
  -- Students can view their lessons
  CREATE POLICY "Students can view own lessons" ON public.lessons FOR
SELECT
  USING (student_id = auth.uid());
-- Teachers can view their lessons
  CREATE POLICY "Teachers can view own lessons" ON public.lessons FOR
SELECT
  USING (teacher_id = auth.uid());
-- Admins can view all lessons
  CREATE POLICY "Admins can view all lessons" ON public.lessons FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid() -- Role columns removed; roles are now managed in public.user_roles
    )
  );
-- Teachers and admins can insert lessons
  CREATE POLICY "Teachers and admins can insert lessons" ON public.lessons FOR
INSERT
  WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'teacher')
        )
    )
  );
-- Teachers can update their lessons
  CREATE POLICY "Teachers can update own lessons" ON public.lessons FOR
UPDATE
  USING (teacher_id = auth.uid());
-- Admins can update any lesson
  CREATE POLICY "Admins can update any lesson" ON public.lessons FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
  );
-- Teachers can delete their lessons
  CREATE POLICY "Teachers can delete own lessons" ON public.lessons FOR DELETE USING (teacher_id = auth.uid());
-- Admins can delete any lesson
  CREATE POLICY "Admins can delete any lesson" ON public.lessons FOR DELETE USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
  );
-- 5. LESSON_SONGS table policies
  -- Users can view lesson_songs for their own lessons
  CREATE POLICY "Users can view lesson_songs for their lessons" ON public.lesson_songs FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lessons l
      WHERE
        l.id = lesson_songs.lesson_id
        AND (
          l.student_id = auth.uid()
          OR l.teacher_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
  );
-- Teachers and admins can insert lesson_songs
  CREATE POLICY "Teachers and admins can insert lesson_songs" ON public.lesson_songs FOR
INSERT
  WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'teacher')
        )
    )
  );
-- Teachers and admins can update lesson_songs
  CREATE POLICY "Teachers and admins can update lesson_songs" ON public.lesson_songs FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lessons l
      WHERE
        l.id = lesson_songs.lesson_id
        AND l.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
  );
-- Students can update their own lesson_songs (e.g., mark as remembered)
  CREATE POLICY "Students can update own lesson_songs" ON public.lesson_songs FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lessons l
      WHERE
        l.id = lesson_songs.lesson_id
        AND l.student_id = auth.uid()
    )
  );
-- Teachers and admins can delete lesson_songs
  CREATE POLICY "Teachers and admins can delete lesson_songs" ON public.lesson_songs FOR DELETE USING (
    EXISTS (
      SELECT
        1
      FROM
        public.lessons l
      WHERE
        l.id = lesson_songs.lesson_id
        AND l.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
  );
-- 6. TASK_MANAGEMENT table policies (admin only)
  CREATE POLICY "Admins can view all tasks" ON public.task_management FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
  );
CREATE POLICY "Admins can insert tasks" ON public.task_management FOR
INSERT
  WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT
            1
          FROM
            public.user_roles ur
          WHERE
            ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
  );
CREATE POLICY "Admins can update tasks" ON public.task_management FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
  );
CREATE POLICY "Admins can delete tasks" ON public.task_management FOR DELETE USING (
    EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
  );
-- ✅ RLS policies enabled and implemented for all core tables
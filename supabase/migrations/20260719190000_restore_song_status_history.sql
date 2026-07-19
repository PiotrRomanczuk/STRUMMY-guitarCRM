-- Restore the missing song_status_history table.
--
-- fn_record_progress_history() (migration 20260513120000) writes to this table
-- from an AFTER UPDATE trigger on student_repertoire. On stacks where the table
-- was never created, that trigger aborts the whole transaction — which silently
-- breaks the core loop: attaching a song to a lesson cascades into
-- student_repertoire, and any status change on an existing repertoire row
-- raises `relation "song_status_history" does not exist`. Observed live on
-- StudentManager 2026-07-19, where lesson_songs had 0 rows against 57 lessons.
--
-- DDL mirrors supabase/baseline/cloud_schema_2026-06-22.sql exactly.
-- Idempotent so it can be applied to any drifted stack (StrummyProd included).

CREATE TABLE IF NOT EXISTS public.song_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    song_id uuid NOT NULL,
    previous_status text,
    new_status text NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.song_status_history IS 'Audit log tracking all song learning status changes per student';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'song_status_history_pkey') THEN
    ALTER TABLE ONLY public.song_status_history
      ADD CONSTRAINT song_status_history_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'song_status_history_song_id_fkey') THEN
    ALTER TABLE ONLY public.song_status_history
      ADD CONSTRAINT song_status_history_song_id_fkey
      FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'song_status_history_student_id_fkey') THEN
    ALTER TABLE ONLY public.song_status_history
      ADD CONSTRAINT song_status_history_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'song_status_history_student_id_profiles_fkey') THEN
    ALTER TABLE ONLY public.song_status_history
      ADD CONSTRAINT song_status_history_student_id_profiles_fkey
      FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_song_status_history_changed_at
  ON public.song_status_history USING btree (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_song_status_history_song_id
  ON public.song_status_history USING btree (song_id);
CREATE INDEX IF NOT EXISTS idx_song_status_history_student_id
  ON public.song_status_history USING btree (student_id);

ALTER TABLE public.song_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their own song status changes" ON public.song_status_history;
CREATE POLICY "Students can insert their own song status changes"
  ON public.song_status_history FOR INSERT
  WITH CHECK ((auth.uid() = student_id));

DROP POLICY IF EXISTS "Students can view their own song status history" ON public.song_status_history;
CREATE POLICY "Students can view their own song status history"
  ON public.song_status_history FOR SELECT
  USING ((auth.uid() = student_id));

DROP POLICY IF EXISTS "Teachers and admins can view all song status history" ON public.song_status_history;
CREATE POLICY "Teachers and admins can view all song status history"
  ON public.song_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.is_teacher = true OR profiles.is_admin = true)
  ));

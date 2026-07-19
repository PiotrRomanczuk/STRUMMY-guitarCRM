-- Restore profiles.student_status and profiles.status_changed_at.
--
-- users-list-queries.ts selects `student_status` for every people-list request,
-- and the user PUT schema writes it. On stacks missing the column PostgREST
-- fails the whole SELECT, so the Students page renders "No people match these
-- filters" for teachers *and* admins — the roster looks empty even though the
-- rows exist. Observed live on StudentManager 2026-07-19.
--
-- DDL mirrors supabase/baseline/cloud_schema_2026-06-22.sql. Idempotent so it
-- can be applied to any drifted stack (StrummyProd included).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
    CREATE TYPE public.student_status AS ENUM ('active', 'archived');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_status public.student_status
    DEFAULT 'archived'::public.student_status NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status_changed_at timestamp with time zone DEFAULT now();

COMMENT ON COLUMN public.profiles.student_status IS
  'Student engagement status: active (taking lessons) or archived (not currently engaged)';
COMMENT ON COLUMN public.profiles.status_changed_at IS
  'Timestamp when the student_status was last updated';

CREATE INDEX IF NOT EXISTS idx_profiles_student_status
  ON public.profiles USING btree (student_status);

-- Anyone with a lesson on the books is by definition engaged; the column
-- default ('archived') would otherwise mark every existing student inactive.
UPDATE public.profiles p
SET student_status = 'active', status_changed_at = now()
WHERE p.is_student = true
  AND p.student_status = 'archived'
  AND EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.student_id = p.id AND l.deleted_at IS NULL
  );

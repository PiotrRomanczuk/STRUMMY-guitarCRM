-- Student intake fields on public.profiles.
--
-- Backs the full "Add student" editorial intake form (Identity / Contact /
-- Schedule / Billing) — see components/users/editorial/CreateStudentForm.*.
-- Everything here is teacher-captured metadata on the student profile; the
-- existing shadow/invite flow (email placeholder + invite_email) is unchanged.
--
-- Idempotent (`add column if not exists`, `drop constraint if exists` before
-- re-adding) so it is safe to replay on any drifted stack. No RLS change:
-- these columns inherit the existing profiles policies (admin/teacher write,
-- owner read) from 20260718090100_profiles.sql.
--
-- NOTE: the "Goals / notes" textarea reuses the pre-existing profiles.notes
-- column — no new `goals` column is added.
--
-- BILLING (lesson_rate + billing_cycle) is a NEW product surface for Strummy;
-- flagged for product review. Stored on the profile, teacher-only.

-- ---------------------------------------------------------------------------
-- I · Identity
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skill_level  text,
  ADD COLUMN IF NOT EXISTS instrument   text,
  ADD COLUMN IF NOT EXISTS start_date   date,
  ADD COLUMN IF NOT EXISTS avatar_color text;

-- ---------------------------------------------------------------------------
-- II · Contact (student email/phone already covered by email/invite_email/phone)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_name  text,
  ADD COLUMN IF NOT EXISTS parent_email text;

-- ---------------------------------------------------------------------------
-- III · Schedule (recurring lesson slot)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lesson_day              text,
  ADD COLUMN IF NOT EXISTS lesson_time             text,
  ADD COLUMN IF NOT EXISTS lesson_duration_minutes integer;

-- ---------------------------------------------------------------------------
-- IV · Billing (NEW product area — see header note)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lesson_rate   numeric(10, 2),
  ADD COLUMN IF NOT EXISTS billing_cycle text;

-- ---------------------------------------------------------------------------
-- Value constraints (drop-then-add keeps them idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_skill_level_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_skill_level_check
  CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_billing_cycle_check
  CHECK (billing_cycle IS NULL OR billing_cycle IN ('per_lesson', 'weekly', 'monthly'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_lesson_duration_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_lesson_duration_check
  CHECK (lesson_duration_minutes IS NULL OR lesson_duration_minutes > 0);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_lesson_rate_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_lesson_rate_check
  CHECK (lesson_rate IS NULL OR lesson_rate >= 0);

-- ---------------------------------------------------------------------------
-- Column documentation
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN public.profiles.skill_level  IS 'Student skill level: beginner | intermediate | advanced';
COMMENT ON COLUMN public.profiles.instrument   IS 'Primary instrument the student is learning (e.g. Guitar)';
COMMENT ON COLUMN public.profiles.start_date   IS 'Date the student began lessons';
COMMENT ON COLUMN public.profiles.avatar_color IS 'Hex colour for the student avatar chip (e.g. #c89523)';
COMMENT ON COLUMN public.profiles.parent_name  IS 'Free-text parent/guardian name (for students under 18)';
COMMENT ON COLUMN public.profiles.parent_email IS 'Free-text parent/guardian email';
COMMENT ON COLUMN public.profiles.lesson_day   IS 'Recurring lesson day of week (e.g. Thu)';
COMMENT ON COLUMN public.profiles.lesson_time  IS 'Recurring lesson time, teacher-entered (e.g. 4:00 PM)';
COMMENT ON COLUMN public.profiles.lesson_duration_minutes IS 'Recurring lesson length in minutes (e.g. 45)';
COMMENT ON COLUMN public.profiles.lesson_rate  IS 'BILLING (product review): rate charged per lesson';
COMMENT ON COLUMN public.profiles.billing_cycle IS 'BILLING (product review): per_lesson | weekly | monthly';

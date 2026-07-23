-- Lesson duration + format (in-person / video). Two Lesson-Form gaps from the
-- design mockup: a Duration select (30/45/60 min) and a Format toggle.
--
-- Both columns are NULLABLE with no backfill — existing lessons keep NULL and the
-- editorial form supplies sensible defaults (45 min / in_person) on the next save.
-- No RLS changes: the columns inherit the existing `public.lessons` table policies.

alter table public.lessons
  add column if not exists duration_minutes integer;

alter table public.lessons
  add column if not exists format text;

-- Restrict `format` to the two supported values. Guarded so the migration stays
-- idempotent (safe to re-apply): drop any prior constraint before recreating it.
alter table public.lessons
  drop constraint if exists lessons_format_check;

alter table public.lessons
  add constraint lessons_format_check
  check (format is null or format in ('in_person', 'video'));

-- Guard rail on the picker range as well (mirrors the Zod schema: 15–180).
alter table public.lessons
  drop constraint if exists lessons_duration_minutes_check;

alter table public.lessons
  add constraint lessons_duration_minutes_check
  check (duration_minutes is null or (duration_minutes >= 15 and duration_minutes <= 180));

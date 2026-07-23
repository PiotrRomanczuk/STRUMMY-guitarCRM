-- Migration: assignment daily practice target + submission-type selector
-- ============================================================================
-- Blueprint: assignment form gaps from the design-mockup audit
-- (docs/app-blueprint/93-design-mockup-audit.md; docs/app-blueprint/06-assignments.md).
--
-- Two teacher-authored columns on assignments, mirroring the checklist/chord_drill
-- model — both set through the existing column-unrestricted
-- assignments_update_teacher policy (ADR-0001):
--   daily_target_minutes  -- optional "practise N min/day" goal (5/10/15/20 in the UI)
--   submission_type       -- how the student is expected to prove the work
--
-- This is the submission-type *selector* only: it declares the expected proof
-- (self-report / audio / video / note). Actual audio/video upload is a later wave.
-- ============================================================================

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS daily_target_minutes integer;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS submission_type text NOT NULL DEFAULT 'self_report';

-- A daily target, when present, is a positive minute count.
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_daily_target_minutes_positive;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_daily_target_minutes_positive
  CHECK (daily_target_minutes IS NULL OR daily_target_minutes > 0);

-- submission_type is one of the four supported proof modes.
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_submission_type_check;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_submission_type_check
  CHECK (submission_type IN ('self_report', 'audio', 'video', 'note'));

COMMENT ON COLUMN public.assignments.daily_target_minutes IS
  'Optional daily practice target in minutes (5/10/15/20 in the UI); NULL = no target.';
COMMENT ON COLUMN public.assignments.submission_type IS
  'Expected proof mode: self_report | audio | video | note. Selector only — '
  'actual media upload is a later wave.';

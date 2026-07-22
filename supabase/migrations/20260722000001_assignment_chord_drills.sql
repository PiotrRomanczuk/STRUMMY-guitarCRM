-- Migration: assignable chord drills (ASG-4) + student result RPC
-- ============================================================================
-- Blueprint gap ASG-4 (docs/app-blueprint/06-assignments.md); the chord-quiz
-- surfacing bundle (CHT-1/CHT-2, docs/app-blueprint/05-chords-theory.md).
--
-- A teacher can attach a chord drill to an assignment: a set of chord IDs
-- (keys into the static CHORD_VOICINGS library — not a DB FK, matching how
-- chord_quiz_attempts.chord_id works). The student runs those chords through
-- the existing chord quiz; the captured score flows back onto the assignment
-- so the teacher sees how they did, closing the teacher-driven loop.
--
-- Two nullable jsonb columns, mirroring the `checklist` model:
--   chord_drill        {chord_ids: text[]}          -- teacher-authored config
--   chord_drill_result {score, total, completed_at}  -- student-captured result
--
-- Student writes follow the ASG-3 doctrine (ADR-0001: the DB is the security
-- boundary, not app code). Students have no direct UPDATE policy on assignments;
-- their ONLY path to record a drill result is the SECURITY DEFINER RPC below,
-- which by construction writes only the result + status on their own row and
-- builds the result server-side from a validated (score, total) pair — a
-- student cannot inject arbitrary result fields or stamp another's assignment.
-- Teachers author `chord_drill` through the existing column-unrestricted
-- assignments_update_teacher policy.
-- ============================================================================

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS chord_drill jsonb;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS chord_drill_result jsonb;

-- A drill config, when present, is {chord_ids: [1..30 non-empty strings]}.
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_chord_drill_shape;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_chord_drill_shape
  CHECK (
    chord_drill IS NULL
    OR (
      jsonb_typeof(chord_drill) = 'object'
      AND jsonb_typeof(chord_drill -> 'chord_ids') = 'array'
      AND jsonb_array_length(chord_drill -> 'chord_ids') BETWEEN 1 AND 30
    )
  );

-- The result is server-written by the RPC below; keep the check loose (object).
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_chord_drill_result_shape;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_chord_drill_result_shape
  CHECK (
    chord_drill_result IS NULL OR jsonb_typeof(chord_drill_result) = 'object'
  );

CREATE OR REPLACE FUNCTION public.student_complete_chord_drill(
  p_assignment_id uuid,
  p_score integer,
  p_total integer
)
RETURNS public.assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment public.assignments;
BEGIN
  SELECT * INTO v_assignment
  FROM public.assignments
  WHERE id = p_assignment_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_assignment.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to update this assignment' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_assignment.chord_drill IS NULL THEN
    RAISE EXCEPTION 'Assignment has no chord drill' USING ERRCODE = 'check_violation';
  END IF;

  -- A cancelled assignment is terminal; a drill run cannot revive it.
  IF v_assignment.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot complete a cancelled assignment' USING ERRCODE = 'check_violation';
  END IF;

  IF p_total <= 0 OR p_score < 0 OR p_score > p_total THEN
    RAISE EXCEPTION 'Invalid drill score % of %', p_score, p_total USING ERRCODE = 'check_violation';
  END IF;

  -- Running the drill IS the work, so it completes the assignment directly
  -- (a drill is atomic — no separate "start" step). The result is built
  -- server-side from the validated pair so the payload can carry nothing else.
  UPDATE public.assignments
  SET chord_drill_result = jsonb_build_object(
        'score', p_score,
        'total', p_total,
        'completed_at', now()
      ),
      status = 'completed',
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN v_assignment;
END;
$$;

COMMENT ON FUNCTION public.student_complete_chord_drill(uuid, integer, integer) IS
  'ASG-4: the only path a student has to record a chord-drill result. '
  'SECURITY DEFINER validates ownership + that the assignment is a drill, then '
  'writes only chord_drill_result (built from a validated score/total) and '
  'sets status=completed — RLS boundary per ADR-0001, mirroring '
  'student_update_assignment_status and student_toggle_checklist_item.';

GRANT EXECUTE ON FUNCTION public.student_complete_chord_drill(uuid, integer, integer)
  TO authenticated;

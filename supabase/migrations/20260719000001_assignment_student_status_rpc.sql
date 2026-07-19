-- Migration: column-scope the student assignment-status write
-- ============================================================================
-- Blueprint gap ASG-3 (docs/app-blueprint/06-assignments.md).
--
-- assignments_student_status_update permitted UPDATE on ANY column of the
-- student's own row (WITH CHECK only compared student_id = auth.uid()) — app
-- code only ever sent {status}, but a student with a session token and curl
-- could rewrite title/due_date/description directly via PostgREST. RLS is
-- supposed to be the boundary (ADR-0001), not app-code discipline.
--
-- Fix: a SECURITY DEFINER RPC is the student's ONLY write path for
-- assignments. It validates ownership + the same transition state machine as
-- schemas/AssignmentSchema.ts's VALID_STATUS_TRANSITIONS (student targets:
-- in_progress, completed only) entirely in SQL, then writes just `status`.
-- The broad student UPDATE policy is dropped — a direct PostgREST UPDATE from
-- a student is now rejected by RLS with no matching policy.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.student_update_assignment_status(
  p_assignment_id uuid,
  p_new_status public.assignment_status
)
RETURNS public.assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment public.assignments;
  v_allowed boolean;
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

  -- Students may only ever target these two states (mirrors STUDENT_TARGETS
  -- in app/actions/assignment-status.ts).
  IF p_new_status NOT IN ('in_progress', 'completed') THEN
    RAISE EXCEPTION 'Students can only start or complete an assignment' USING ERRCODE = 'check_violation';
  END IF;

  -- No-op transition is always allowed (mirrors validateStatusTransition).
  IF v_assignment.status = p_new_status THEN
    RETURN v_assignment;
  END IF;

  -- Mirrors VALID_STATUS_TRANSITIONS in schemas/AssignmentSchema.ts.
  v_allowed := CASE v_assignment.status
    WHEN 'not_started' THEN p_new_status IN ('in_progress', 'cancelled')
    WHEN 'in_progress' THEN p_new_status IN ('completed', 'cancelled')
    WHEN 'overdue' THEN p_new_status IN ('in_progress', 'completed', 'cancelled')
    ELSE false -- completed / cancelled are terminal
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_assignment.status, p_new_status
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.assignments
  SET status = p_new_status, updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN v_assignment;
END;
$$;

COMMENT ON FUNCTION public.student_update_assignment_status(uuid, public.assignment_status) IS
  'ASG-3: the only path a student has to mutate assignments. SECURITY DEFINER '
  'validates ownership + the status transition state machine in SQL, then '
  'writes only the status column — RLS no longer trusts app code to scope '
  'which columns a student-submitted UPDATE touches.';

GRANT EXECUTE ON FUNCTION public.student_update_assignment_status(uuid, public.assignment_status)
  TO authenticated;

DROP POLICY IF EXISTS assignments_student_status_update ON public.assignments;

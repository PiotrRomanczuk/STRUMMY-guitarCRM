-- Migration: assignment checklist (sub-tasks) + student toggle RPC
-- ============================================================================
-- Blueprint: deeper homework model (docs/app-blueprint/06-assignments.md).
--
-- Adds a `checklist` jsonb column to assignments: an array of
-- {id, text, done} items the teacher authors and the student ticks off, giving
-- a percent-complete progress signal on top of the coarse status.
--
-- Student writes follow the ASG-3 doctrine (ADR-0001: the DB is the security
-- boundary, not app code). Students have no direct UPDATE policy; their ONLY
-- checklist write path is the SECURITY DEFINER RPC below, which by construction
-- can flip exactly one existing item's `done` flag — it cannot add, remove,
-- reorder, or edit item text. Teachers/admins author checklists through the
-- existing column-unrestricted assignments_update_teacher policy.
-- ============================================================================

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_checklist_is_array;
ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_checklist_is_array
  CHECK (jsonb_typeof(checklist) = 'array' AND jsonb_array_length(checklist) <= 20);

CREATE OR REPLACE FUNCTION public.student_toggle_checklist_item(
  p_assignment_id uuid,
  p_item_id text,
  p_done boolean
)
RETURNS public.assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment public.assignments;
  v_found boolean;
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

  -- The item must already exist; students cannot add items.
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_assignment.checklist) e
    WHERE e->>'id' = p_item_id
  ) INTO v_found;

  IF NOT v_found THEN
    RAISE EXCEPTION 'Checklist item not found' USING ERRCODE = 'no_data_found';
  END IF;

  -- Rebuild the array flipping ONLY the matching item's `done` flag. Text,
  -- ordering, and membership are preserved verbatim, so a student can never
  -- rewrite content through this path.
  UPDATE public.assignments
  SET checklist = (
        SELECT jsonb_agg(
          CASE WHEN e->>'id' = p_item_id
            THEN jsonb_set(e, '{done}', to_jsonb(p_done))
            ELSE e
          END
          ORDER BY ord
        )
        FROM jsonb_array_elements(checklist) WITH ORDINALITY AS t(e, ord)
      ),
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN v_assignment;
END;
$$;

COMMENT ON FUNCTION public.student_toggle_checklist_item(uuid, text, boolean) IS
  'The only path a student has to mutate a checklist: flips one existing '
  'item''s done flag by id. Cannot add/remove/reorder items or edit text — '
  'RLS boundary per ADR-0001, mirroring student_update_assignment_status.';

GRANT EXECUTE ON FUNCTION public.student_toggle_checklist_item(uuid, text, boolean)
  TO authenticated;

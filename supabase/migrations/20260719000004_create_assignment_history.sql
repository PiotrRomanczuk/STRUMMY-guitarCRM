-- Migration: create assignment_history + auto-populating trigger
-- ============================================================================
-- Blueprint gap ASG-2 (docs/app-blueprint/06-assignments.md).
--
-- assignment_history is documented in the baseline schema dump
-- (supabase/baseline/cloud_schema_2026-06-22.sql) but was never captured as
-- an incremental migration — it does not exist on this stack. The baseline's
-- own RLS policies reference a `user_roles` table lookup, which is
-- inconsistent with this codebase's actual role convention everywhere else
-- (profiles.is_admin/is_teacher/is_student booleans — see
-- assignments_update_policy for the pattern this mirrors). Written fresh
-- against that convention instead of copied verbatim, per this item's own
-- instruction to "verify" the RLS shape before rendering to students.
--
-- Nothing currently writes to this table (the live assignments audit
-- trigger, tr_assignments_audit, targets the separate `audit_log` table).
-- Adds a dedicated AFTER UPDATE trigger that logs only status transitions —
-- the one thing the roadmap's UI ("create → start → complete produces a
-- 3-entry timeline") actually needs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  changed_by uuid,
  change_type text NOT NULL,
  previous_data jsonb,
  new_data jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id
  ON public.assignment_history (assignment_id, changed_at DESC);

COMMENT ON TABLE public.assignment_history IS
  'Status-change timeline for assignments (ASG-2). Populated only by
   tr_assignment_history_status; not a general-purpose audit log.';

ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

-- SELECT mirrors the parent assignment's visibility: the owning teacher, the
-- owning student, or an admin. No policy exists for INSERT/UPDATE/DELETE —
-- the trigger below is SECURITY DEFINER and bypasses RLS, which is the only
-- write path this table has.
CREATE POLICY assignment_history_select_own ON public.assignment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_history.assignment_id
        AND (a.teacher_id = auth.uid() OR a.student_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION public.tr_assignment_history_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.assignment_history (assignment_id, changed_by, change_type, new_data)
    VALUES (NEW.id, auth.uid(), 'created', jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.assignment_history (
      assignment_id, changed_by, change_type, previous_data, new_data
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.tr_assignment_history_status() IS
  'Logs assignment creation and status transitions to assignment_history (ASG-2).';

DROP TRIGGER IF EXISTS tr_assignment_history_status ON public.assignments;
CREATE TRIGGER tr_assignment_history_status
  AFTER INSERT OR UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_assignment_history_status();

GRANT SELECT ON public.assignment_history TO authenticated, service_role;

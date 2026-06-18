-- Sync Conflicts Table
-- Stores conflicts between Strummy and Google Calendar for manual resolution.
--
-- History: originally created by the legacy numbered migration 024_table_sync_conflicts.sql
-- and tightened by 028_fix_sync_conflicts_rls.sql (BMS-17). Both were lost when the
-- 20260105100001 drop_all rebuild superseded the numbered era without recreating this table
-- (024 collided with 024_storage.sql, so only storage was recorded). This consolidated
-- migration merges 024 + 028 and recreates the table on the current schema baseline.

CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  google_event_id VARCHAR(255) NOT NULL,
  conflict_data JSONB NOT NULL, -- Remote event data (title, time, notes, etc.)
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, resolved, ignored
  resolution VARCHAR(50), -- use_local, use_remote
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_sync_conflicts_status CHECK (status IN ('pending', 'resolved', 'ignored')),
  CONSTRAINT check_sync_conflicts_resolution CHECK (resolution IS NULL OR resolution IN ('use_local', 'use_remote'))
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_lesson_id ON public.sync_conflicts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON public.sync_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_created_at ON public.sync_conflicts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status_created
  ON public.sync_conflicts(status, created_at DESC)
  WHERE status = 'pending';

-- updated_at maintenance trigger (search_path pinned to avoid mutable-search_path advisory)
CREATE OR REPLACE FUNCTION public.update_sync_conflicts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_sync_conflicts_updated_at ON public.sync_conflicts;
CREATE TRIGGER trigger_update_sync_conflicts_updated_at
  BEFORE UPDATE ON public.sync_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sync_conflicts_updated_at();

-- RLS
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Teachers can view conflicts for their own lessons
DROP POLICY IF EXISTS sync_conflicts_select_own ON public.sync_conflicts;
CREATE POLICY sync_conflicts_select_own ON public.sync_conflicts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = sync_conflicts.lesson_id
        AND lessons.teacher_id = auth.uid()
    )
  );

-- Teachers can update conflicts for their own lessons
DROP POLICY IF EXISTS sync_conflicts_update_own ON public.sync_conflicts;
CREATE POLICY sync_conflicts_update_own ON public.sync_conflicts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = sync_conflicts.lesson_id
        AND lessons.teacher_id = auth.uid()
    )
  );

-- INSERT restricted to admin/teacher roles (BMS-17 fix; replaces the legacy WITH CHECK (true))
DROP POLICY IF EXISTS sync_conflicts_insert_system ON public.sync_conflicts;
DROP POLICY IF EXISTS sync_conflicts_insert_staff ON public.sync_conflicts;
CREATE POLICY sync_conflicts_insert_staff ON public.sync_conflicts
  FOR INSERT
  WITH CHECK (public.is_admin_or_teacher());

-- Teachers can delete their own resolved conflicts
DROP POLICY IF EXISTS sync_conflicts_delete_own ON public.sync_conflicts;
CREATE POLICY sync_conflicts_delete_own ON public.sync_conflicts
  FOR DELETE
  USING (
    status = 'resolved' AND
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = sync_conflicts.lesson_id
        AND lessons.teacher_id = auth.uid()
    )
  );

COMMENT ON TABLE public.sync_conflicts IS 'Tracks conflicts between Strummy and Google Calendar for manual resolution';
COMMENT ON COLUMN public.sync_conflicts.lesson_id IS 'Reference to the conflicted lesson';
COMMENT ON COLUMN public.sync_conflicts.google_event_id IS 'Google Calendar event ID';
COMMENT ON COLUMN public.sync_conflicts.conflict_data IS 'JSON containing remote event data (title, time, notes, etc.)';
COMMENT ON COLUMN public.sync_conflicts.status IS 'Conflict status: pending, resolved, or ignored';
COMMENT ON COLUMN public.sync_conflicts.resolution IS 'How the conflict was resolved: use_local or use_remote';
COMMENT ON COLUMN public.sync_conflicts.resolved_at IS 'Timestamp when conflict was resolved';

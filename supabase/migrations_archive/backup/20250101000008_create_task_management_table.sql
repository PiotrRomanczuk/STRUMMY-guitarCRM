-- Migration: Create task_management table
-- Step 11: Task management for admins
CREATE TABLE IF NOT EXISTS public.task_management (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Foreign keys
  assigned_to UUID REFERENCES public.profiles(user_id) ON DELETE
  SET
    NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    priority public.task_priority NOT NULL DEFAULT 'MEDIUM',
    status public.task_status NOT NULL DEFAULT 'OPEN',
    due_date DATE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_management_assigned_to ON public.task_management(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_management_created_by ON public.task_management(created_by);
CREATE INDEX IF NOT EXISTS idx_task_management_status ON public.task_management(status);
CREATE INDEX IF NOT EXISTS idx_task_management_priority ON public.task_management(priority);
CREATE INDEX IF NOT EXISTS idx_task_management_due_date ON public.task_management(due_date)
WHERE
  due_date IS NOT NULL;
-- ✅ Task_management table created
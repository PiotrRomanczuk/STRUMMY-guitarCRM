-- Migration: (re)create assignment_templates + template checklist
-- ============================================================================
-- Blueprint: faster assigning — template library UI
-- (docs/app-blueprint/06-assignments.md, ASG-1 "keep schema").
--
-- The table exists in supabase/baseline/cloud_schema_2026-06-22.sql and is used
-- by app/actions/assignment-templates.ts (tested) + AssignmentTemplateSchema,
-- but there is no CREATE TABLE for it in the current /supabase/migrations set —
-- a fresh DB would lack it. This recreates it using THIS stack's RLS helpers
-- (is_admin / is_teacher / current_profile_id / set_updated_at), matching the
-- assignments table's convention rather than the baseline's user_roles version.
--
-- A `checklist` column is added so "start from template" can prefill a checklist
-- (synergy with the assignment checklist, migration 20260720000001).
-- ============================================================================

create table if not exists public.assignment_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  checklist   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Idempotent for DBs where the table pre-exists without the checklist column
-- (the table lived in the baseline but not in this migration set).
alter table public.assignment_templates
  add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.assignment_templates
  drop constraint if exists assignment_templates_checklist_is_array;
alter table public.assignment_templates
  add constraint assignment_templates_checklist_is_array
  check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 20);

create index if not exists idx_assignment_templates_teacher_id
  on public.assignment_templates (teacher_id);

drop trigger if exists trg_assignment_templates_set_updated_at on public.assignment_templates;
create trigger trg_assignment_templates_set_updated_at
  before update on public.assignment_templates
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.assignment_templates to authenticated;
grant all on public.assignment_templates to service_role;

alter table public.assignment_templates enable row level security;

drop policy if exists assignment_templates_select on public.assignment_templates;
create policy assignment_templates_select on public.assignment_templates
  for select to authenticated
  using (public.is_admin() or teacher_id = public.current_profile_id());

drop policy if exists assignment_templates_insert on public.assignment_templates;
create policy assignment_templates_insert on public.assignment_templates
  for insert to authenticated
  with check (public.is_admin()
              or (public.is_teacher() and teacher_id = public.current_profile_id()));

drop policy if exists assignment_templates_update on public.assignment_templates;
create policy assignment_templates_update on public.assignment_templates
  for update to authenticated
  using (public.is_admin() or teacher_id = public.current_profile_id())
  with check (public.is_admin() or teacher_id = public.current_profile_id());

drop policy if exists assignment_templates_delete on public.assignment_templates;
create policy assignment_templates_delete on public.assignment_templates
  for delete to authenticated
  using (public.is_admin() or teacher_id = public.current_profile_id());

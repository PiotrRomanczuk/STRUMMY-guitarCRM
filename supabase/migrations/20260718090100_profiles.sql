-- Profiles + signup trigger + role helpers + RLS.
--
-- Part of the from-scratch rebuild tracked in docs/DATABASE_REBUILD.md (Step 1).
--
-- Identity model: independent primary key + nullable user_id FK to auth.users.
--   - id      : the app-facing profile id (foreign-keyed by lessons/assignments/...).
--   - user_id : the auth linkage; null == shadow student (no auth account yet).
-- RLS joins on user_id = (select auth.uid()). This keeps shadow students and
-- parent profiles addable later with zero RLS rewrites.

-- ---------------------------------------------------------------------------
-- profiles (minimal core — shadow/parent columns arrive in a later phase)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique references auth.users (id) on delete cascade,
  email          citext unique,
  full_name      text,
  first_name     text,
  last_name      text,
  avatar_url     text,
  notes          text,
  phone          text,
  is_admin       boolean not null default false,
  is_teacher     boolean not null default false,
  is_student     boolean not null default false,
  is_active      boolean not null default true,
  is_development boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers (defined here: they read public.profiles, which now exists).
-- SECURITY DEFINER STABLE, single source of truth = profiles flags. No user_roles.
-- (select auth.uid()) keeps the auth call InitPlan-cached inside RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.is_admin);
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.is_teacher);
$$;

create or replace function public.is_student()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.is_student);
$$;

create or replace function public.is_admin_or_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and (p.is_admin or p.is_teacher));
$$;

-- ---------------------------------------------------------------------------
-- Signup trigger: one clean handle_new_user (replaces the ~9 competing rewrites).
-- Creates a profile for every new auth user, pulling names from user metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text := nullif(new.raw_user_meta_data ->> 'first_name', '');
  v_last  text := nullif(new.raw_user_meta_data ->> 'last_name', '');
  v_full  text := nullif(new.raw_user_meta_data ->> 'full_name', '');
begin
  insert into public.profiles (user_id, email, first_name, last_name, full_name)
  values (
    new.id,
    new.email,
    v_first,
    v_last,
    coalesce(v_full, nullif(trim(concat_ws(' ', v_first, v_last)), ''))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trigger_handle_new_user on auth.users;
create trigger trigger_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants — table-level access; RLS below narrows which rows. Explicit and
-- self-contained (not relying on platform default privileges).
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

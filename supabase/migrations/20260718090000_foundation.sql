-- Foundation: extensions, closed-set enums, and the single updated_at trigger fn.
--
-- Part of the from-scratch rebuild tracked in docs/DATABASE_REBUILD.md (Step 0).
-- Conventions: idempotent, search_path pinned on every SECURITY DEFINER fn,
-- enums only for closed sets.
--
-- NOTE: the role-helper family (is_admin/is_teacher/...) lives in the profiles
-- migration (Step 1), not here — the helpers read public.profiles, and Postgres
-- validates SQL function bodies at creation, so the table must exist first.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists citext;      -- case-insensitive email
create extension if not exists pgcrypto;    -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (closed, stable sets only)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lesson_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- Matches the 5 values the app actually uses; the old schema's unused 'pending' is dropped.
do $$ begin
  create type public.assignment_status as enum ('not_started', 'in_progress', 'completed', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

-- Unified progress enum. Includes 'slow_tempo' from day one so the app-side
-- (SongStatusEnum) and DB never drift, and so the future repertoire sync trigger
-- has no value to cross-cast around (the old fn_sync_lesson_song_to_repertoire bug).
do $$ begin
  create type public.lesson_song_status as enum (
    'to_learn', 'started', 'remembered', 'slow_tempo', 'with_author', 'mastered'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Single updated_at trigger function (reused by every table)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

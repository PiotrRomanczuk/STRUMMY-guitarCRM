-- Minimal Supabase-compatible shim for validating rebuild migrations in a throwaway
-- scratch DB (see scripts/db/validate-migrations.sh). Recreates just enough of the
-- platform surface the public schema depends on: the auth schema, auth.users,
-- auth.uid(), and the app roles.
--
-- Deliberately does NOT set up platform default privileges — so any table migration
-- that forgets its explicit GRANTs fails the gate rather than silently passing.
--
-- Roles are cluster-global (real Supabase already created them), so guard creates.

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Mirror real Supabase: auth.uid() reads the request JWT 'sub' claim GUC.
-- Tests set it with: select set_config('request.jwt.claim.sub', '<uuid>', false);
create or replace function auth.uid()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

\set ON_ERROR_STOP on
\pset pager off

-- ============================ Wave 0 gate tests ============================
\echo '== Step 0: enums, updated_at fn =='
select 'enums' as check,
  (select count(*) from pg_type where typname in
    ('difficulty_level','lesson_status','assignment_status','lesson_song_status')
    and typnamespace = 'public'::regnamespace) as got, 4 as want;

select 'lesson_song_status has slow_tempo' as check,
  'slow_tempo' = any(enum_range(null::public.lesson_song_status)::text[]) as pass;

select 'assignment_status excludes pending' as check,
  not ('pending' = any(enum_range(null::public.assignment_status)::text[])) as pass;

select 'set_updated_at fn exists' as check,
  exists(select 1 from pg_proc where proname='set_updated_at' and pronamespace='public'::regnamespace) as pass;

\echo '== Step 1: helpers, table, trigger =='
select 'role helpers exist (4)' as check,
  (select count(*) from pg_proc where proname in
    ('is_admin','is_teacher','is_student','is_admin_or_teacher')
    and pronamespace='public'::regnamespace) as got, 4 as want;

select 'profiles table exists' as check,
  to_regclass('public.profiles') is not null as pass;

select 'profiles RLS enabled' as check,
  (select relrowsecurity from pg_class where oid='public.profiles'::regclass) as pass;

select 'handle_new_user trigger on auth.users' as check,
  exists(select 1 from pg_trigger where tgname='trigger_handle_new_user'
         and tgrelid='auth.users'::regclass) as pass;

\echo '== Signup: inserting auth.users creates a profile =='
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','admin@test.local',
   '{"first_name":"Ada","last_name":"Admin","full_name":"Ada Admin"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222','stu@test.local',
   '{"first_name":"Sam"}'::jsonb);

select 'profile auto-created + names populated' as check,
  (select full_name from public.profiles where user_id='11111111-1111-1111-1111-111111111111') = 'Ada Admin' as pass;

select 'derived full_name from first only' as check,
  (select full_name from public.profiles where user_id='22222222-2222-2222-2222-222222222222') = 'Sam' as pass;

-- make user 1 an admin, user 2 a plain student, for RLS checks
update public.profiles set is_admin=true, is_teacher=true
  where user_id='11111111-1111-1111-1111-111111111111';
update public.profiles set is_student=true
  where user_id='22222222-2222-2222-2222-222222222222';

\echo '== RLS: student sees only own row =='
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', false);
select 'student sees exactly 1 row (own)' as check,
  (select count(*) from public.profiles) = 1 as pass;
select 'that row is the student''s own' as check,
  (select bool_and(user_id='22222222-2222-2222-2222-222222222222') from public.profiles) as pass;

\echo '== RLS: admin sees all rows =='
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', false);
select 'admin sees both rows' as check,
  (select count(*) from public.profiles) = 2 as pass;

\echo '== RLS: student cannot update another user =='
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', false);
with upd as (
  update public.profiles set notes='hacked'
  where user_id='11111111-1111-1111-1111-111111111111' returning 1
)
select 'student update of admin row affects 0 rows' as check,
  coalesce((select count(*) from upd),0) = 0 as pass;
reset role;

\echo '== All Wave 0 assertions evaluated =='

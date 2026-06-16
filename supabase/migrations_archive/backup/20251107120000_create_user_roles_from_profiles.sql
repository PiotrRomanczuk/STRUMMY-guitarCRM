-- Migration: Populate user_roles from profiles table
-- This function copies role flags from profiles to user_roles
CREATE
OR REPLACE FUNCTION public.sync_user_roles_from_profiles() RETURNS void AS $ $ BEGIN -- Admins
INSERT INTO
  public.user_roles (user_id, role)
SELECT
  user_id,
  'admin'
FROM
  public.profiles
WHERE
  isAdmin = true ON CONFLICT DO NOTHING;
-- Teachers
INSERT INTO
  public.user_roles (user_id, role)
SELECT
  user_id,
  'teacher'
FROM
  public.profiles
WHERE
  isTeacher = true ON CONFLICT DO NOTHING;
-- Students
INSERT INTO
  public.user_roles (user_id, role)
SELECT
  user_id,
  'student'
FROM
  public.profiles
WHERE
  isStudent = true ON CONFLICT DO NOTHING;
END;
$ $ LANGUAGE plpgsql;
-- To run: SELECT public.sync_user_roles_from_profiles();
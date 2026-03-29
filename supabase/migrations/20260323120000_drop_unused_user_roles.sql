-- Migration: Drop unused user_roles junction table and related artifacts
-- Date: 2026-03-23
--
-- WHY: The user_roles junction table was created as a normalized alternative to the
-- boolean flags (is_admin, is_teacher, is_student) on the profiles table. However,
-- ALL runtime application code uses the profiles boolean flags directly. The junction
-- table was only maintained via a sync trigger but never queried by the app, creating
-- schema drift with two sources of truth for user roles.
--
-- The canonical source of truth for roles is: profiles.is_admin, profiles.is_teacher,
-- profiles.is_student. The is_admin(), is_teacher(), is_student() SECURITY DEFINER
-- functions are updated to read from profiles instead of user_roles.
--
-- Related original migrations (NOT modified, only superseded by this one):
--   - 20251107122500_create_user_roles_table.sql
--   - 20251107131520_rls_user_roles.sql
--   - 20251125000000_migrate_roles_to_user_roles.sql
--   - 20251203000000_sync_user_roles.sql
--   - 20251128130000_fix_rls_recursion.sql (user_roles policies)
--   - 20251128140000_fix_rls_recursion_v2.sql (has_role + is_admin using user_roles)

-- =============================================================================
-- STEP 1: Drop the sync trigger (profiles → user_roles)
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_sync_profile_roles ON profiles;

-- =============================================================================
-- STEP 2: Drop the sync function
-- =============================================================================
DROP FUNCTION IF EXISTS public.sync_profile_roles();

-- =============================================================================
-- STEP 3: Drop all RLS policies on user_roles
-- =============================================================================
DROP POLICY IF EXISTS select_user_roles_admin ON user_roles;
DROP POLICY IF EXISTS insert_user_roles_admin ON user_roles;
DROP POLICY IF EXISTS update_user_roles_admin ON user_roles;
DROP POLICY IF EXISTS delete_user_roles_admin ON user_roles;
DROP POLICY IF EXISTS select_own_roles ON user_roles;

-- =============================================================================
-- STEP 4: Drop the user_overview view (depends on user_roles via JOIN)
-- =============================================================================
DROP VIEW IF EXISTS user_overview;

-- =============================================================================
-- STEP 5: Drop the user_roles table (CASCADE drops indexes automatically)
-- =============================================================================
DROP TABLE IF EXISTS user_roles;

-- =============================================================================
-- STEP 6: Recreate is_admin() to use profiles instead of user_roles
-- The previous definition (from 20251128140000) queried user_roles.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- =============================================================================
-- STEP 7: Recreate has_role() to use profiles boolean flags instead of user_roles
-- The previous definition (from 20251128140000) queried user_roles.
-- Keeps the same function signature for compatibility with existing callers.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.has_role(_role public.user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT
      CASE _role
        WHEN 'admin' THEN is_admin
        WHEN 'teacher' THEN is_teacher
        WHEN 'student' THEN is_student
        ELSE false
      END
    FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- =============================================================================
-- STEP 8: Recreate user_overview view using profiles boolean flags directly
-- The previous definition (from 20251107132000) joined user_roles.
-- This preserves the same column names so runtime code is unaffected.
-- =============================================================================
CREATE OR REPLACE VIEW user_overview AS
SELECT
  p.id AS user_id,
  p.email,
  p.created_at,
  p.updated_at,
  p.is_admin,
  p.is_teacher,
  p.is_student
FROM profiles p;

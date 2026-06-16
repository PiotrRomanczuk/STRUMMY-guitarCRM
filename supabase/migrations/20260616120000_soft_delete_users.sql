-- Soft-delete for profiles (STRUM-p2, spec 04 — MASTER_SPEC ledger D-09).
--
-- Replaces the hard-delete paths (DELETE /api/users/[id], deleteUser action) with
-- soft-delete semantics: a deactivated Profile keeps its row + FKs, sets
-- is_active=false (login disabled) and records deleted_at. RLS must hide those
-- rows from teachers' default reads while still letting admins see everything and
-- a Profile see its own row.
--
-- is_active already exists (005_table_profiles.sql, BOOLEAN NOT NULL DEFAULT true).
-- This migration only adds deleted_at and the is_active SELECT predicate.

-- 1. deleted_at audit column (idempotent).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
COMMENT ON COLUMN profiles.deleted_at IS 'Soft-delete timestamp; set alongside is_active=false on deactivation';

-- 2. Hide deactivated rows from teachers' "read all" path.
--    Permissive SELECT policies are OR'd, so:
--      - teacher: sees active profiles OR their own row (deactivated peers hidden)
--      - admin:   is_admin() bypass → sees everything, including deactivated
--      - self:    own row via select_own_or_admin_profile (unchanged)
--    Boundary is RLS (ADR-0001); app code does not re-WHERE on is_active.
DROP POLICY IF EXISTS "Teachers can read all profiles" ON profiles;
CREATE POLICY "Teachers can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (public.has_role('teacher') AND (is_active = true OR id = auth.uid()))
  OR public.is_admin()
);

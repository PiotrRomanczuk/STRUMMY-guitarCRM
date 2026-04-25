-- ============================================================================
-- Migration: Formalize shadow user profile schema
-- ============================================================================
-- Context: Shadow users (teacher-created student placeholders) have profiles
-- with random UUIDs not present in auth.users. The original profiles.id FK to
-- auth.users may or may not exist in production. This migration:
--   1. Drops the FK if it exists (allows shadow users with no auth entry)
--   2. Adds a unique partial index on user_id (the nullable FK to auth.users)
--   3. Adds a CHECK constraint: non-shadow users must have user_id set
--   4. Adds invite_email column for matching shadow users during signup

-- 1. Drop stale FK from profiles.id -> auth.users(id) if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ensure user_id uniqueness for linked profiles
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_user_id
  ON profiles(user_id)
  WHERE user_id IS NOT NULL;

-- 3. Enforce invariant: non-shadow users must have user_id
-- Use NOT VALID to avoid scanning existing rows (backfill separately if needed)
ALTER TABLE profiles
  ADD CONSTRAINT ck_shadow_user_id
  CHECK (is_shadow = true OR user_id IS NOT NULL)
  NOT VALID;

-- 4. Add invite_email for shadow user invitation matching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_email TEXT;

CREATE INDEX IF NOT EXISTS ix_profiles_invite_email
  ON profiles(invite_email)
  WHERE invite_email IS NOT NULL;

COMMENT ON COLUMN profiles.invite_email IS
  'Real email address for shadow users. Used to match when the student signs up.';

COMMENT ON COLUMN profiles.user_id IS
  'References auth.users(id). NULL for shadow profiles (is_shadow=true). For real users, this equals profiles.id.';

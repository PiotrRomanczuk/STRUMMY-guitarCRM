-- Re-apply invite_email column that was missing from remote despite being in migration history.
-- Safe: IF NOT EXISTS guards against double-apply.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_email TEXT;

CREATE INDEX IF NOT EXISTS ix_profiles_invite_email
  ON profiles(invite_email)
  WHERE invite_email IS NOT NULL;

COMMENT ON COLUMN profiles.invite_email IS
  'Real email address for shadow users. Used to match when the student signs up.';

-- Reload PostgREST schema cache so the new column is visible immediately.
NOTIFY pgrst, 'reload schema';

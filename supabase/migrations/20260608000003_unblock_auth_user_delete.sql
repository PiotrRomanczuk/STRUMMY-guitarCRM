-- ============================================================================
-- Migration: Unblock auth.users deletion (audit FK + profiles cascade)
-- ============================================================================
-- 2026-06-08
--
-- Two related fixes that together let `supabase.auth.admin.deleteUser` succeed
-- for any user with a linked profile. Both caught by scripts/verify/email.ts
-- on prod (cleanup failed silently; auth log showed
-- `update or delete on table "users" violates foreign key constraint
--  "profiles_user_id_fkey"` on the DELETE /admin/users call).
--
-- FIX 1 — audit trigger on profiles can't record DELETE events.
-- ─────────────────────────────────────────────────────────────────────────────
-- `track_user_changes()` is an AFTER DELETE trigger on profiles that does:
--   INSERT INTO user_history (user_id, ...) VALUES (OLD.id, ...);
-- but user_history.user_id has an FK to profiles(id), and the profile row is
-- already gone by the time the trigger fires. The audit insert violates the
-- FK and the entire DELETE rolls back.
--
-- Same structural bug fixed for lesson_history/assignment_history in
-- 20260608000002. user_history was missed in that pass — fixing now.
--
-- FIX 2 — profiles.user_id FK has no ON DELETE CASCADE.
-- ─────────────────────────────────────────────────────────────────────────────
-- Currently:
--   FOREIGN KEY (user_id) REFERENCES auth.users(id)         -- NO ON DELETE
-- So deleting an auth.users row fails if any profile points to it (every
-- non-shadow profile does). `auth.admin.deleteUser` is broken for all linked
-- users. Adding ON DELETE CASCADE so the linked profile is cleaned up
-- automatically with the auth user. This matches the natural lifecycle —
-- a profile without its backing auth user is orphaned anyway.

-- FIX 1 — drop FK from user_history.user_id
ALTER TABLE user_history
  DROP CONSTRAINT IF EXISTS user_history_user_id_fkey;

COMMENT ON COLUMN user_history.user_id IS
  'Profile id at time of audit. Not FK-enforced — audit rows outlive their source. JOIN at read time and tolerate orphans.';

-- FIX 2 — re-add profiles.user_id FK with ON DELETE CASCADE
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

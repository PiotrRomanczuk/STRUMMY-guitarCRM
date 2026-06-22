-- Cross-schema app dependency NOT captured by the public-only schema dump.
-- Source of truth: production Cloud (zmlluqqqwrfhygvpfqka), captured 2026-06-22.
--
-- This trigger lives on auth.users (a Supabase-managed schema) but executes a
-- public function (public.handle_new_user, see migration
-- 20260622121619_fix_handle_new_user_invite_email_match.sql). It must be
-- recreated when loading the baseline into a fresh stack, or invite/signup will
-- never create or link a profile.
--
-- NOTE: storage.* triggers on Cloud (enforce_bucket_name_length_trigger,
-- protect_buckets_delete, protect_objects_delete, update_objects_updated_at)
-- are standard Supabase platform triggers — a fresh stack provisions them
-- automatically, so they are deliberately omitted here.

CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: retire user_settings (IDA-1, grill-decided 2026-07-18)
-- ============================================================================
-- Blueprint gap IDA-1 (docs/app-blueprint/01-identity-access.md).
--
-- Decided in grill: no UI honors theme/language/visibility soon (theme is
-- client-side, no i18n exists, visibility means nothing yet). The only
-- consumer (app/actions/settings.ts: getUserSettings/saveUserSettings) is
-- deleted alongside this migration. transfer_shadow_profile_references
-- already guards its own reference behind an information_schema existence
-- check, so it degrades gracefully. If timezone ever matters (e.g.
-- notification scheduling), it moves to profiles as a single column.
-- ============================================================================

DROP TABLE IF EXISTS public.user_settings CASCADE;

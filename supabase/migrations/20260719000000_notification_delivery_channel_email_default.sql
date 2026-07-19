-- Migration: reset notification_preferences.delivery_channel to email-only
-- ============================================================================
-- Blueprint gap NOT-1 (docs/app-blueprint/07-notifications-email.md).
--
-- Migration 038_in_app_notifications.sql added delivery_channel with the
-- right column default ('email'), but immediately split existing rows into
-- 'email' (2 types) / 'in_app' (16 types) by notification_type. That split
-- predates grill decision 2026-07-18: at launch, delivery guarantees ride on
-- the proven Gmail SMTP chain for ALL notification types, with the in-app
-- bell as a supplement — not a per-type in_app-only default. Revisit `both`
-- for reminder types after observing real student login frequency.
-- ============================================================================

UPDATE notification_preferences
SET delivery_channel = 'email'
WHERE delivery_channel <> 'email';

-- Spec 06 (Auth & Shadow) — extend the auth_event_type enum with the shadow
-- lifecycle events (ADR-0002 §8). These are emitted by
-- lib/auth/auth-event-logger.ts when a teacher sets an invite_email, sends the
-- invite, and when a shadow profile is claimed/linked on signup.
--
-- ADD VALUE cannot run inside a transaction block in older Postgres; use
-- IF NOT EXISTS so re-running the migration is safe.

ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_invite_email_set';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_invite_sent';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_link_completed';
ALTER TYPE auth_event_type ADD VALUE IF NOT EXISTS 'shadow_link_failed';

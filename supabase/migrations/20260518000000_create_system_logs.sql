-- ============================================================================
-- Migration: system_logs — persisted warn/error log stream for the admin UI
-- ============================================================================
-- Phase 2.5 of ADR 0003 (unified logger). Pino writes info/debug to stdout
-- only; warn and error are additionally persisted here so the in-app admin
-- Logs viewer (/dashboard/logs, /api/admin/logs) has a queryable source.
--
-- Volume estimate at current DAU (~20-30): dozens of rows/day, MB-scale/year.
-- Retention policy: TBD via the same monthly partition approach used by
-- audit_log, when volume warrants. For now: unbounded; a future cleanup
-- migration can add partitioning + retention if needed.
--
-- Security: admin-only SELECT; INSERT via service-role only (the Pino
-- destination authenticates with the service-role client). No public
-- access. RLS enabled per ADR 0001 (RLS is the security boundary).

CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');

CREATE TABLE system_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  level        log_level NOT NULL,
  prefix       TEXT NOT NULL,
  message      TEXT NOT NULL,
  request_id   TEXT,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  context      JSONB,
  error        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE system_logs IS
  'Persisted warn/error log stream for the admin UI. Phase 2.5 of ADR 0003.';
COMMENT ON COLUMN system_logs.prefix IS
  'createLogger() namespace, e.g. "API", "cron:lesson-reminders".';
COMMENT ON COLUMN system_logs.context IS
  'Merged request-scope + log-call context (redacted before insert).';
COMMENT ON COLUMN system_logs.error IS
  'Serialized Error object: { type, message, stack }. NULL for non-error levels.';

-- Indexes tuned for the admin viewer query shapes:
--   filter by level + recency       → (level, occurred_at desc)
--   filter by prefix (e.g. "cron:") + recency → (prefix, occurred_at desc)
--   recency-only                    → (occurred_at desc)
CREATE INDEX idx_system_logs_occurred_at ON system_logs (occurred_at DESC);
CREATE INDEX idx_system_logs_level_occurred_at ON system_logs (level, occurred_at DESC);
CREATE INDEX idx_system_logs_prefix_occurred_at ON system_logs (prefix, occurred_at DESC);
CREATE INDEX idx_system_logs_request_id ON system_logs (request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_system_logs_user_id ON system_logs (user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT. Teachers/students never see system logs.
CREATE POLICY system_logs_select_admin ON system_logs
  FOR SELECT USING (is_admin());

-- No public INSERT policy — service-role client (Pino destination) bypasses
-- RLS and is the only writer. Defining no INSERT policy means anon/authed
-- clients are denied by default.

-- No UPDATE or DELETE policies — logs are append-only. Admin retention
-- cleanup happens via a future scheduled migration, not via the API.

-- Restore audit_log (bucket-C table backing the admin AuditLogSection panel).
-- Faithful to 016_table_audit.sql (enums in 003, RLS in 022, grant in 023).
-- Decision (2026-06-19): RESTORE so the admin panel query succeeds instead of
-- silently erroring. NOTE: this is the legacy unified design; the live audit
-- data is in the *_history tables, so the panel reads empty until writes are
-- wired (out of Phase 0 scope).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM (
      'created','updated','deleted','status_changed',
      'rescheduled','cancelled','completed','role_changed'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_entity') THEN
    CREATE TYPE audit_entity AS ENUM (
      'profile','lesson','assignment','song','song_progress'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    entity_type audit_entity NOT NULL,
    entity_id UUID NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    changes JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  pname TEXT;
  sd DATE;
  ed DATE;
BEGIN
  FOR m IN 1..12 LOOP
    pname := format('audit_log_2026_%s', lpad(m::text, 2, '0'));
    sd := make_date(2026, m, 1);
    ed := sd + interval '1 month';
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = pname AND schemaname = 'public') THEN
      EXECUTE format('CREATE TABLE %I PARTITION OF public.audit_log FOR VALUES FROM (%L) TO (%L)', pname, sd, ed);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_log_default' AND schemaname = 'public') THEN
    CREATE TABLE public.audit_log_default PARTITION OF public.audit_log DEFAULT;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS ix_audit_log_entity ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_log_actor ON public.audit_log(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_audit_log_action ON public.audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_log_created_at ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select_admin ON public.audit_log;
CREATE POLICY audit_log_select_admin ON public.audit_log
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS audit_log_select_own ON public.audit_log;
CREATE POLICY audit_log_select_own ON public.audit_log
    FOR SELECT USING (actor_id = auth.uid());

GRANT SELECT ON public.audit_log TO authenticated;

COMMENT ON TABLE public.audit_log IS 'Unified audit log for entity changes, partitioned by month. Restored 2026-06-19 (legacy design; live audit data lives in *_history tables).';

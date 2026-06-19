-- Enable RLS on every audit_log partition. RLS on the partitioned parent is not
-- inherited by child tables for direct access; without this the partitions are
-- readable directly, bypassing the parent's admin-only policy (advisor ERROR
-- rls_disabled_in_public). No per-partition policy needed: parent policies
-- govern parent queries; partitions deny direct access.
DO $$
DECLARE p TEXT;
BEGIN
  FOR p IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'audit_log_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p);
  END LOOP;
END$$;

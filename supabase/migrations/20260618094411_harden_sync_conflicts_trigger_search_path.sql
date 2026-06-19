-- Pin search_path on the sync_conflicts updated_at trigger function to satisfy
-- the function_search_path_mutable advisory. Recorded separately in prod
-- (version 20260618094411); the create migration already pins it inline, so this
-- is idempotent and exists to keep the repo migration list 1:1 with prod.
ALTER FUNCTION public.update_sync_conflicts_updated_at() SET search_path = '';

/**
 * Shared helpers for interpreting Supabase/PostgREST errors.
 *
 * Used by cron handlers and services so they can degrade gracefully (skip,
 * return 200) when a table is not yet present in the target database — e.g.
 * during a phased schema restore where `notification_preferences` or
 * `auth_events` may not yet exist in prod.
 */

interface DbErrorLike {
  code?: string | null;
  message?: string | null;
}

/**
 * Postgres `undefined_table` (`42P01`) and PostgREST schema-cache miss
 * (`PGRST205`) both mean "the table you queried does not exist".
 */
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

/**
 * True when the error indicates the queried relation/table does not exist.
 * Checks both the structured error code and the human-readable message so it
 * works across PostgREST versions.
 */
export function isMissingTableError(error: DbErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code && MISSING_TABLE_CODES.has(error.code)) return true;
  const message = error.message?.toLowerCase() ?? '';
  return message.includes('does not exist') || message.includes('could not find the table');
}

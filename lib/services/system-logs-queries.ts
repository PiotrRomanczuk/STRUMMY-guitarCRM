import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type SystemLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type SystemLogRow = {
  id: string;
  occurredAt: string;
  level: SystemLogLevel;
  prefix: string;
  message: string;
  requestId: string | null;
  userId: string | null;
  context: Record<string, unknown> | null;
  error: { type?: string; message?: string; stack?: string } | null;
};

export type SystemLogFilters = {
  level?: string;
  prefix?: string;
};

const DEFAULT_LIMIT = 100;

/**
 * `system_logs` postdates the generated types (migration 20260518000000); the
 * double-cast mirrors `app/api/admin/logs/route.ts` until types catch up.
 */
export async function getSystemLogs(
  filters: SystemLogFilters,
  limit = DEFAULT_LIMIT
): Promise<SystemLogRow[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = (supabase.from as any)('system_logs')
    .select('id, occurred_at, level, prefix, message, request_id, user_id, context, error')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (filters.level) query = query.eq('level', filters.level);
  if (filters.prefix) query = query.eq('prefix', filters.prefix);

  const { data, error } = (await query) as {
    data: Array<{
      id: string;
      occurred_at: string;
      level: SystemLogLevel;
      prefix: string;
      message: string;
      request_id: string | null;
      user_id: string | null;
      context: Record<string, unknown> | null;
      error: { type?: string; message?: string; stack?: string } | null;
    }> | null;
    error: { message: string } | null;
  };

  if (error) {
    logger.error('[system-logs] failed to fetch system_logs', { error: error.message });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    level: row.level,
    prefix: row.prefix,
    message: row.message,
    requestId: row.request_id,
    userId: row.user_id,
    context: row.context,
    error: row.error,
  }));
}

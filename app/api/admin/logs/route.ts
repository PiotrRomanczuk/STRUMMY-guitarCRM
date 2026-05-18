import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';
import { listResponse } from '@/lib/api/response';

const log = createLogger('api:admin/logs');

const LogLevelEnum = z.enum(['debug', 'info', 'warn', 'error']);

const QuerySchema = z.object({
  level: LogLevelEnum.optional(),
  prefix: z.string().min(1).max(100).optional(),
  since: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

interface SystemLogRow {
  id: string;
  occurred_at: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix: string;
  message: string;
  request_id: string | null;
  user_id: string | null;
  context: Record<string, unknown> | null;
  error: { type?: string; message?: string; stack?: string } | null;
}

/**
 * Shape consumed by `components/v2/admin/LogViewer.tsx`.
 * Keep aligned with `LogEntry` in `components/v2/admin/LogViewer.types.ts`.
 */
interface LogEntryDto {
  id: string;
  timestamp: string;
  level: SystemLogRow['level'];
  message: string;
  source?: string;
  details?: string;
}

function rowToDto(row: SystemLogRow): LogEntryDto {
  const details = buildDetails(row);
  return {
    id: row.id,
    timestamp: row.occurred_at,
    level: row.level,
    message: row.message,
    source: row.prefix,
    details: details || undefined,
  };
}

function buildDetails(row: SystemLogRow): string {
  const parts: string[] = [];
  if (row.request_id) parts.push(`requestId: ${row.request_id}`);
  if (row.user_id) parts.push(`userId: ${row.user_id}`);
  if (row.context && Object.keys(row.context).length > 0) {
    parts.push(`context: ${JSON.stringify(row.context, null, 2)}`);
  }
  if (row.error) {
    parts.push(
      `error: ${row.error.type ?? 'Error'}: ${row.error.message ?? ''}` +
        (row.error.stack ? `\n${row.error.stack}` : '')
    );
  }
  return parts.join('\n\n');
}

/**
 * GET /api/admin/logs — admin-only, paginated.
 *
 * Query params:
 *   level   one of debug|info|warn|error (note: only warn+error are persisted)
 *   prefix  filter by createLogger() namespace (e.g. "cron:lesson-reminders")
 *   since   ISO8601 lower bound on occurred_at
 *   page    1-indexed page number (default 1)
 *   limit   page size 1-200 (default 50)
 *
 * RLS enforces admin-only SELECT on `system_logs`; we double-check the
 * role in app code so non-admins get a 403 instead of an empty list.
 */
export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    if (!roles.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      level: searchParams.get('level') ?? undefined,
      prefix: searchParams.get('prefix') ?? undefined,
      since: searchParams.get('since') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { level, prefix, since, page, limit } = parsed.data;
    const supabase = createAdminClient();
    // `system_logs` is added by the 20260518000000 migration; generated types
    // catch up on first run. The double-cast keeps the build green until then.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (supabase.from as any)('system_logs')
      .select('id, occurred_at, level, prefix, message, request_id, user_id, context, error', {
        count: 'exact',
      })
      .order('occurred_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (level) query = query.eq('level', level);
    if (prefix) query = query.eq('prefix', prefix);
    if (since) query = query.gte('occurred_at', since);

    const { data, error, count } = (await query) as {
      data: SystemLogRow[] | null;
      error: { message: string } | null;
      count: number | null;
    };
    if (error) {
      log.error('failed to fetch system_logs', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const rows = data ?? [];
    return listResponse('logs', rows.map(rowToDto), { total: count ?? 0, page, limit });
  });
}

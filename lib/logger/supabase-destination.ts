/**
 * Pino write stream that persists warn/error log lines to `system_logs`
 * so the in-app admin Logs viewer has a queryable source.
 *
 * Design constraints (per Phase 2.5 of ADR 0003):
 *   - Filter at the stream level — only level >= 40 (warn) is persisted.
 *     info/debug stay in stdout / Vercel logs and never hit the DB.
 *   - Batched async inserts (every BATCH_SIZE rows OR FLUSH_MS, whichever
 *     comes first) so request latency is never tied to log persistence.
 *   - Fail-quiet on DB error: dropping a log line is strictly better than
 *     failing the request that produced it. The drop is itself logged via
 *     `console.error` so it's visible in Vercel logs.
 *   - Service-role insert — bypasses RLS; system_logs has admin-only SELECT.
 *   - Node-only — Edge runtime never loads this module (the facade in
 *     lib/logger.ts only constructs the Pino backend on Node).
 *
 * Phase 2.5 of ADR 0003.
 */

import { createAdminClient } from '@/lib/supabase/admin';

const BATCH_SIZE = 50;
const FLUSH_MS = 5_000;
const PINO_LEVEL_WARN = 40;

type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

interface PinoLogShape {
  level: number;
  time?: number | string;
  msg?: string;
  prefix?: string;
  requestId?: string;
  userId?: string;
  err?: unknown;
  [key: string]: unknown;
}

interface SystemLogRow {
  occurred_at: string;
  level: LogLevelName;
  prefix: string;
  message: string;
  request_id: string | null;
  user_id: string | null;
  context: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

function pinoLevelToName(level: number): LogLevelName | null {
  if (level >= 50) return 'error';
  if (level >= 40) return 'warn';
  if (level >= 30) return 'info';
  if (level >= 20) return 'debug';
  return null;
}

function serializeError(err: unknown): Record<string, unknown> | null {
  if (!err) return null;
  if (typeof err === 'object' && err !== null) {
    const e = err as { type?: string; message?: string; stack?: string };
    return { type: e.type ?? 'Error', message: e.message ?? String(err), stack: e.stack ?? null };
  }
  return { type: 'unknown', message: String(err) };
}

function pinoLogToRow(parsed: PinoLogShape): SystemLogRow | null {
  const levelName = pinoLevelToName(parsed.level);
  if (!levelName) return null;

  const {
    level: _level,
    time: _time,
    msg,
    prefix,
    requestId,
    userId,
    err,
    pid: _pid,
    hostname: _hostname,
    app: _app,
    ...rest
  } = parsed;

  const context = Object.keys(rest).length > 0 ? rest : null;
  const occurredAt =
    typeof parsed.time === 'string'
      ? parsed.time
      : typeof parsed.time === 'number'
        ? new Date(parsed.time).toISOString()
        : new Date().toISOString();

  return {
    occurred_at: occurredAt,
    level: levelName,
    prefix: prefix ?? 'app',
    message: msg ?? '',
    request_id: requestId ?? null,
    user_id: userId ?? null,
    context,
    error: levelName === 'error' ? serializeError(err) : null,
  };
}

class SupabaseLogDestination {
  private buffer: SystemLogRow[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;

  write(chunk: string): boolean {
    let parsed: PinoLogShape;
    try {
      parsed = JSON.parse(chunk) as PinoLogShape;
    } catch {
      return true;
    }

    if (parsed.level < PINO_LEVEL_WARN) return true;

    const row = pinoLogToRow(parsed);
    if (!row) return true;

    this.buffer.push(row);

    if (this.buffer.length >= BATCH_SIZE) {
      void this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => void this.flush(), FLUSH_MS);
      // Don't keep the event loop alive solely for a pending flush.
      if (typeof this.timer.unref === 'function') this.timer.unref();
    }
    return true;
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const supabase = createAdminClient();
      // `system_logs` is added by the 20260518000000 migration; generated types
      // catch up on first run. Cast keeps the build green until then.
      const { error } = await (
        supabase.from('system_logs' as never) as unknown as {
          insert: (rows: SystemLogRow[]) => Promise<{ error: { message: string } | null }>;
        }
      ).insert(batch);
      if (error) {
        // Fail-quiet: don't throw, but make the drop visible in stdout.
        // console.error is allowed by the no-console rule; we use it (not
        // the logger) deliberately to avoid an infinite write loop if the
        // logger itself is the failure path.
        console.error('[supabase-log-destination] insert failed:', error.message, {
          dropped: batch.length,
        });
      }
    } catch (err) {
      console.error('[supabase-log-destination] flush threw:', err, { dropped: batch.length });
    } finally {
      this.flushing = false;
    }
  }
}

const destination = new SupabaseLogDestination();

/**
 * Pino-compatible write stream. Plug into pino's `{ transport }` or
 * `pino(opts, destination)` constructor.
 */
export const supabaseLogStream = {
  write: destination.write.bind(destination),
  flush: destination.flush.bind(destination),
};

/** Exposed for tests — do not call from app code. */
export const __internal = { pinoLogToRow, pinoLevelToName, serializeError };

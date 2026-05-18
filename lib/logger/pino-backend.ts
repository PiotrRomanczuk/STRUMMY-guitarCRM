/**
 * Pino-based logger backend — used on Node runtimes (default for Next.js
 * route handlers, server actions, server components, and Vercel Functions).
 *
 * Output:
 *   dev:  pino-pretty terminal output, looks like the Phase 1 format
 *   prod: one-line JSON per log — indexable by any aggregator
 *
 * Public API matches the console backend; only the implementation differs.
 *
 * Phase 2 of ADR 0003.
 */

import pino, { type Logger as PinoLogger } from 'pino';
import * as Sentry from '@sentry/nextjs';
import { getRequestContext } from './request-context';
import {
  type BoundLogger,
  type LogContext,
  REDACT_KEYS,
  getLogLevel,
  getNodeEnv,
  readEnv,
  redactObject,
} from './shared';
const isDev = getNodeEnv() === 'development';
const persistEnabled = !isDev && readEnv('SYSTEM_LOGS_PERSIST') !== 'off';

/**
 * Pino's `redact.paths` matches by dotted-path. We give it all the
 * common shapes our context objects take: top-level keys, headers.*,
 * user.*, and one-level wildcards (`*.token`).
 */
function buildRedactPaths(): string[] {
  const keys = [...REDACT_KEYS];
  const paths: string[] = [];
  for (const k of keys) {
    paths.push(k);
    paths.push(`*.${k}`);
    paths.push(`*.*.${k}`);
  }
  return paths;
}

const baseOptions = {
  level: getLogLevel(),
  base: { app: 'strummy' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: buildRedactPaths(),
    censor: '<redacted>',
  },
};

/**
 * Build the destination Pino writes to.
 *
 * - Dev: pino-pretty transport (terminal-friendly).
 * - Prod with `SYSTEM_LOGS_PERSIST` ≠ 'off': multistream tee — stdout for
 *   the full firehose (Vercel logs) + `supabaseLogStream` for warn/error
 *   (admin UI). The supabase stream filters internally, but pino's
 *   `level` per-stream still gates by level — both are belt-and-suspenders.
 * - Prod with persist disabled: default stdout only.
 */
function buildRootLogger(): PinoLogger {
  if (isDev) {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,app',
          messageFormat: '[{prefix}] {msg}',
        },
      },
    });
  }

  if (persistEnabled) {
    // Lazy require — keeps lib/supabase/admin (Node-only) out of the
    // client/Edge bundles. This branch only runs server-side, and `require`
    // is unreachable at bundle-eval time so Webpack/Turbopack tree-shake it.
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { supabaseLogStream } =
      require('./supabase-destination') as typeof import('./supabase-destination');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const streams: pino.StreamEntry[] = [
      { level: getLogLevel() as pino.Level, stream: process.stdout },
      { level: 'warn' as pino.Level, stream: supabaseLogStream },
    ];
    return pino(baseOptions, pino.multistream(streams));
  }

  return pino(baseOptions);
}

// Lazy — construction triggers `pino.multistream` etc., which fail in the
// browser bundle (pino/browser.js stub). Defer until first call so that
// merely importing this module from a client context does not crash.
let _rootLogger: PinoLogger | null = null;
function getRootLogger(): PinoLogger {
  if (!_rootLogger) _rootLogger = buildRootLogger();
  return _rootLogger;
}

function mergeContext(context?: LogContext): LogContext {
  const reqCtx = getRequestContext();
  return { ...reqCtx, ...context };
}

export function makePinoLogger(prefix: string): BoundLogger {
  const child = getRootLogger().child({ prefix });
  return {
    debug(message, context) {
      child.debug(mergeContext(context), message);
    },

    info(message, context) {
      child.info(mergeContext(context), message);
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: context ? redactObject(mergeContext(context)) : undefined,
        level: 'info',
      });
    },

    warn(message, context) {
      child.warn(mergeContext(context), message);
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: context ? redactObject(mergeContext(context)) : undefined,
        level: 'warning',
      });
    },

    error(message, error, context) {
      const merged = mergeContext(context);
      // Pino accepts an Error in the first arg; it auto-serializes name/message/stack.
      if (error instanceof Error) {
        child.error({ ...merged, err: error }, message);
      } else {
        child.error({ ...merged, err: error }, message);
      }
      const safeExtra = redactObject(merged);
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message, prefix, ...safeExtra } });
      } else {
        Sentry.captureMessage(`[${prefix}] ${message}`, {
          level: 'error',
          extra: { error, prefix, ...safeExtra },
        });
      }
    },
  };
}

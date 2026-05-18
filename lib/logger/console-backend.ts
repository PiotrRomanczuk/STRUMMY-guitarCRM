/**
 * Console-based logger backend — used on Edge runtime where Pino's
 * Node stream transports don't work. Behaves identically to the
 * Phase 1 implementation (info-in-prod + redaction + Sentry tie).
 *
 * Phase 2 of ADR 0003.
 */

import * as Sentry from '@sentry/nextjs';
import { getRequestContext } from './request-context';
import {
  type BoundLogger,
  type LogContext,
  getLogLevel,
  redactObject,
  safeStringify,
} from './shared';

const levelOrder: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levelOrder[getLogLevel()] ?? 20;

function mergeContext(context?: LogContext): LogContext | undefined {
  const reqCtx = getRequestContext();
  if (!reqCtx && !context) return undefined;
  return { ...reqCtx, ...context };
}

function fmt(level: string, prefix: string, message: string, context?: LogContext): string {
  const ts = new Date().toISOString();
  const merged = mergeContext(context);
  const ctx = merged && Object.keys(merged).length > 0 ? ` ${safeStringify(merged)}` : '';
  return `[${ts}] [${level}] [${prefix}] ${message}${ctx}`;
}

export function makeConsoleLogger(prefix: string): BoundLogger {
  return {
    debug(message, context) {
      if (threshold > levelOrder.debug) return;
      // eslint-disable-next-line no-console -- logger is the chokepoint
      console.log(fmt('DEBUG', prefix, message, context));
    },

    info(message, context) {
      if (threshold > levelOrder.info) return;
      // eslint-disable-next-line no-console -- logger is the chokepoint
      console.log(fmt('INFO', prefix, message, context));
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: mergeContext(context) && redactObject(mergeContext(context)!),
        level: 'info',
      });
    },

    warn(message, context) {
      if (threshold > levelOrder.warn) return;
      console.warn(fmt('WARN', prefix, message, context));
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: mergeContext(context) && redactObject(mergeContext(context)!),
        level: 'warning',
      });
    },

    error(message, error, context) {
      console.error(fmt('ERROR', prefix, message, context), error ?? '');
      const merged = mergeContext(context);
      const safeExtra = merged ? redactObject(merged) : {};
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

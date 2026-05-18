/**
 * Structured logger with Sentry integration.
 *
 * Public API (stable per ADR 0003 — do not change without amending it):
 *   logger.{debug,info,warn,error}        — default singleton
 *   createLogger('namespace').{debug,..}  — namespaced child logger
 *
 * Levels:
 *   debug  — dev console only (LOG_LEVEL=debug to force on in prod), no Sentry
 *   info   — always console.log + Sentry breadcrumb (was dev-only pre-Phase 1)
 *   warn   — always console.warn + Sentry breadcrumb
 *   error  — always console.error + Sentry captureException / captureMessage
 *
 * Secret redaction:
 *   Context keys matching REDACT_KEYS are replaced with `<redacted>` before
 *   serialization. Centralized — callers do not hand-mask. See ADR 0003 §3.
 *
 * Phase 1 of ADR 0003 (lib/logger.ts header comment).
 */

import * as Sentry from '@sentry/nextjs';

type LogContext = Record<string, unknown>;

// Edge-safe env checks — `process` may be a stub in Edge runtime.
const NODE_ENV = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined;
const isDev = NODE_ENV === 'development';
const LOG_LEVEL = (
  typeof process !== 'undefined' ? process.env?.LOG_LEVEL : undefined
)?.toLowerCase();
const debugEnabled = isDev || LOG_LEVEL === 'debug';

/**
 * Keys whose values are masked before serialization. Match is
 * case-insensitive and applies to top-level keys of the context object.
 * Nested objects are walked one level for the common `{ headers: { authorization } }` shape.
 */
const REDACT_KEYS = new Set([
  'token',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'password',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'clientsecret',
  'authorization',
  'cookie',
  'set-cookie',
]);

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === 'object') return redactObject(value as Record<string, unknown>);
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      out[key] = '<redacted>';
    } else {
      out[key] = redactValue(value);
    }
  }
  return out;
}

function safeStringify(ctx: LogContext): string {
  try {
    return JSON.stringify(redactObject(ctx));
  } catch {
    return '[unserializable context]';
  }
}

function fmt(level: string, prefix: string, message: string, context?: LogContext): string {
  const ts = new Date().toISOString();
  const ctx = context && Object.keys(context).length > 0 ? ` ${safeStringify(context)}` : '';
  return `[${ts}] [${level}] [${prefix}] ${message}${ctx}`;
}

function makeLogger(prefix: string) {
  return {
    /** Debug — dev or LOG_LEVEL=debug only, no Sentry */
    debug(message: string, context?: LogContext) {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console -- logger is the chokepoint
      console.log(fmt('DEBUG', prefix, message, context));
    },

    /** Info — always logged + Sentry breadcrumb */
    info(message: string, context?: LogContext) {
      // eslint-disable-next-line no-console -- logger is the chokepoint
      console.log(fmt('INFO', prefix, message, context));
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: context ? redactObject(context) : undefined,
        level: 'info',
      });
    },

    /** Warn — always log + Sentry breadcrumb */
    warn(message: string, context?: LogContext) {
      console.warn(fmt('WARN', prefix, message, context));
      Sentry.addBreadcrumb({
        message: `[${prefix}] ${message}`,
        data: context ? redactObject(context) : undefined,
        level: 'warning',
      });
    },

    /** Error — always log + Sentry capture */
    error(message: string, error?: unknown, context?: LogContext) {
      console.error(fmt('ERROR', prefix, message, context), error ?? '');
      const safeExtra = context ? redactObject(context) : {};
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, prefix, ...safeExtra },
        });
      } else {
        Sentry.captureMessage(`[${prefix}] ${message}`, {
          level: 'error',
          extra: { error, prefix, ...safeExtra },
        });
      }
    },
  };
}

/** Default (un-prefixed) logger for quick usage */
export const logger = makeLogger('app');

/** Create a namespaced logger — keeps backward compat with old API */
export function createLogger(prefix: string) {
  return makeLogger(prefix);
}

// Pre-configured loggers for common modules
export const middlewareLogger = createLogger('Middleware');
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');

// Exposed for tests only — do not import from app code.
export const __internal = { redactObject, safeStringify, REDACT_KEYS };

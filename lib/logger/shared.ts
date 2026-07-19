/**
 * Runtime-agnostic types and helpers shared by Node + Edge logger backends.
 * No dependencies on Node-only APIs — must work on Vercel Edge runtime.
 *
 * Phase 2 of ADR 0003. See docs/app-blueprint/adr/2026-05-17-0003-…
 */

export type LogContext = Record<string, unknown>;

export interface BoundLogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
}

/**
 * Keys whose values are masked before serialization. Match is
 * case-insensitive and applies to all keys at any nesting depth.
 */
export const REDACT_KEYS = new Set([
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

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
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

export function safeStringify(ctx: LogContext): string {
  try {
    return JSON.stringify(redactObject(ctx));
  } catch {
    return '[unserializable context]';
  }
}

/**
 * Detect whether we're running on Vercel Edge runtime.
 * Edge defines a globalThis.EdgeRuntime string identifier.
 */
export function isEdgeRuntime(): boolean {
  // @ts-expect-error — EdgeRuntime is a Vercel-injected global, not in lib.dom
  return typeof EdgeRuntime !== 'undefined';
}

/**
 * Detect whether we're running in a browser/client context.
 * Used to route browser bundles to the console-backend so the
 * Pino Node API surface (multistream, etc.) is never invoked there.
 */
export function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Edge-safe env reads. `process.env` exists on Edge but is a static snapshot.
 */
export function readEnv(key: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[key] : undefined;
}

export function getNodeEnv(): string | undefined {
  return readEnv('NODE_ENV');
}

export function getLogLevel(): string {
  const raw = readEnv('LOG_LEVEL')?.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return getNodeEnv() === 'development' ? 'debug' : 'info';
}

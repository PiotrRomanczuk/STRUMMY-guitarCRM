/**
 * Structured logger — public facade. ADR 0003.
 *
 * Public API (stable per ADR 0003 — do not change without amending it):
 *   logger.{debug,info,warn,error}        — default singleton
 *   createLogger('namespace').{debug,..}  — namespaced child logger
 *
 * Backend dispatch:
 *   Node runtime → Pino (structured JSON in prod, pino-pretty in dev)
 *   Edge runtime → console-based fallback (Phase 1 behaviour)
 *
 * Cross-cutting concerns handled inside the backends:
 *   - Secret redaction for token / password / authorization / cookie / …
 *   - Sentry tying (info/warn → breadcrumb; error → captureException)
 *   - Request-scoped context (requestId, userId) via AsyncLocalStorage
 *
 * See `lib/logger/` for the backends + request-context.
 */

import { isBrowserRuntime, isEdgeRuntime } from './logger/shared';
import { makeConsoleLogger } from './logger/console-backend';
import { makePinoLogger } from './logger/pino-backend';
import type { BoundLogger } from './logger/shared';

// Re-export the request-context helpers so callers don't reach into the
// internal directory.
export {
  runWithRequestContext,
  getRequestContext,
  generateRequestId,
  type RequestContext,
} from './logger/request-context';

function makeLogger(prefix: string): BoundLogger {
  // Browser bundle (client components like error boundaries): console only.
  // Pino is statically imported above and ships in the client bundle, but
  // its root-logger construction is lazy — calling makePinoLogger here
  // would hit `pino.multistream` and crash in the browser stub.
  if (isBrowserRuntime() || isEdgeRuntime()) {
    return makeConsoleLogger(prefix);
  }
  return makePinoLogger(prefix);
}

/** Default (un-prefixed) logger for quick usage */
export const logger = makeLogger('app');

/** Create a namespaced logger — keeps backward compat with old API */
export function createLogger(prefix: string): BoundLogger {
  return makeLogger(prefix);
}

// Pre-configured loggers for common modules
export const middlewareLogger = createLogger('Middleware');
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');

// Internal helpers exposed for unit tests. Do not import from app code.
export { redactObject, safeStringify, REDACT_KEYS } from './logger/shared';
export const __internal = (() => {
  return { isEdgeRuntime };
})();

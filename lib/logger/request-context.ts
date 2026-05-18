/**
 * Request-scoped logging context — propagates `requestId`, `userId`, etc.
 * through every nested log within a single request.
 *
 * Implementation: AsyncLocalStorage on Node runtimes (route handlers,
 * server actions, server components). On Edge runtime, ALS is not
 * reliably available, so the helpers gracefully no-op.
 *
 * Wire-in points:
 *   - API routes: withApiAuth sets requestId + userId at the boundary
 *   - Middleware (proxy.ts): can generate a requestId per request and
 *     propagate via response header for downstream readers
 *
 * Phase 2 of ADR 0003.
 */

import { isEdgeRuntime } from './shared';

export interface RequestContext {
  requestId?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

type AsyncLocalStorageLike<T> = {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
};

let storage: AsyncLocalStorageLike<RequestContext> | null = null;

if (!isEdgeRuntime()) {
  try {
    // Dynamic-require so the import is not evaluated by the Edge bundler.
    // node:async_hooks is Node-only and would fail to resolve on Edge.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require('node:async_hooks') as typeof import('node:async_hooks');
    storage = new AsyncLocalStorage<RequestContext>();
  } catch {
    storage = null;
  }
}

/**
 * Run `fn` inside a request-scoped logging context. Every nested
 * logger call within `fn` (or any async work it kicks off) will
 * automatically have `ctx` merged into its log lines.
 */
export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  if (!storage) return fn();
  return storage.run(ctx, fn);
}

/**
 * Return the currently active request context, or `undefined` if
 * we're outside a request scope (cron, background job, Edge runtime).
 */
export function getRequestContext(): RequestContext | undefined {
  return storage?.getStore();
}

/**
 * Generate a short, URL-safe request ID. Used by middleware when
 * the platform doesn't already provide one.
 */
export function generateRequestId(): string {
  // 12 chars of base36 randomness — collision-improbable for sub-second windows.
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

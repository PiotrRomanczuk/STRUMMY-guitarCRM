---
status: accepted
---

# Unified logger: stable project facade, Pino backend, activity-tracker split out

**Date**: 2026-05-17
**Author**: Claude (synthesized from a logger audit with Piotr)
**Scope**: How the project produces operational logs across server, server-action, route-handler, middleware, and cron contexts
**Supersedes**: parts of `lib/logging/README.md` (which describes a parallel logger; that file is updated to point here after Phase 3)

## Context

The codebase has three modules that all overlap on the word "logging":

| File                                 | Role                                                                                                                                                                                                                                                                                              | Size    | Reach                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------- |
| `lib/logger.ts`                      | Structured logger. `logger` singleton + `createLogger(prefix)`. 4 levels. Sentry wired (errors → `captureException`; info/warn → breadcrumbs).                                                                                                                                                    | 97 LOC  | ~1500 call sites                          |
| `lib/logging/notification-logger.ts` | Parallel logger with a different API (`logInfo`, `logError`, `logCronStart`, `logBounce`, ...). Own format, own Sentry path, own README.                                                                                                                                                          | 420 LOC | ~80 call sites in notification cron paths |
| `lib/logging.ts`                     | **Misnamed and dead.** Intended as `logActivity()` user-analytics tracker writing to `user_activity_logs`. Phase 1 audit confirmed zero callers anywhere in the codebase, and the target table is not in any migration — module is broken at runtime. **Deleted in Phase 1** rather than renamed. | 216 LOC | 0 call sites                              |

Plus drift: ~16 raw `console.log/error/warn` in `app/`, `lib/`, `components/` outside tests; no `no-console` ESLint rule; ~30% of `logger.error` call sites pass `err.message` (a string) where `err` (the Error) belongs, stripping the stack before Sentry sees it; manual `[Module]` prefixes inside the message string duplicate what `createLogger('Module')` already does.

Operational gaps:

- `info` logs are gated behind `if (isDev)` — production has no info trail. Sentry breadcrumbs only surface attached to errors. "The system did the expected thing at 02:33 UTC" is unrecoverable from logs.
- Output is `[ts] [LEVEL] [prefix] msg {ctx}` text. Fine for terminal; bad for any log aggregator. Vercel's log pane treats lines as strings; filtering by `user_id` requires regex.
- No request correlation. Each log line is standalone — reconstructing one request from the noise is timestamp guesswork.
- No secret masking. `JSON.stringify(context)` happily emits a `refresh_token` field; CLAUDE rules say "never log tokens" but enforcement is on the caller.
- Verbosity is binary (`LOG_VERBOSE=true`). Can't say "`lib/ai` loud, `lib/db` quiet."

The 1500 call-site count is the dominant constraint — the public API has to stay stable, or the change becomes a rewrite.

## Decision

**Keep the project facade (`createLogger`, `logger`) exactly as it is today. Replace the implementation underneath with Pino. Split the activity-tracker out of the logging namespace. Delete the parallel notification-logger. Enforce no-console via ESLint.** Ship in four phases, each independently mergeable.

### 1. Facade is stable

```ts
// Public API — unchanged from today
import { logger, createLogger } from '@/lib/logger';

const log = createLogger('module-name');
log.debug(msg, ctx?);
log.info(msg, ctx?);
log.warn(msg, ctx?);
log.error(msg, err?, ctx?);
```

No call-site changes. The 1500 existing usages keep working through every phase.

### 2. Backend is Pino

Internally, `lib/logger.ts` constructs a Pino root instance and returns child loggers from `createLogger`. Pino is the standard for Node logging, gives structured JSON in production for free, has battle-tested transport handling, and treats child loggers as a first-class concept (which is exactly what `createLogger` already simulates).

- **Dev (`NODE_ENV !== 'production'`):** `pino-pretty` transport — human-readable terminal output that looks the same as today's format.
- **Prod:** one-line JSON per log → Vercel logs become indexable; any future move to Datadog/Axiom/etc. is config-only.
- **Edge runtime:** Pino's transports use Node streams. Middleware runs on Edge. Solution: dynamic-import the Pino instance only on Node; fall back to a minimal `console`-based shim on Edge. Public API stays identical across runtimes.

### 3. Cross-cutting concerns live in the facade

- **Secret redaction.** Pino's `redact` option masks an allowlist of keys at serialize time: `token`, `access_token`, `refresh_token`, `password`, `api_key`, `apiKey`, `secret`, `authorization`, `cookie`, `client_secret`. Centralized; callers can't bypass.
- **Request correlation.** `AsyncLocalStorage` holds a request-scoped context (requestId, userId, role). Set once at the API-route boundary (`withApiAuth` does the wiring); every log inside the request automatically gets the fields. No call-site change.
- **Sentry tying.** Same as today: `error` level → `captureException(err)` when `err instanceof Error`, else `captureMessage`. Info/warn → breadcrumb. Pino doesn't replace Sentry; it sits next to it.
- **Per-namespace levels.** Drop the binary `LOG_VERBOSE`. Use Pino's standard `LOG_LEVEL` env var plus a `LOG_NAMESPACES` env var that filters by `createLogger` prefix (`LOG_NAMESPACES=ai,db,*` enables those).

### 4. Activity tracker is dead code — deleted, not renamed

The original plan was to rename `lib/logging.ts` → `lib/analytics/activity-tracker.ts`. The Phase 1 audit revealed the module has **zero callers** (no `logActivity`, `logPageView`, `logButtonClick`, etc. imports anywhere in the codebase) and the target `user_activity_logs` table is **not in any migration** — every function in the module is broken at runtime. The module was deleted outright in Phase 1. The `schemas/ActivityLogSchema.ts` design schema is left in place pending a separate decision on whether activity tracking is on the roadmap; if reinstated, it should live under `lib/analytics/`, not under `lib/logging/`.

### 5. Notification-logger gets demoted

`lib/logging/notification-logger.ts`'s ~80 callers migrate to the unified logger. Specialized helpers like `logCronStart` become idiomatic calls:

```ts
// Before
logCronStart('process-notification-queue');

// After
const log = createLogger('cron:process-notification-queue');
log.info('cron start');
```

The file is deleted or stripped to a tiny shim. `lib/logging/README.md` is rewritten to point at the unified logger.

### 6. ESLint enforces no console

```js
{
  'no-console': ['error', { allow: ['warn', 'error'] }]
}
```

`console.warn` and `console.error` remain allowed (they're occasionally legitimate fallbacks where the logger itself fails). Files that genuinely need raw `console.log` (e.g. `app/api/spotify/callback/route.ts` printing setup instructions for the developer to copy) get a scoped `eslint-disable-next-line` with a comment explaining why.

### 7. Phased rollout

Each phase is an independent PR. Order matters because phase 2 depends on phase 1's API stability and phase 3 depends on phase 2 being landed before deleting the parallel logger.

| Phase                     | Scope                                                                                                                                                                                                                                          | Risk                   | Effort    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------- |
| **1 — Foundation**        | Delete dead `lib/logging.ts` (zero callers, broken table); `info` logs in prod; secret redaction allowlist (in current `fmt()`); fix `logger.error(msg, err.message)` stack-loss; add ESLint `no-console`. **No new dependency, no Pino yet.** | Low                    | ~1 day    |
| **2 — Pino backend**      | Replace `makeLogger()` internals with Pino. Keep public API identical. Add `withRequestId` AsyncLocalStorage helper. Add Edge-runtime fallback.                                                                                                | Medium (edge fallback) | ~2 days   |
| **3 — Consolidate**       | Migrate notification-logger callers. Delete `lib/logging/notification-logger.ts`. Rewrite `lib/logging/README.md`. Drop `LOG_VERBOSE`.                                                                                                         | Low (mechanical)       | ~1 day    |
| **4 — Polish (optional)** | Audit and remove manual token-mask snippets now that redaction is centralized. Wire selected warn/error events to also persist to `audit_log` for security-relevant signals. Add `logger.timing(label, durationMs)` helper for hot paths.      | Low                    | as-needed |

## Considered Options

### A. Status-quo cleanup only

Fix `info`-in-prod, add redaction, rename `lib/logging.ts`, deprecate notification-logger. Keep terminal-formatted output. Rejected as the destination — leaves the structured-JSON and per-namespace-level gaps unsolved. Phase 1 of this ADR is essentially option A; the difference is we don't stop there.

### B. Adopt Pino directly with no facade

Have call sites import Pino's child-logger API directly. Rejected: 1500 call sites would need to migrate, and project-specific concerns (Sentry tying, AsyncLocalStorage request binding, allowlist redaction) leak into every caller. The facade is the right abstraction even when the backend changes.

### C. Adopt Winston instead of Pino

Rejected: Winston is heavier, slower, and its transport ecosystem is rougher on Edge runtime. Pino's `pino-pretty` covers the dev-readability concern that historically motivated Winston choice. Pino is what every recent Node project ends up on.

### D. Keep `lib/logging/notification-logger.ts`

Rejected: it has its own format, its own Sentry path, its own README, and contributors learn one shape (`logger.info`) and then encounter another (`logInfo`). Two APIs for the same concern is a tax on every new contributor and on every read of the code. The specialized helpers (`logCronStart`, `logBounce`) are useful but trivial to re-implement as 3-line wrappers in `lib/logging/cron-helpers.ts` if we want them.

### E. Ship as one big PR

Rejected: the four phases have different risk profiles. Phase 1 is mechanical; phase 2 is the edge-runtime gotcha; phase 3 deletes code. One PR makes review hard and rollback impossible. Four PRs each give a 24-hour soak before the next.

### F. Defer until after the dashboard rebuild

Rejected: phase 1 is a one-day mechanical win that fixes the worst real production problem (info logs are silently dropped in prod). Cheap to take now; cheap not-taken means another quarter of opaque production behaviour.

## Consequences

- **Public API is the contract.** `createLogger(prefix).info(msg, ctx)` and `logger.error(msg, err, ctx)` are stable across all four phases. Reviewers should reject PRs that change these signatures without explicitly amending this ADR.
- **Pino becomes a load-bearing dependency.** Its edge-runtime fallback must be tested; CI should exercise both runtimes (it already does, via the middleware path).
- **Secret redaction is centralized.** Existing hand-masking (`token.slice(0, 6) + '...'`) becomes redundant after Phase 1 and can be removed in Phase 4. Reviewers should reject NEW hand-masking — the allowlist is the chokepoint.
- **`info` logs appear in production.** Volume will rise. We expect 5-10× the current prod log line count, which is a fraction of what aggregators charge for. Monitor first month.
- **The activity tracker is no longer in the `lib/logging` namespace.** Import paths for ~6 client-side files change. Mechanical sweep.
- **Vercel logs become structured JSON in prod.** Anyone parsing them via regex or copy-paste habits should switch to the JSON-aware view. Doc this in `lib/logger.ts` header comment and the README.
- **No raw `console.*` outside the allowlist.** Future contributors will hit ESLint errors; the message points at the unified logger.
- **The plan to ship in four phases is the plan.** Skipping ahead (e.g. shipping Pino without Phase 1's redaction) loses the safety net. Reviewers should not approve out-of-order phase merges without explicit ADR amendment.

## Out of scope

- **External log aggregator choice** (Datadog vs Axiom vs Vercel Logs vs CloudWatch). Phase 2's structured JSON output makes this a config decision, not a code decision. Pick later when there's a real cost-of-opacity signal.
- **Log-based alerting rules.** Once aggregator is chosen, alerts are configured there, not here.
- **Distributed tracing.** Pino's `requestId` field is enough for single-app correlation. OpenTelemetry adoption is a separate ADR if and when it becomes valuable.
- **Audit-log integration depth.** Phase 4 mentions wiring some warn/error events to `audit_log`; the criteria for which events (security-relevant vs. operational) deserves its own short-form decision when phase 4 starts.

---
created: 2026-06-16
updated: 2026-06-16
feature: Google Calendar
phase: 3
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/02-lessons-calendar.md.

# Spec 07 — Google Calendar

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). How-it-works reference: [INTEGRATIONS.md](../INTEGRATIONS.md). Depends on [Phase 0](./00-phase-0-restore-truth.md), [06-auth-shadow](./06-auth-shadow.md) (link reconciliation).

## Goal

Take Google Calendar from "wired but unreachable" to 100%: a real `/dashboard/calendar` page that mounts the existing dark UI, a conflict-resolution surface, a polling fallback for teachers who never enable webhooks, correct recurring-event expansion, user-session token refresh, a clean disconnect, and a hardened webhook. The how-it-works (OAuth, outbound/inbound sync, conflict model, webhook renewal) already lives in [INTEGRATIONS.md](../INTEGRATIONS.md) — this spec is the **build** work, not the reference.

## Calendar UI — current implementation (verified 2026-06-16)

The calendar UI is **built but orphaned**: the import/webhook controls exist and render correctly, but nothing mounts them on a user-reachable route. The only live calendar route is the "Coming soon" stub.

| Component                                                    | Lines   | Renders                                                                                                                                                                                | Mounted / reachable?                                                                          | State                                                                                        |
| ------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `app/dashboard/calendar/page.tsx`                            | 16      | `Card` "Coming soon" / "This page is being rebuilt"                                                                                                                                    | **Yes** (the live `/dashboard/calendar`)                                                      | Placeholder stub                                                                             |
| `components/lessons/integrations/HistoricalCalendarSync.tsx` | 143     | Bulk-import card: start/end date inputs, "Import Historical Lessons", SSE progress bar (imported/skipped/errors), completion summary. Data via `useCalendarBulkSync` hook (SSE stream) | **No** — only re-exported by `components/lessons/index.ts`; imported by zero pages/components | Built, unmounted                                                                             |
| `components/lessons/integrations/CalendarWebhookControl.tsx` | 62      | "Real-time Sync" card with "Enable Sync" button → `enableCalendarWebhook()` server action; error links to `/dashboard/settings`                                                        | **No** — only re-exported by the barrel; zero consumers                                       | Built, unmounted                                                                             |
| `components/lessons/CalendarWebhookControl.tsx` (root copy)  | 62      | byte-identical to the `integrations/` copy (`diff` confirms)                                                                                                                           | **No** — not exported, zero imports                                                           | **Dead duplicate**                                                                           |
| `components/lessons/integrations/GoogleEventImporter.tsx`    | —       | (single-event importer; barrel-exported)                                                                                                                                               | **No** — barrel-export only, zero consumers                                                   | Built, unmounted                                                                             |
| `components/settings/IntegrationsSection.tsx`                | 71      | Google Calendar card: status pill + **Connect** button → `/api/auth/google`. When connected, the button is `disabled` "Connected" — **no disconnect**                                  | **No** — only mounted by `SettingsPageClient.tsx`, which is itself mounted nowhere            | Connect-only, unreachable                                                                    |
| `components/settings/editorial/SettingsEditorial.tsx`        | —       | The **live** `/dashboard/settings` body                                                                                                                                                | **Yes**                                                                                       | **Surfaces no Google/integration UI at all** (zero references to Google/connect/Integration) |
| `components/v2/calendar/*`                                   | 7 files | `Calendar`, `Calendar.Desktop`, `WeekStrip`, `AgendaView`, `EventSheet`, skeleton, `index`                                                                                             | (not deep-read)                                                                               | Tree to delete (7.1)                                                                         |

**What's built:** the bulk historical-import flow (`HistoricalCalendarSync` + `useCalendarBulkSync` SSE) and the webhook-enable control (`CalendarWebhookControl`) are complete, styled, and dark-mode aware. The OAuth connect entry point (`IntegrationsSection` → `/api/auth/google`) exists.

**What's missing (net-new):**

- **The calendar page mount.** `/dashboard/calendar` is a "Coming soon" stub. None of the import/webhook controls are reachable by a user from any route — they live only in the barrel.
- **Connect surfaced on the live settings page.** `IntegrationsSection` (with the Connect button) is mounted only via `SettingsPageClient`, which is itself unmounted; the live editorial settings page (`SettingsEditorial`) shows **no** Google integration UI. So even connecting Google is currently unreachable through the editorial settings.
- **Disconnect UI** — `IntegrationsSection` renders a `disabled` "Connected" button; there is no disconnect button or action (7.6 backs this).
- **Conflict-resolution UI** — `fetchPendingConflicts` / `resolveConflict` (`app/actions/calendar-conflicts.ts`) have **only test consumers** (`app/actions/__tests__/calendar-conflicts.test.ts`); no component or route renders them. Entirely net-new (7.2).

**Duplicate finding:** `components/lessons/CalendarWebhookControl.tsx` is byte-identical to the `integrations/` copy and has zero imports. Delete the root copy (7.1). Note that _both_ copies are currently unmounted — deleting the root one is safe regardless.

**Dark calendar page state:** `/dashboard/calendar` renders only the "Coming soon" `Card`; no calendar grid, agenda, or controls are mounted.

### Gap to this spec's target behavior

| Sub-spec          | Current reality                                  | Gap                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 Mount dark UI | Controls exist, fully unmounted; page is a stub  | Build editorial page mounting `HistoricalCalendarSync` + `CalendarWebhookControl`; surface Connect via `IntegrationsSection` **on the editorial settings page** (not just `SettingsPageClient`); delete root dup + `v2/calendar/*` |
| 7.2 Conflict UI   | Actions exist, **only test consumers**, no route | Net-new `conflicts/page.tsx` + diff UI                                                                                                                                                                                             |
| 7.3 Polling cron  | Dispatcher-step only (per spec)                  | Decide dispatcher vs dedicated route                                                                                                                                                                                               |
| 7.4 Recurring     | `singleEvents:true` set                          | Per-instance dedupe                                                                                                                                                                                                                |
| 7.5 Token refresh | Admin client refreshes; user client doesn't      | Add refresh to `getGoogleClient()`                                                                                                                                                                                                 |
| 7.6 Disconnect    | "Connected" button is `disabled`, no action      | Disconnect action + button                                                                                                                                                                                                         |
| 7.7 Webhook       | `NODE_ENV` skip                                  | Env-flag + resource-state validation                                                                                                                                                                                               |

## User stories

As a teacher I:

- **Connect** Google from settings → Integrations and see connection status.
- **Import** a date range of existing calendar events as lessons (bulk import, SSE progress).
- **Sync** in real time by enabling the webhook; if I never enable it, a polling cron keeps me current.
- **Resolve conflicts** when a lesson and its Google event diverge (local-vs-remote diff, keep one side).
- **Disconnect** cleanly — token revoked, webhook stopped, rows removed, no orphaned channel left calling back.

## Sub-specs

### 7.1 — Mount the dark calendar UI

- **Current state:** `app/dashboard/calendar/page.tsx` is a "Coming soon" stub (`Card` saying "This page is being rebuilt"). The components exist: `components/lessons/integrations/HistoricalCalendarSync.tsx` (bulk import + SSE) and `components/lessons/integrations/CalendarWebhookControl.tsx`. A duplicate `components/lessons/CalendarWebhookControl.tsx` exists and is **byte-identical**; only the `integrations/` copy is exported via `components/lessons/index.ts`, so the root copy is dead. `components/v2/calendar/*` (7 files) and `components/settings/IntegrationsSection.tsx` also exist.
- **Steps:** Replace the stub with an editorial page that mounts `HistoricalCalendarSync` + `CalendarWebhookControl`. Surface connect/disconnect from `IntegrationsSection`. Delete the dead `components/lessons/CalendarWebhookControl.tsx`. Delete `components/v2/calendar/*` once the editorial page is live.
- **Done when:** `/dashboard/calendar` renders the real UI (no "Coming soon"); the duplicate control is gone; `tsc --noEmit` is clean after the v2 deletion.

### 7.2 — Conflict resolution UI

- **Current state:** `app/actions/calendar-conflicts.ts` exposes `fetchPendingConflicts()`, `resolveConflict(id, 'use_local'|'use_remote')`, and `autoResolveOldConflictsAction()` (these wrap the lib functions `getPendingConflicts` / `resolveConflictManually` / `autoResolveOldConflicts` in `lib/services/sync-conflict-resolver.ts`). There is **no** UI route — `app/dashboard/calendar/conflicts/` does not exist at all (the `calendar/` dir holds only `error.tsx`, `loading.tsx`, and the stub `page.tsx`). The actions have **only test consumers** (`app/actions/__tests__/calendar-conflicts.test.ts`); no component renders them, so this surface is entirely net-new.
- **Steps:** Build `app/dashboard/calendar/conflicts/page.tsx` listing `fetchPendingConflicts()`; render a side-by-side local-vs-Google field diff (title, scheduled_at, notes); accept/reject buttons call `resolveConflict(id, resolution)`. Render editorial.
- **Done when:** a teacher with a pending `sync_conflicts` row sees the diff and resolving updates the row's `status`/`resolution`.

### 7.3 — Polling-sync cron

- **Current state:** `syncAllTeacherCalendars()` (`lib/services/calendar-sync-service.ts`) **is** called — from `app/api/cron/dispatcher/route.ts` (`sync-calendars-and-update-status` step), not "never called" as §2.7 states. There is **no** dedicated `app/api/cron/calendar-sync/route.ts` and **no** `calendar-sync` entry in `vercel.json` crons.
- **Steps:** Decide one of two paths and document it: (a) keep relying on the dispatcher step (no new route/cron), or (b) add a dedicated `app/api/cron/calendar-sync/route.ts` calling `syncAllTeacherCalendars()`, guarded by `verifyCronSecret` (`lib/auth/cron-auth.ts`), plus a `vercel.json` entry (~every 6 h). Either way the polling path must cover teachers who never enable the webhook.
- **Done when:** a teacher with a Google integration but no webhook subscription gets new events imported on a schedule; the cron returns 200 and is secret-guarded.

### 7.4 — Recurring events

- **Current state:** `singleEvents: true` is **already** passed in `getCalendarEventsInRange()` and `getCalendarEventsInRangeAdmin()` (`lib/google.ts`), so Google returns expanded instances. The remaining gap is per-instance dedupe: each instance shares a base event id, and `lessons.google_event_id UNIQUE` would collide across instances.
- **Steps:** Use the per-instance id Google returns for expanded instances (the instance id, not the recurring-event id) as the dedupe key when inserting lessons in `syncGoogleEventsForUser()` / `calendar-sync-service`. Verify no two instances map to the same `google_event_id`.
- **Done when:** a weekly recurring lesson imports as N distinct lessons, deduped per instance, not 1.

### 7.5 — User-session token refresh

- **Current state:** `getGoogleClientAdmin()` checks `expires_at < now` and calls `refreshAccessToken()`, persisting the new token. `getGoogleClient()` (the user-session client) sets credentials but does **not** check expiry or refresh — a mid-session expired token silently fails.
- **Steps:** Add the same expiry check + `refreshAccessToken()` + persist (via the user-scoped client, respecting RLS) to `getGoogleClient()`. Factor the shared refresh logic so the two clients don't drift.
- **Done when:** a user-session calendar call with an expired `expires_at` refreshes transparently and persists the new token.

### 7.6 — Disconnect flow

- **Current state:** `stopCalendarWatch()` exists in `lib/google.ts`; `user_integrations` and `webhook_subscriptions` rows persist. No single disconnect action revokes the token + stops the channel + deletes both rows.
- **Steps:** Add a disconnect action that calls `oauth2Client.revokeToken()`, `stopCalendarWatch()` (Google `channels.stop`), deletes the `user_integrations` row and the `webhook_subscriptions` row. Wire it to the disconnect button in `IntegrationsSection`.
- **Done when:** disconnecting revokes the token, stops the channel, and removes both rows; no orphan channel keeps POSTing the webhook.

### 7.7 — Webhook hardening

- **Current state:** `app/api/webhooks/google-calendar/route.ts` `validateToken()` returns `true` whenever `NODE_ENV === 'development'` (blanket skip). It reads `x-goog-resource-state` and special-cases `'sync'`, but does not reject unexpected states.
- **Steps:** Replace the `NODE_ENV` skip with an explicit env flag (e.g. `CALENDAR_WEBHOOK_SKIP_TOKEN`) so dev opt-out is deliberate, not implicit. Validate `x-goog-resource-state`: handle `sync` (ack), `exists`/`not_exists` (process), reject/ignore anything else with a logged warning.
- **Done when:** an unconfigured-secret request in prod is rejected; dev only skips when the explicit flag is set; unknown resource states are not processed.

## Data contract

| Concern                         | Detail                                                                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Polling cron (7.3, if option b) | `GET /api/cron/calendar-sync` → `verifyCronSecret(request)` (`lib/auth/cron-auth.ts`, `CRON_SECRET`) → `syncAllTeacherCalendars()`. Returns 200 + `{ teachersSynced, lessonsImported, lessonsSkipped, errors }`. `vercel.json` cron `0 */6 * * *`. |
| Conflict actions (7.2)          | `fetchPendingConflicts()` → `{ success, conflicts }`; `resolveConflict(id, 'use_local'\|'use_remote')` → `{ success }`; both in `app/actions/calendar-conflicts.ts`, gated by `auth.getUser()`.                                                    |
| Disconnect (7.6)                | Server action: `revokeToken` → `stopCalendarWatch` → delete `user_integrations` row → delete `webhook_subscriptions` row, scoped to `user_id`.                                                                                                     |
| Webhook (7.7)                   | `POST /api/webhooks/google-calendar`; headers `x-goog-channel-id`, `x-goog-resource-id`, `x-goog-resource-state`, `x-goog-channel-token`.                                                                                                          |

**Tables & RLS** (ADR-0001 — RLS is the boundary; no app-side re-filter):

| Table                   | RLS                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `user_integrations`     | Per-`user_id` select/insert/update/delete; only the owner reads/mutates their OAuth tokens.        |
| `webhook_subscriptions` | Per-`user_id`; owner-only. Admin/cron paths use the service-role client (RLS bypass) deliberately. |
| `sync_conflicts`        | Teacher sees only own conflicts (joined via `lesson_id` → lesson owner).                           |

## Behavior & edge cases / failure modes

- **Teacher never enables the webhook** → the polling path (7.3) is the only freshness mechanism; it must run regardless of webhook state.
- **Recurring event expands to N** → each instance is a distinct lesson; dedupe per-instance id, never per base id (7.4), or the `UNIQUE` constraint collapses the series to one.
- **Duplicate `CalendarWebhookControl`** → root copy is dead (only `integrations/` is exported); delete it during 7.1 — do not leave two identical files.
- **Token expiry mid-session** → user-session calls must refresh (7.5), matching the admin client's existing behavior; otherwise the call fails silently.
- **Outbound sync stays non-blocking** (INTEGRATIONS.md): lesson CRUD never fails because Google is down; sync errors log, the lesson persists. Do not regress this.
- **Disconnect with a live channel** → must call `channels.stop`; skipping it leaves Google POSTing to a webhook whose subscription row is gone (the route already 200s + ignores unknown channels, but the channel keeps retrying for 7 days).
- **Webhook spoofing** → the `NODE_ENV` skip is the hole; an attacker can POST in any env where the secret is unset. Close per 7.7.

## Files to touch

- `app/dashboard/calendar/page.tsx` — replace stub, mount editorial UI (7.1).
- `app/dashboard/calendar/conflicts/page.tsx` — **new**, conflict UI (7.2).
- `components/settings/IntegrationsSection.tsx` — connect/disconnect wiring (7.1, 7.6).
- `components/lessons/CalendarWebhookControl.tsx` — **delete** (dead duplicate, 7.1).
- `components/v2/calendar/*` — **delete** after editorial lands (7.1).
- `lib/google.ts` — refresh in `getGoogleClient()` (7.5); disconnect helper using `stopCalendarWatch` + `revokeToken` (7.6).
- `lib/services/calendar-sync-service.ts` / `google-calendar-sync.ts` — per-instance dedupe (7.4).
- `app/api/cron/calendar-sync/route.ts` + `vercel.json` — **new** if option b (7.3).
- `app/api/webhooks/google-calendar/route.ts` — env-flag skip + resource-state validation (7.7).
- `app/actions/calendar-conflicts.ts` — already present; consumed by 7.2.

## Acceptance criteria (test names)

- `calendar-sync.e2e` — connect → import a date range → lessons exist on `/dashboard/calendar` (after 7.1).
- `calendar-recurring.test` — a weekly event imports as N instances, deduped per-instance id.
- `calendar-disconnect.test` — disconnect revokes the token and deletes both the `user_integrations` and `webhook_subscriptions` rows.
- `calendar-conflict.resolve.test` — `resolveConflict(id, 'use_local')` resolves a pending `sync_conflicts` row and the UI reflects it.
- `google-client.refresh.test` — `getGoogleClient()` refreshes and persists when `expires_at` is past.
- `calendar-webhook.token.test` — prod request with no secret is 401; unknown `x-goog-resource-state` is not processed.
- `user-integrations.rls.test` / `webhook-subscriptions.rls.test` — owner-only read/write; cross-user access denied.

## Definition of Done

1. `/dashboard/calendar` mounts editorial UI; no "Coming soon"; nav resolves to a real feature.
2. Conflicts, polling fallback, recurring dedupe, user-session refresh, disconnect, and webhook hardening all ship and pass their named tests.
3. `user_integrations` and `webhook_subscriptions` have RLS tests (`jest.config.rls.ts`); `sync_conflicts` is teacher-isolated.
4. No silent failure: token refresh, webhook validation, and disconnect surface errors; outbound sync stays non-blocking.
5. `components/v2/calendar/*` and the dead `components/lessons/CalendarWebhookControl.tsx` are deleted; `tsc --noEmit` clean.

## Dependencies & out of scope

- **Depends on** [Phase 0](./00-phase-0-restore-truth.md) (tables + crons green) and [06-auth-shadow](./06-auth-shadow.md) for calendar reconciliation on `shadow_link_completed` (§2.6.3 patches future attendee emails — owned there, consumed here).
- **Out of scope:** RRULE round-trip authoring, multi-calendar selection, field-level merge with undo, offline sync queue, sync-analytics dashboard, shadow student-invitation emails (all in INTEGRATIONS.md → Future integrations). Spotify is a separate integration.

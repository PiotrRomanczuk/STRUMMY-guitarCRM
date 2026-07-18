---
created: 2026-06-16
updated: 2026-06-16
feature: Notifications
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/07-notifications-email.md.

# Spec 08 — Notifications & Email

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). How-it-works: [NOTIFICATIONS.md](../NOTIFICATIONS.md). HARD-depends on [Phase 0](./00-phase-0-restore-truth.md) §0.1 (tables must exist). Consumed by [03-assignments](./03-assignments.md), [02-lessons](./02-lessons.md), [06-auth-shadow](./06-auth-shadow.md).

## Goal

Dual-channel notifications (in-app + email) that respect per-user preferences and never fail silently once the bucket-A tables are restored. In-app is the default for 16 of 18 types (realtime, durable feed); email is reserved for `student_welcome` and `lesson_recap`, queued + retried. Every email send funnels through the deliverable-email chokepoint (§2.6.2 / spec [06](./06-auth-shadow.md)) so shadow profiles with no address are skipped, not bounced. Mechanics live in [NOTIFICATIONS.md](../NOTIFICATIONS.md) — this spec is the feature wiring on the restored tables.

## User stories

| As a…                            | I want…                                                                               | So that…                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| Student                          | an in-app notification when an assignment is created or a lesson is updated           | I see changes without checking email     |
| Student                          | a weekly progress digest email (opt-in)                                               | I get a Sunday recap of my week          |
| Teacher                          | weekly insights (opt-in)                                                              | I track engagement                       |
| Any user                         | to toggle each notification type on/off and pick its channel in `/dashboard/settings` | I control noise                          |
| Any user                         | one-click unsubscribe from an email footer (no login)                                 | I can opt out of a single type instantly |
| Shadow profile (no invite email) | to receive in-app notifications but never an email                                    | placeholder records never bounce         |

## Current state (verified 2026-06-16)

| Surface                      | File                                                                                                                                                                               | Status                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Dual-channel router + send   | `lib/services/notification-service.ts` (479 LOC — **over the 200 LOC cap; split per §4.5**)                                                                                        | exists                                                                                |
| Queue processor + retry loop | `lib/services/notification-queue-processor.ts` (296 LOC)                                                                                                                           | exists; calls `get_pending_notifications` RPC, dedups by entity, retries with backoff |
| Monitoring                   | `lib/services/notification-monitoring.ts` (542 LOC)                                                                                                                                | exists                                                                                |
| In-app server actions        | `app/actions/in-app-notifications.ts` (get / markRead / markAllRead / unreadCount)                                                                                                 | exists                                                                                |
| Preference server actions    | `app/actions/notification-preferences.ts` (155 LOC)                                                                                                                                | exists                                                                                |
| Queue cron                   | `app/api/cron/process-notification-queue/route.ts` (`*/15`)                                                                                                                        | exists                                                                                |
| Weekly digest cron           | `app/api/cron/weekly-digest/route.ts`                                                                                                                                              | exists; **throws "Failed to fetch preferences" until 0.1** (§0.4)                     |
| Migrations                   | `032_notification_system.sql`, `033_notification_triggers.sql`, `038_in_app_notifications.sql`, `039_update_triggers_for_in_app.sql`, `20260226300000_create_user_preferences.sql` | SQL in repo; **bucket A — unconfirmed in prod**                                       |
| Editorial feed               | `components/notifications/editorial/NotificationsEditorial.tsx`                                                                                                                    | exists                                                                                |
| v2 (delete)                  | `components/v2/notifications/*` (Bell, Center, Item, Empty, Desktop, index)                                                                                                        | **to delete on done**                                                                 |
| Unsubscribe                  | `app/api/notifications/unsubscribe/route.ts`, `app/unsubscribe/page.tsx`                                                                                                           | exists                                                                                |

**Schema-drift caveat:** `notification_log`, `notification_queue`, `notification_preferences`, `user_preferences`, `in_app_notifications` are **MISSING from production** (Phase 0 bucket A). Until 0.1 applies `032 → 033 → 038` + `user_preferences`, DB triggers and `.from()` inserts have no target table, so every send is a **silent no-op** — no email, no in-app row, nothing logged. All behavior below is the intended design that comes online once 0.1 lands.

**Chokepoint divergence:** NOTIFICATIONS.md describes `getDeliverableEmail()` resolving shadow addresses; the queue processor / `sendNotification` currently send to `recipient.email` directly with **no** shadow-skip resolver. Wiring this chokepoint (so shadows with no `invite_email` → `skipped_shadow`) is in scope here, anchored on spec [06](./06-auth-shadow.md) §6.2.

## Editorial UI — current implementation (verified 2026-06-16)

**Mounted at:** `/dashboard/notifications` (`app/dashboard/notifications/page.tsx`) — SSR, redirects unauthenticated to sign-in; fetches via `getRecentNotifications(user.id)` then renders `<NotificationsEditorial>`. Bell is mounted globally in the topbar via `components/layout/LayoutWrapper.tsx` + `AppShell.tsx` (`<NotificationBell userId={...} />`).

| Component                                                                 | Lines | Renders                                                                                                                                                                                    | Data source                                                                                                                                                                                                                                                                                        | State                                                                                                        |
| ------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `components/notifications/editorial/NotificationsEditorial.tsx`           | 248   | Inbox feed: unread count, read/unread row styling, per-row "Mark read", header "Mark all read", empty state. Presentational only — takes `{ notifications: NotificationRow[]; now: Date }` | `lib/services/notifications-queries.ts` → `getRecentNotifications` reads `in_app_notifications` (`created_at DESC`, limit 30); mark actions are `markNotificationReadAction` / `markAllNotificationsReadAction` from `app/actions/notifications.ts` (write `in_app_notifications.is_read/read_at`) | WIRED to `in_app_notifications` (no pagination — fixed limit 30; mark via `<form action>`, no optimistic UI) |
| `components/notifications/NotificationBell.tsx`                           | 106   | Topbar bell + unread badge + Popover dropdown (last 10), realtime updates                                                                                                                  | `components/notifications/useNotifications.ts` (190) → `app/actions/in-app-notifications.ts` + Supabase realtime channel on `in_app_notifications`                                                                                                                                                 | WIRED to `in_app_notifications` (present, not absent)                                                        |
| `components/settings/NotificationPreferences/NotificationPreferences.tsx` | 119   | Per-type enable/disable + channel toggles                                                                                                                                                  | `app/actions/notification-preferences.ts` (155) → `notification_preferences`                                                                                                                                                                                                                       | PARTIAL — component built + action-wired, but **not mounted on any route**                                   |

**Note:** `NotificationsEditorial` (mount target) and `NotificationBell` (topbar) use **different data paths** to the same `in_app_notifications` table — the page uses `notifications-queries.ts` + `app/actions/notifications.ts`; the bell uses `in-app-notification-service` via `app/actions/in-app-notifications.ts`. Two parallel read/mark implementations against one table.

**What's built (in-app list):** durable feed at the route, topbar bell with realtime + badge + dropdown, single + bulk mark-read, empty state, relative timestamps. All read/write `in_app_notifications`.

**What's missing:**

- **Preferences UI is unreachable.** `components/settings/editorial/SettingsEditorial.tsx` links to `/dashboard/settings/notifications`, but `app/dashboard/settings/notifications/page.tsx` renders a **"Coming soon… being rebuilt" stub** — the built `NotificationPreferences` component is _not_ imported there. No way for a user to toggle types/channels in the live UI.
- **Unsubscribe:** backend route (`app/api/notifications/unsubscribe/route.ts`) + landing page (`app/unsubscribe/page.tsx`) exist; not surfaced from any in-app UI (email-footer driven only).
- **Bell indicator:** present (not a gap).
- **Email channel:** no UI — backend/cron concern only.
- **Pagination / filtering** on the feed: not implemented (hard `limit 30`).

**Gap to this spec's target behavior:** Every built surface above reads/writes `in_app_notifications` (and prefs → `notification_preferences`), which are **MISSING from production until Phase 0 §0.1** restores the bucket-A tables. Until then: `getRecentNotifications` swallows the error and returns `[]` (empty feed), the bell shows nothing, and mark/preference writes are silent no-ops — the UI looks "all caught up" rather than broken. So even the fully-wired feed + bell are functionally dead in prod until 0.1 lands; the unmounted preferences UI is a second, independent gap on top of that.

## Data contract

| Path                                                                | Payload / signature                                                   | Notes                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getInAppNotifications(userId, { limit, offset })`                  | rows from `in_app_notifications` ordered `created_at DESC`            | RLS: own rows only                                                                                                                                                                                                                          |
| `markNotificationAsRead(id)` / `markAllNotificationsAsRead(userId)` | sets `is_read`, `read_at`                                             | RLS: own rows; sets `expires_at = read_at + 30d`                                                                                                                                                                                            |
| `getUnreadNotificationCount(userId)`                                | `number`                                                              | drives bell badge                                                                                                                                                                                                                           |
| `processQueuedNotifications(batch=100)`                             | `{ processed, failed }`                                               | `get_pending_notifications` RPC (`FOR UPDATE SKIP LOCKED`); per-row: dedup by `(type, entity_type, entity_id, status='sent')` → preference check → **deliverable-email chokepoint** → rate-limit → render → SMTP → write `notification_log` |
| `retryFailedNotifications()`                                        | `{ retried, failed, deadLettered }`                                   | exponential backoff 1m/5m/30m/2h/24h; `>5` → `bounced` (dead-letter)                                                                                                                                                                        |
| `GET /api/cron/weekly-digest`                                       | `{ success, processed, failed, total, timestamp }`                    | selects `notification_preferences` where `notification_type='weekly_progress_digest' AND enabled=true`; one queue entry per opted-in student                                                                                                |
| `GET /api/notifications/unsubscribe?userId&type`                    | redirect to `/unsubscribe?success&type`                               | validates params + type + user; sets `enabled=false` for `(userId, type)`                                                                                                                                                                   |
| Preference check                                                    | `is_notification_enabled(user_id, type)` → `BOOLEAN` (default `true`) | called before every email send; disabled → `notification_log.status='skipped'`                                                                                                                                                              |
| Channel routing                                                     | `getDeliveryChannel(userId, type)` → `email \| in_app \| both`        | falls back to `getDefaultDeliveryChannel(type)`                                                                                                                                                                                             |

**RLS (all four tables + `user_preferences`):** users SELECT own rows (UPDATE own preferences + in-app read status); admins SELECT all; service role does all queue/log/insert writes. Crons verify `Authorization: Bearer ${CRON_SECRET}`.

## Behavior & edge cases / failure modes

| Scenario                          | Expected behavior                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucket-A table missing (pre-0.1)  | Pre-restore: silent no-op (current). **Post-restore, this must NOT be swallowed** — a missing/erroring target table surfaces as a logged `failed`, never a swallowed `catch`.                 |
| User disabled the type            | `is_notification_enabled` returns false → skip send → `notification_log.status='skipped'`; no queue churn                                                                                     |
| Unsubscribed user (footer link)   | `enabled=false` persisted; subsequent sends `skipped`; weekly-digest excludes them at the preference query                                                                                    |
| Shadow profile, no `invite_email` | deliverable-email chokepoint returns none → email skipped, logged `status='skipped'` with `skipped_shadow` reason; **never errored, never retried**. In-app still delivered (no email needed) |
| Duplicate already sent for entity | queue row → `cancelled`, counted as processed                                                                                                                                                 |
| Transient SMTP / send failure     | `notification_log.status='failed'`; retry with backoff (max 5)                                                                                                                                |
| 3 consecutive bounces             | `bounce-handler` auto-disables all notifications for the user; re-enable via `reenableNotificationsForUser`                                                                                   |
| Rate limit hit                    | 100/hr/user, 1000/hr system → `failed` with retry-after; respects Gmail cap                                                                                                                   |
| Global kill-switch                | `NOTIFICATIONS_ENABLED=false` → all sends short-circuit                                                                                                                                       |
| In-app expiry                     | `cleanup_old_in_app_notifications()` daily removes read rows past `expires_at`                                                                                                                |

## Files to touch

- `lib/services/notification-service.ts` — **split per channel (§4.5)** to clear the 200 LOC cap; route in-app vs email; integrate deliverable-email chokepoint (spec 06.2) before any email log/send.
- `lib/services/notification-queue-processor.ts` — call the chokepoint resolver; emit `skipped_shadow` for shadows with no address; ensure no swallowed failures once tables exist.
- `app/actions/in-app-notifications.ts` — confirm RLS-scoped reads; batch mark-read.
- `app/api/cron/weekly-digest/route.ts` — green once `notification_preferences` is in prod (§0.4); respect preferences, skip unsubscribed.
- `app/api/cron/process-notification-queue/route.ts` — unchanged contract; verify against restored tables.
- `components/notifications/editorial/NotificationsEditorial.tsx` — sole survivor feed/bell.
- **Delete** `components/v2/notifications/*` and any v1 notification components on done (§3.2).
- RLS policies on `notification_log`, `notification_queue`, `notification_preferences`, `in_app_notifications`, `user_preferences` (migrations `032`/`038`).

## Acceptance criteria (as test names)

- `in-app-notifications.test` — create → mark read/unread → batch mark-all; RLS scopes to owner.
- `weekly-digest.cron.test` — returns 200; respects `enabled`; skips unsubscribed students.
- `notification-queue.deliverable-email.test` — shadow with no `invite_email` → `skipped_shadow`, no retry; shadow with `invite_email` → sends.
- `notification-preferences.skip.test` — disabled type → `notification_log.status='skipped'`, email not sent.
- `notification.rls.test` — user sees only own `notification_log` / `notification_preferences` / `in_app_notifications`; admin sees all; service role writes.

## Definition of Done

1. **Behavior:** in-app + email both deliver against restored bucket-A tables; weekly-digest returns 200 and respects preferences.
2. **No silent failure:** post-0.1, a missing/erroring notification table produces a logged `failed` (or `skipped`), never a swallowed catch.
3. **RLS-tested:** `notification_log` + `notification_preferences` (and the other three tables) have passing isolation tests.
4. **Editorial-only:** `components/notifications/editorial/*` mounted at the route; `components/v2/notifications/*` and v1 deleted; `tsc --noEmit` clean.
5. **Chokepoint honored:** every email send routes through the §2.6.2 deliverable-email resolver; shadows with no address yield `skipped_shadow`.

## Dependencies & out of scope

**Depends on:** Phase 0 §0.1 (bucket-A tables in prod — HARD), §0.4 (weekly-digest fix, schedule re-enable), spec [06](./06-auth-shadow.md) §6.2 (deliverable-email chokepoint + shadow `invite_email`), §3.1 RLS breadth.

**Out of scope:** signed/expiring unsubscribe tokens (`UNSUBSCRIBE_SECRET` — future); new notification types; non-email transports (SMS/push); the `cleanup-auth-events` cron and `auth_events` restoration (owned by Phase 0 §0.1/§0.4 — kept/restored); content/ProductionTab notifications (spec [09]).

---
created: 2026-07-18
updated: 2026-07-18
domain: Notifications & Email
tables: [notification_log, notification_queue, notification_preferences, in_app_notifications]
maturity: mixed
---

# Notifications & Email

## Purpose

Dual-channel notifications (in-app + email) triggered by core-loop events — lesson changes,
assignments, song mastery, student welcome — respecting per-user, per-type preferences and never
failing silently. In-app is the default channel for 15 of 17 types (durable feed + realtime bell);
email is reserved for `student_welcome` and `lesson_recap`, queued and retried via SMTP. Every
email funnels through the deliverable-email chokepoint so shadow profiles without an address are
skipped, not bounced.

## Data model

| Table                      | Role                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `notification_queue`       | Pending/scheduled sends: type, recipient, `template_data` jsonb, `scheduled_for`, `priority`, entity backlink     |
| `notification_log`         | Delivery audit trail: status (`pending/sent/failed/bounced/skipped/cancelled`), retry_count (max 5), error        |
| `notification_preferences` | Per-user × per-type `enabled` toggle; seeded on profile insert by `initialize_notification_preferences()` trigger |
| `in_app_notifications`     | The user-facing feed row: title/body/icon/variant, `is_read`/`read_at`, `action_url`, 30-day `expires_at`         |

**`notification_type` enum (17 values)**, grouped:

- **Lessons**: `lesson_reminder_24h`, `lesson_recap`, `lesson_cancelled`, `lesson_rescheduled`
- **Assignments**: `assignment_created`, `assignment_due_reminder`, `assignment_overdue_alert`, `assignment_completed`
- **Progress / milestones**: `song_mastery_achievement`, `milestone_reached`
- **Lifecycle**: `student_welcome`, `trial_ending_reminder`
- **Digests** (default **off**): `teacher_daily_summary`, `weekly_progress_digest`
- **System / admin**: `calendar_conflict_alert`, `webhook_expiration_notice`, `admin_error_alert`

**DB pipeline functions** (behavior, not DDL):

- `tr_notify_lesson_cancelled` / `tr_notify_lesson_completed` / `tr_notify_lesson_rescheduled` —
  triggers on `lessons` status/`scheduled_at` changes; build `template_data` (names, dates, songs
  worked on) and enqueue into `notification_queue` (recap delayed +1h at priority 5; cancel/
  reschedule immediate at priority 8).
- `tr_notify_song_mastery` — on `lesson_songs` → `mastered`; includes running mastered-song count.
- `tr_notify_student_welcome` — on `profiles` insert with `is_student` and not shadow, **and** on
  shadow→real claim (`is_shadow` true→false); priority 7.
- `get_pending_notifications(batch_size)` — batch-claims due queue rows joined to profile email,
  ordered by priority then age, `FOR UPDATE SKIP LOCKED` (safe for concurrent cron runs).
- `is_notification_enabled(user, type)` — preference lookup, defaults `true` when no row.
- `initialize_notification_preferences()` — seeds all 17 preference rows per new profile; the two
  digest types default to `false`, everything else `true`.
- Rate-limit / bounce stats: `get_system_email_count_last_hour()`, `get_user_email_count_last_hour(user)`
  (feed the email rate limiter), `get_bounce_stats()` (7-day bounce counts per type for monitoring).
- `update_notification_timestamp()` — `updated_at` maintenance on log/queue/preferences.

## Behavior & rules

1. **Enqueue** — DB triggers (above) or app code insert into `notification_queue`.
2. **Process** — `app/api/cron/process-notification-queue` (also run by the daily cron
   `dispatcher`) calls `lib/services/notification-queue-processor.ts`: claims a batch via the
   `get_pending_notifications` RPC, dedups by entity, retries failures with backoff.
3. **Route** — `lib/services/notification-service.ts` resolves the channel per send:
   preference check (`is_notification_enabled`), then `getDeliveryChannel()`
   (`lib/services/notification-helpers.ts`) → `email | in_app | both`. Default: email only for
   `student_welcome` + `lesson_recap`; in-app for the other 15.
4. **Student email kill switch** — unless `STUDENT_EMAILS_ENABLED=true`, student emails are
   downgraded to in-app and logged as skipped (`original_channel` preserved in the log).
5. **Deliverable-email chokepoint** — `getDeliverableEmail()` (`lib/email/recipient.ts`) is wired
   into both the service and the queue processor: shadow profiles with no real/invite email are
   logged `skipped`, never sent. (The divergence flagged in the superseded spec 08 is resolved.)
6. **Transport** — SMTP via `lib/email/smtp-client.ts` with `render-notification.ts` templates,
   `retry-handler.ts` (max 5 retries per `notification_log` row), `bounce-handler.ts`, and
   `lib/email/rate-limiter.ts` backed by the hourly-count RPCs.
7. **In-app delivery** — writes an `in_app_notifications` row; the bell subscribes over Supabase
   realtime; rows expire after 30 days.
8. **Monitoring** — `lib/services/notification-monitoring.ts` (failure rate, bounce rate, queue
   backlog, daily admin summary) runs from the cron dispatcher.

## UI surfaces

| Surface         | Route / component                                                                            | Status                                                           |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Inbox feed      | `/dashboard/notifications` → `components/notifications/editorial/NotificationsEditorial.tsx` | **mounted** (limit 30, mark read / mark all read)                |
| Topbar bell     | `components/notifications/NotificationBell.tsx` (+ `useNotifications.ts`, realtime)          | **mounted** globally in the app shell                            |
| Preferences     | `/dashboard/settings/notifications` → `components/settings/NotificationPreferences.tsx`      | **mounted** — linked from `SettingsEditorial` (settings page)    |
| Admin analytics | `app/api/admin/notification-analytics/route.ts`; `/dashboard/admin/notifications` page       | API exists; page is a "Coming soon" placeholder → **unbuilt** UI |

**Verification note (2026-07-18)**: the prior claim that `NotificationPreferences` was
built-unmounted is **stale** — `app/dashboard/settings/notifications/page.tsx` renders it and
`components/settings/editorial/SettingsEditorial.tsx` links to it. No mounting brief needed.

Known duplication: the inbox page (`notifications-queries.ts` + `app/actions/notifications.ts`)
and the bell (`app/actions/in-app-notifications.ts`) are two parallel read/mark paths onto the
same `in_app_notifications` table.

## Gaps & planned work

### NOT-1 — `delivery_channel` column absent; per-type channel preference silently inert

`getDeliveryChannel()` selects `notification_preferences.delivery_channel`, but the baseline
schema (and StrummyProd) has no such column — the query errors, is caught, and every send falls
back to `getDefaultDeliveryChannel()`. The prefs UI only writes `enabled`, so nothing is lost
today, but the code path is dead weight and blocks ever offering channel choice.

- **Files**: `lib/services/notification-helpers.ts`, `app/actions/notification-preferences.ts`,
  `components/settings/NotificationPreferences.tsx`, new migration on StrummyProd.
- **Approach** (decided in grill 2026-07-18): add
  `delivery_channel text NOT NULL DEFAULT 'email'` migration — **email-only defaults at launch**
  for all types (delivery guarantees ride on the proven Gmail SMTP chain; the in-app bell still
  shows items on login). Surface the channel picker in the prefs UI. Revisit `both` for
  reminders after observing student login frequency.
- **Acceptance**: unit test on `getDeliveryChannel` no longer relies on a swallowed error;
  `tests/e2e/notifications/prefs.spec.ts` still green.

### NOT-2 — consolidate the two in-app read/mark paths

Inbox and bell implement parallel queries + mark-read actions against `in_app_notifications`.
Fold onto one service (`app/actions/in-app-notifications.ts` is the more complete).

- **Files**: `lib/services/notifications-queries.ts`, `app/actions/notifications.ts`,
  `components/notifications/editorial/NotificationsEditorial.tsx`.
- **Acceptance**: both surfaces render + mark read via the single path;
  `tests/e2e/notifications/inbox.spec.ts` green; dead module deleted.

### NOT-3 — admin notification dashboard (parked)

`/dashboard/admin/notifications` is a placeholder while `notification-analytics` API and
`get_bounce_stats` exist. Parked — operator tooling, not student trust; backlog, not v1/v1.1.

## Test plan

- **E2E** (`docs/E2E_JOURNEYS.md`): `tests/e2e/notifications/inbox.spec.ts` (feed, mark read),
  `tests/e2e/notifications/prefs.spec.ts` (toggle persistence).
- **Integration (Jest)**: pipeline journeys (trigger → queue → processor → log) belong in the
  Jest integration layer with mocked SMTP, per E2E_JOURNEYS' backend-journey rule.
- **Unit**: channel routing (`notification-helpers`), chokepoint (`lib/email/recipient.ts`),
  retry/bounce handlers.

## Open questions

- ~~Should `lesson_reminder_24h` default to `both`?~~ — **resolved 2026-07-18: email-only at
  launch** (see NOT-1); revisit after observing login frequency.

## References

- Superseded: `docs/specs/08-notifications.md`, `docs/NOTIFICATIONS.md` (mechanics)
- Code: `lib/services/notification-{service,queue-processor,monitoring,helpers}.ts`, `lib/email/*`
- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (tables + `tr_notify_*` + queue RPCs)
- Related domains: lessons (02), assignments (06), identity/shadow chokepoint (01)

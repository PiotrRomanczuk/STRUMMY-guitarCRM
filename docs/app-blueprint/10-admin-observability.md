---
created: 2026-07-18
updated: 2026-07-18
domain: Admin & Observability
tables:
  [
    audit_log,
    audit_log_2026_01,
    audit_log_2026_02,
    audit_log_2026_03,
    audit_log_2026_04,
    audit_log_2026_05,
    audit_log_2026_06,
    audit_log_2026_07,
    audit_log_2026_08,
    audit_log_2026_09,
    audit_log_2026_10,
    audit_log_2026_11,
    audit_log_2026_12,
    audit_log_default,
    system_logs,
  ]
maturity: mixed
---

# Admin & Observability

## Purpose

Everything the operator (owner-admin) uses to watch and run the system: the persisted log stream,
the (legacy) unified audit log, the cron job fleet, and the admin route surface. This doc is
deliberately a **disposition map** — most of this domain is scaffolding around a solo-operated
production stack, not product.

## Data model — disposition table

| Table                                       | Disposition                 | Detail / action                                                                                                                                                                                                                                                      |
| ------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_log` (parent, partitioned by month)  | **dormant / legacy**        | Restored 2026-06-19 as legacy design. The `tr_audit_{lessons,assignments,profiles,song_progress}` trigger **functions** exist (jsonb old/new diffs via `jsonb_diff`), but **no trigger attaches them** in the baseline — nothing writes here. Keep; do not build on. |
| `audit_log_2026_01` … `audit_log_2026_12`   | **dormant** (12 partitions) | Monthly range partitions of the above; empty by construction.                                                                                                                                                                                                        |
| `audit_log_default`                         | **dormant**                 | Catch-all partition.                                                                                                                                                                                                                                                 |
| _(post-baseline drift)_ `audit_log_2027_01` | **dormant**                 | Auto-created on StrummyProd by the post-baseline `ensure_audit_partitions()` function. Not in the baseline file; expect it when diffing.                                                                                                                             |
| `system_logs`                               | **live**                    | Persisted warn/error stream (ADR 0003 Phase 2.5): level, prefix, message, request/user ids, context/error jsonb. Written by `lib/logger/supabase-destination.ts`; read by `app/api/admin/logs`.                                                                      |

**Superseded-by**: live audit actually flows to the per-domain `*_history` tables —
`lesson_history`, `assignment_history`, `user_history`, `song_status_history` — documented in
their own domain docs (02, 06, 01, 03). Reference those; don't duplicate here.

**Audit functions** (retained, currently unwired): `jsonb_diff(left, right)` returns the keys of
`left` whose values differ from `right` (used to store minimal old/new change sets);
`tr_audit_*` classify the action (`created/updated/deleted/status_changed/rescheduled/cancelled/
completed/role_changed`) and insert into `audit_log` with `auth.uid()` as actor.

**Known live drift vs baseline** (StrummyProd, out-of-band): functions
`ensure_audit_partitions()` and `refresh_song_matviews()` exist post-baseline; partition
`audit_log_2027_01` auto-created. Recorded in 00-overview §Schema truth.

## Behavior & rules

- **Logging** — unified pino logger (ADR 0003); warn/error entries are tee'd to `system_logs`
  via `lib/logger/supabase-destination.ts`. Admin read API: `app/api/admin/logs/route.ts`
  (no UI consumer yet — see ADM-1).
- **Legacy audit read** — `getAuditLogs()` in `app/dashboard/actions.ts` selects the latest
  `audit_log` rows (admin-only). Since nothing writes the table, it returns `[]`; treat as dead
  code tied to the legacy design.
- **Cron auth** — every `/api/cron/*` route validates `verifyCronSecret` (`lib/auth/cron-auth`).
- **Cron graceful degrade** — cron routes return 200 with an error payload rather than 500
  (no paging on known-degraded states); missing-table conditions are detected via
  `isMissingTableError` (`lib/services/db-error-helpers.ts`) and skipped.
- **Dispatcher pattern** — Vercel Hobby allows one cron, so `dispatcher` runs daily and invokes
  the other jobs in-process (day-of-week gating for weekly jobs); individual routes remain
  directly callable (e.g. from GitHub Actions for higher frequency). `vercel.json` additionally
  schedules 7 routes directly.

### Cron job catalog (14 routes in `app/api/cron/`)

| Job                          | Schedule (vercel.json)  | Does                                                                      |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `dispatcher`                 | (entry point, daily 06) | Runs all jobs below in-process; weekly jobs gated by day-of-week          |
| `drive-video-scan`           | daily 03:00             | Scan Drive for new videos → `song_videos` + admin notify (doc 09)         |
| `daily-report`               | daily 06:00             | Admin song report email (`sendAdminSongReport`)                           |
| `weekly-insights`            | Mon 09:00               | Weekly insight emails to teachers                                         |
| `renew-webhooks`             | daily 00:00             | Renew/cleanup expiring Google Calendar webhooks (doc 02)                  |
| `update-student-status`      | daily 02:00             | Recompute student activity/pipeline status (doc 01)                       |
| `weekly-digest`              | Sun 18:00               | Weekly progress digest emails (opt-in; doc 07)                            |
| `cleanup-auth-events`        | daily 03:30             | GDPR cleanup of auth events / rate-limit rows (doc 01)                    |
| `process-notification-queue` | via dispatcher / manual | Drain `notification_queue` + retry failed (doc 07)                        |
| `lesson-reminders`           | via dispatcher          | Enqueue `lesson_reminder_24h` notifications (doc 02/07)                   |
| `assignment-due-reminders`   | via dispatcher          | Enqueue `assignment_due_reminder` (doc 06/07)                             |
| `assignment-overdue-check`   | via dispatcher          | Flag overdue assignments + `assignment_overdue_alert` (doc 06/07)         |
| `admin-monitoring`           | via dispatcher          | Notification failure/bounce/backlog checks + daily admin summary (doc 07) |
| `calendar-sync`              | via dispatcher / manual | Poll all teachers' Google Calendars (`syncAllTeacherCalendars`) (doc 02)  |

## UI surfaces

Analytics/logs nav ids (`logs`, `song-stats`, `lesson-stats`, `chord-analysis`, `cohorts`) are in
`CORE_LOOP_HIDDEN_ITEMS` → nav-hidden; but every admin page below currently renders a
**"Coming soon" placeholder**, so the honest status is unbuilt-behind-a-route:

| Route                                                               | Status                                                                                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/admin/debug`                                            | placeholder — real panels exist in `components/debug/*` (AIGenerationsPanel, AIProviderPanel, AIQueuePanel, CronStatusPanel, DatabaseStatus, ServicesGrid) → **built-unmounted** |
| `/dashboard/logs`                                                   | placeholder — `system_logs` viewer **unbuilt** (API exists)                                                                                                                      |
| `/dashboard/admin/stats/{lessons,songs,chord-analysis}`             | placeholders — **unbuilt**                                                                                                                                                       |
| `/dashboard/admin/{spotify-connect,spotify-import,spotify-matches}` | placeholders — Spotify admin UIs **unbuilt** (doc 03 owns the pipeline)                                                                                                          |
| `/dashboard/admin/{notifications,drive-videos,documentation}`       | placeholders — **unbuilt** (docs 07 / 09 own the backends)                                                                                                                       |
| Admin home cards                                                    | `/dashboard` admin view (platform metrics, pending invites, role switcher) — **mounted** (doc 01)                                                                                |

## Gaps & planned work

### ADM-1 — system_logs viewer (v1-relevant: operator needs error visibility at cutover)

The only way to see persisted errors today is SQL. Replace the `/dashboard/logs` placeholder with
a minimal viewer over the existing API.

- **Files**: `app/dashboard/logs/page.tsx`, `app/api/admin/logs/route.ts` (already supports the
  read), new `components/admin/logs/` list component. Admin-gate via `getUserWithRolesSSR`.
- **Approach**: SSR table of latest 100 `system_logs` rows (level badge, prefix, message,
  occurred_at, expandable context/error jsonb), level + prefix filters via searchParams. No
  realtime, no pagination beyond "load more".
- **Acceptance tests**: admin sees seeded error rows; student/teacher hit the admin gate;
  Playwright smoke in `tests/e2e/smoke/` (journey list: `reference/E2E_JOURNEYS.md`).

### ADM-2 — drop or wire the legacy audit_log read (parked)

`getAuditLogs()` reads a table nothing writes. Either delete it (preferred — history tables are
the live audit) or attach the `tr_audit_*` triggers (not recommended; duplicate of `*_history`).
Parked — no user impact; fold into a schema-slim pass together with dropping the 14 partitions.

### ADM-3 — mount the debug dashboard (parked)

`components/debug/*` panels (cron status, AI provider/queue, DB status) are built but
`/dashboard/admin/debug` is a placeholder. Parked — operator convenience; ADM-1 covers the
cutover-critical need.

## Test plan

- **E2E**: admin surface smoke lives under `tests/e2e/smoke/` + §A2 of `reference/E2E_JOURNEYS.md`
  (admin dashboard cards). Cron routes are backend journeys → Jest integration layer with
  `verifyCronSecret` fixtures, not Playwright.
- **Unit**: logger destination (`lib/logger/*` tests), cron auth, dispatcher job-result
  aggregation.
- **Ops checks**: `/cron-debugger` skill for job execution history; dispatcher response body
  reports per-job `status`/`durationMs`.

## Open questions

- ~~Dispatcher vs systemd timers post-cutover~~ — **resolved 2026-07-18: dispatcher stays.**
  The app remains on Vercel after cutover (only the DB moves), so Vercel cron keeps working
  unchanged. Revisit only if the app itself ever moves off Vercel.
- Formal retention policy for `system_logs` (currently unbounded growth; no cleanup cron).

## References

- ADR: `docs/adr/2026-05-17-0003-unified-logger-pino-backend.md`
- Code: `app/api/cron/*`, `app/api/admin/*`, `lib/logger/*`, `components/debug/*`,
  `app/dashboard/actions.ts` (`getAuditLogs`)
- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (`audit_log*`, `system_logs`,
  `jsonb_diff`, `tr_audit_*`); drift notes in `00-overview.md` §Schema truth
- Live audit (the real one): `*_history` tables in docs 01, 02, 03, 06

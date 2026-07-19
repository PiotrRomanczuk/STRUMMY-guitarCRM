---
created: 2026-07-18
updated: 2026-07-18
domain: Lessons & Calendar
tables:
  [lessons, lesson_history, lesson_songs, user_integrations, webhook_subscriptions, sync_conflicts]
maturity: mixed
---

# Lessons & Calendar

## Purpose

The scheduling core of the app: a teacher creates lessons for students, attaches songs with
per-song learning statuses, marks lessons completed/cancelled, and — if Google-connected —
has every change mirrored to Google Calendar as a best-effort side-effect. Calendar sync is
deliberately modeled as a lesson concern (inbound events become lessons; outbound writes
follow lesson mutations), which is why the two share a doc. Lessons are also the bridge into
repertoire: attaching a song to a lesson creates/updates the student's repertoire row via
trigger (see 03).

Supersedes the former specs 02-lessons and 07-calendar (deleted 2026-07-18; git history). Both specs' headline
gaps (no editorial lesson form, calendar page a stub, conflicts UI nonexistent, webhook
unhardened) have since been built — verified against code 2026-07-18.

## Data model

| Table                   | Role                                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lessons`               | Teacher↔student lesson: `scheduled_at`, `status` (`SCHEDULED\|IN_PROGRESS\|COMPLETED\|CANCELLED\|RESCHEDULED`), `title`, `notes`, `lesson_teacher_number` (auto), `google_event_id`, soft `deleted_at`. CHECK `teacher_id <> student_id`. |
| `lesson_history`        | Trigger-written audit (`change_type`, jsonb before/after) of every lesson insert/update/delete.                                                                                                                                           |
| `lesson_songs`          | Junction lesson↔song with learning `status` (`to_learn → started → remembered → slow_tempo → with_author → mastered`), `notes`, back-pointer `repertoire_id`.                                                                             |
| `user_integrations`     | OAuth tokens per (`user_id`, `provider`) — Google today. `expires_at` in epoch-ms.                                                                                                                                                        |
| `webhook_subscriptions` | Google push channels: `channel_id`, `resource_id`, `expiration` (ms). One per connected user.                                                                                                                                             |
| `sync_conflicts`        | Local-vs-Google divergence awaiting a human: `conflict_data` jsonb, `status` (`pending\|resolved\|ignored`), `resolution` (`use_local\|use_remote`).                                                                                      |

Views: `lesson_counts_per_student` / `lesson_counts_per_teacher` / `v_teacher_lesson_trends`
(monthly completed/cancelled/scheduled, last 12 months) — all `security_invoker`.

### Triggers & functions (behavioral one-liners)

- `set_lesson_numbers` — BEFORE INSERT assigns the sequential `lesson_teacher_number` per teacher–student pair.
- `track_lesson_changes` → `lesson_history`; `tr_audit_lessons` → legacy `audit_log`.
- `tr_notify_lesson_cancelled` / `_completed` / `_rescheduled` — status transitions enqueue notifications (07 owns delivery); the DB, not the handler, owns these sends.
- `fn_sync_lesson_song_to_repertoire` — on `lesson_songs` insert/status-change, creates or advances the matching `student_repertoire` row (the lesson→repertoire bridge, see 03).
- `tr_notify_song_mastery` + `track_song_status_changes` — mastery notification + song-status history.
- `update_sync_conflicts_updated_at` — housekeeping.
- RLS shape: lessons SELECT admin-all / teacher `teacher_id = auth.uid()` / student `student_id = auth.uid()` (soft-deleted hidden); mutations admin/teacher only. `user_integrations` & `webhook_subscriptions` owner-only. `sync_conflicts` scoped via the owning lesson.

## Behavior & rules

### Lessons

- **Create/edit** run through server actions (`app/actions/lesson-edit.ts` →
  `createLessonAction`/`updateLessonAction`) called by the editorial form; API twins exist at
  `POST /api/lessons` / `PUT /api/lessons/[id]` (`withApiAuth`, admin/teacher only, non-admin
  may only set `teacher_id = self`).
- **Inline shadow create**: the form accepts a new student email instead of a `student_id`;
  `resolveStudent` matches by email — `NONE` creates a shadow profile, `AMBIGUOUS` returns an
  error flagged `ambiguous` for the UI to disambiguate. The lesson itself materializes the
  Teaches relationship. Claim/link semantics live in 01.
- **Status machine**: `SCHEDULED → IN_PROGRESS → COMPLETED | CANCELLED`; `RESCHEDULED`
  exists in the enum. Recap/cancel/reschedule notifications fire from DB triggers — handlers
  must not double-send.
- **Soft delete** only; all reads filter `deleted_at IS NULL`.
- **Recurring lessons**: `generateRecurringLessons` (`app/dashboard/lessons/recurring-actions.ts`
  over `lib/lessons/recurring-dates.ts`) exists but nothing calls it — built-unmounted (LES-3).
- **Code↔schema mismatch (broken routes)**: `app/api/lessons/templates/route.ts` queries
  `lesson_templates` and `app/api/lessons/schedule/route.ts` queries `teacher_availability` —
  neither table exists in the 62-table baseline, so both routes fail at runtime. Create
  migrations or delete the routes.

### Calendar sync (Google)

- **OAuth**: offline-access flow with refresh tokens stored in `user_integrations`
  (per-user, not per-device). Scope is full `calendar` (read/write/webhooks) — upgraded
  from `calendar.readonly`; anyone connected under the old scope must reconnect to grant
  write permissions.
- **Outbound is best-effort and never blocks the write**: `syncLessonCreation`/`syncLessonUpdate`
  (`lib/services/calendar-lesson-sync.ts`) silently return when the teacher has no
  integration; Google failures log and the lesson persists; success stores
  `google_event_id`. A shadow student with no deliverable email is skipped (warn-logged),
  reconciled after claim (01).
- **Inbound** arrives two ways: the push webhook (`POST /api/webhooks/google-calendar`) and
  the polling cron (`app/api/cron/calendar-sync/route.ts` plus a dispatcher step) calling
  `syncAllTeacherCalendars()` — polling covers teachers who never enable the webhook.
  Inbound events resolve students by attendee email (`resolveStudentAttendee`); ambiguous
  matches are skipped and logged, unknown emails can create shadows on the import paths.
- **Cron-limit gotcha**: `vercel.json` schedules only 7 cron routes (Vercel plan cap);
  calendar polling is **not** among them — it rides the `/api/cron/dispatcher` bundle, and
  `/api/cron/calendar-sync` exists for manual runs only.
- **Webhook channel expiry**: Google caps push channels at ~7 days. The daily
  `renew-webhooks` cron (`vercel.json`, `0 0 * * *`) runs `lib/services/webhook-renewal.ts`:
  renews subscriptions expiring <24h (sequentially, 1s apart, exponential backoff — avoids
  Google rate limits) and purges expired `webhook_subscriptions` rows. Webhook URLs must be
  HTTPS (`NEXT_PUBLIC_APP_URL`; ngrok in dev).
- **Conflicts**: when a lesson and its Google event diverge, a `sync_conflicts` row is
  written for manual resolution (`use_local`/`use_remote`) rather than last-write-wins.
  Edits landing < 60s apart (`simultaneousThresholdMs`,
  `lib/services/sync-conflict-resolver.ts`) are always flagged for manual review.
- **Claim reconcile**: after a shadow claim, `reconcileCalendarForStudent`
  (`lib/services/calendar-reconcile.ts`) swaps the attendee on the student's **future**
  events to the real email — per-event isolated, failures dead-letter to `system_logs`, the
  claim itself stays atomic.
- **Webhook hardening** (spec 07 §7.7 — shipped): secret required
  (`GOOGLE_CALENDAR_WEBHOOK_SECRET`); dev skip only via explicit
  `CALENDAR_WEBHOOK_SKIP_TOKEN=true`; `x-goog-resource-state` is parsed and unknown states
  are ignored with a warning.
- **Token refresh** (§7.5 — shipped): both the user-session and admin Google clients run
  `refreshTokenIfExpired` and persist refreshed tokens.
- **Disconnect** (§7.6 — shipped): `disconnectGoogle` (`app/dashboard/calendar-actions.ts`)
  wired to `IntegrationsSection`; revokes/stops/deletes so no orphan channel keeps POSTing.
- **Post-baseline drift relevant here**: shadow claim functions
  (`claim_shadow_profile`/`transfer_shadow_profile_references`) on live StrummyProd are what
  make "calendar attendee follows the claim" work end-to-end (details in 01/00-overview).

## UI surfaces

| Surface                                                                               | Route / component                                                                                   | Maturity                                                  |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Lessons list (status filter, sort, role-aware)                                        | `/dashboard/lessons` → `LessonsListEditorial`                                                       | mounted (nav "Lessons" / "My Lessons")                    |
| Lesson detail (repertoire card, notes, status)                                        | `/dashboard/lessons/[id]` → `LessonDetailEditorial`                                                 | mounted                                                   |
| Lesson create (student picker + new-email shadow, songs, schedule)                    | `/dashboard/lessons/new` → `LessonFormEditorial`                                                    | mounted                                                   |
| Lesson edit                                                                           | `/dashboard/lessons/[id]/edit` → `LessonFormEditorial` (edit mode)                                  | mounted                                                   |
| Calendar controls (connect/disconnect, historical bulk import w/ SSE, webhook enable) | `/dashboard/calendar` → `IntegrationsSection` + `HistoricalCalendarSync` + `CalendarWebhookControl` | nav-hidden (`calendar` in `CORE_LOOP_HIDDEN_ITEMS`)       |
| Conflict resolution (side-by-side diff, use-local/use-remote)                         | `/dashboard/calendar/conflicts` → `ConflictList` over `fetchPendingConflicts`/`resolveConflict`     | nav-hidden (reachable via calendar page)                  |
| Google connect on settings                                                            | `IntegrationsSection` also mounted on `/dashboard/settings`                                         | mounted                                                   |
| Live lesson mode                                                                      | `/dashboard/lessons/[id]/live`                                                                      | dormant stub ("Coming soon")                              |
| Lesson import page                                                                    | `/dashboard/lessons/import`                                                                         | dormant stub (real import lives on `/dashboard/calendar`) |
| Calendar grid/agenda view                                                             | — (the calendar page is controls-only; no month/week visual)                                        | unbuilt                                                   |
| Recurring-lesson creation UI                                                          | server action exists, no form field                                                                 | built-unmounted (action only)                             |

## Gaps & planned work

### LES-1 — Resolve the `/dashboard/lessons/[id]/live` stub

**Missing**: the route renders a "Coming soon" card. Live-lesson mode (teleprompter-style
in-lesson view) was always aspirational; a reachable placeholder breaks the trust-pass rule.
**Approach**: delete the route (grep for links first — `LessonDetailEditorial` may reference
it) and record live-mode as v1.1 aspirational here; do **not** build it now. **Files**:
`app/dashboard/lessons/[id]/live/page.tsx`, any `href` to `/live`. **Accept**: route gone,
no dangling links, lint+tests green.

### LES-2 — Delete the `/dashboard/lessons/import` stub

**Missing**: stub page duplicating what `/dashboard/calendar` (HistoricalCalendarSync)
actually does. **Approach**: delete or `redirect('/dashboard/calendar')`; grep for inbound
links. **Files**: `app/dashboard/lessons/import/page.tsx`. **Accept**: no reachable
"Coming soon" under lessons; redirect (if chosen) covered by a route test.

### LES-3 — Wire or drop recurring-lesson generation

**Missing**: `generateRecurringLessons` (weekly-cadence bulk insert with per-date
`syncLessonCreation`) has zero callers. The owner schedules weekly students by hand today.
**Approach**: smallest honest version — a "repeat weekly for N weeks" checkbox+count on
`LessonFormEditorial` (create mode only) that calls the existing action after validating
teacher/student; surface per-date failures. If the owner declines, delete
`recurring-actions.ts` + `lib/lessons/recurring-dates.ts` instead of carrying dead code.
**Files**: `components/lessons/editorial/form/LessonFormEditorial.tsx`,
`app/dashboard/lessons/recurring-actions.ts`. **Accept**: creating with repeat=4 yields 4
lessons with correct dates + numbers (integration test over the action); Google-connected
teacher gets 4 events; unchecked box behaves exactly as today.

### CAL-1 — Calendar visual view · **CUT (decision 2026-07-18)**

**Decided in grill**: Strummy gets no in-app visual calendar. **Google IS the calendar UI** —
every lesson syncs there, and the single teacher lives in Google Calendar already. The in-app
surface stays lessons-list + sync controls + conflicts; CAL-1 collapses into "keep sync
excellent". Revisit only if a second teacher (who may not use Google) ever onboards.

### CAL-2 — Un-hide the calendar entry + prove the conflict loop

**Missing**: everything under `/dashboard/calendar` is nav-hidden via
`CORE_LOOP_HIDDEN_ITEMS` and has **zero E2E coverage** (`reference/E2E_JOURNEYS.md` A8.1–A8.3 all
uncovered); the conflict-resolution UI has never been exercised against a real seeded
conflict. **Approach**: (1) add a seed helper that inserts a lesson + divergent
`sync_conflicts` row (extend `seed-factory` scenarios); (2) E2E: teacher opens
`/dashboard/calendar/conflicts`, sees the diff, resolves `use_local`, row leaves the list
and `status='resolved'`; (3) with A8.1+A8.2 green, remove `'calendar'` from
`CORE_LOOP_HIDDEN_ITEMS` (`components/navigation/menuConfig.ts`). Keep A8.3 (disconnect)
integration-level — it needs live OAuth. **Files**: `tests/e2e/teacher/calendar-*.spec.ts`
(new), seed scripts, `components/navigation/menuConfig.ts`. **Accept**: the two new specs
pass in CI; Calendar appears in the teacher nav; conflicts page shows a count-zero empty
state when clean.

### CAL-3 — Recurring-event import dedupe verification

**Missing** (verification, small): spec 07 §7.4 required per-instance ids as the
`google_event_id` dedupe key so a weekly Google series imports as N lessons, not 1;
`singleEvents: true` is set, but no test pins the per-instance behavior. **Approach**: unit
test over the import mapping in `lib/services/calendar-sync-service.ts` /
`calendar-bulk-import.ts` feeding two expanded instances of one recurring event; assert two
lessons with distinct `google_event_id`s; fix the key if it collapses. **Files**:
`__tests__` next to the services. **Accept**: the new test passes; no UNIQUE-collision path
remains.

## Test plan

- **E2E (existing)**: `tests/e2e/teacher/lessons-crud.spec.ts` (A4.1),
  `tests/e2e/teacher/lesson-song-status.spec.ts` (A4.3 partial),
  `tests/e2e/student/lessons-read.spec.ts` (B4.1–B4.3),
  `tests/e2e/cross-role/rls-data-isolation.spec.ts` (lesson isolation). Journey catalog:
  `reference/E2E_JOURNEYS.md` §A4, §A8, §B4.
- **E2E (missing per journeys)**: A4.2 inline shadow-create via UI (integration exists),
  A4.5 bulk endpoints, A4.6 calendar import UI, all of A8 (→ CAL-2).
- **Integration/unit**: `app/actions/__tests__/calendar-conflicts.test.ts`, calendar-sync
  service tests, `lessons.rls` assertions in the RLS suite; lesson-edit action tests cover
  shadow/ambiguous branches.
- Gap acceptance tests inline above; anything touching Google runs mocked at unit level and
  real only in the manual runbook (`92-launch-runbook.md`).

## Open questions

1. ~~Does Strummy need a visual calendar at all~~ — **resolved 2026-07-18: no** (see CAL-1).
2. **Webhook vs polling as the blessed path**: both exist; webhook channels expire and need
   renewal, polling is simpler but laggy. For the 5-student launch, is webhook worth its
   operational surface, or should polling-only be the documented default (webhook stays
   opt-in)?
3. **`RESCHEDULED` status semantics**: the enum value and the reschedule notification
   trigger exist, but the UI edits `scheduled_at` in place without ever setting the status.
   Keep the value (and set it on time-change), or treat time-edits as plain updates and
   retire the status?
4. **Conflict auto-resolution policy**: `autoResolveOldConflictsAction` exists — should aged
   pending conflicts auto-resolve (which side wins?) on a cron, or is a growing pending list
   acceptable until the teacher looks?

## References

- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (§lessons, §lesson_songs,
  §sync_conflicts, enums `lesson_status`/`lesson_song_status`, triggers
  `set_lesson_numbers`, `fn_sync_lesson_song_to_repertoire`, `tr_notify_lesson_*`)
- Superseded specs: `docs/specs/02-lessons.md` (deleted 2026-07-18; git history),
  `docs/specs/07-calendar.md` (deleted 2026-07-18; git history), `docs/INTEGRATIONS.md`
  (deleted 2026-07-18 — sync internals merged into this doc). Sync code: `lib/google.ts`,
  `lib/services/calendar-{lesson-sync,sync-service,reconcile}.ts`,
  `lib/services/webhook-renewal.ts`
- Auth/RLS mechanics: `docs/app-blueprint/reference/ARCHITECTURE.md`; shadow lifecycle + claim drift: 01 +
  `00-overview.md` §Schema truth
- Repertoire bridge (`fn_sync_lesson_song_to_repertoire` target tables): 03; notification
  delivery for lesson triggers: 07

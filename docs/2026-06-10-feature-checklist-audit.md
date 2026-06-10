# Feature & CRUD Checklist Audit — 2026-06-10

Functional audit of what Strummy does and doesn't do today (v0.140.0): CRUD coverage for
core objects per role, auth/shadow-user lifecycle, Google Calendar integration state, and
a test-coverage map with an improvement plan.

**Legend**: ✅ working · ⚠️ partial / backend-only · ❌ missing · 🔲 action item

---

## 1. CRUD Matrix — Core Objects

The recurring pattern across the whole app: **APIs, server actions, RLS, and role guards are
largely complete; the editorial dashboard UI is the bottleneck** (~12 pages are "Coming soon"
stubs in front of working backends).

### Songs

| Operation   | Admin                 | Teacher     | Student                  | Surface                                                                  |
| ----------- | --------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------ |
| Create      | ✅                    | ✅          | ❌ (by design)           | `POST /api/song`, form at `/dashboard/songs/new` (works)                 |
| Read list   | ⚠️ API only           | ⚠️ API only | ⚠️ assigned-only via RLS | `/dashboard/songs` **page is a stub**                                    |
| Read detail | ✅                    | ✅          | ✅ assigned              | `/dashboard/songs/[id]` (`SongDetailEditorial`)                          |
| Update      | ⚠️                    | ⚠️          | ❌                       | `PUT /api/song` works; edit page stub but `SongEditFormEditorial` exists |
| Delete      | ✅ soft + cascade RPC | ✅          | ❌                       | `soft_delete_song_with_cascade`, bulk via `/api/song/bulk`               |

- 🔲 Wire songs list page to existing API (`/dashboard/songs`)
- 🔲 Mount `SongEditFormEditorial` on the edit route

### Lessons

| Operation   | Admin                          | Teacher           | Student                         | Surface                                                                     |
| ----------- | ------------------------------ | ----------------- | ------------------------------- | --------------------------------------------------------------------------- |
| Create      | ⚠️ API only                    | ⚠️ API only       | ❌                              | `POST /api/lessons`; `/dashboard/lessons/new` **stub**; Google import works |
| Read list   | ✅ all                         | ✅ own            | ✅ own (`/api/student/lessons`) | `LessonsListEditorial` works                                                |
| Read detail | ✅                             | ✅                | ✅                              | `LessonDetailEditorial` works                                               |
| Update      | ⚠️ API only                    | ⚠️ API only (own) | ❌                              | `PUT /api/lessons/[id]`; edit page **stub**                                 |
| Delete      | ✅ soft, cascades lesson_songs | ✅ own            | ❌                              | single + `/api/lessons/bulk`                                                |

- 🔲 Build lesson create form (today the only practical create path is Google Calendar import)
- 🔲 Build lesson edit page

### Assignments

| Operation   | Admin       | Teacher                         | Student                                              | Surface                                                               |
| ----------- | ----------- | ------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Create      | ⚠️ API only | ⚠️ API only (self-assign guard) | ❌ (by design)                                       | `POST /api/assignments` validates student+lesson, queues notification |
| Read list   | ✅          | ✅ own                          | ✅ own                                               | `AssignmentsListEditorial` works                                      |
| Read detail | ❌ UI       | ❌ UI                           | ❌ UI                                                | API exists; `/dashboard/assignments/[id]` **stub**                    |
| Update      | ⚠️ API only | ⚠️ API only                     | ✅ **status only** (`updateAssignmentStatus` action) | edit page **stub**                                                    |
| Delete      | ✅          | ✅ own                          | ❌                                                   | soft delete                                                           |

- 🔲 Assignment create/detail/edit pages — entire assignment UI beyond the list is missing
- 🔲 Student-facing status control: confirm it's reachable in current student dashboard

### Repertoire (`student_repertoire`)

| Operation | Admin/Teacher                          | Student                                 | Surface                          |
| --------- | -------------------------------------- | --------------------------------------- | -------------------------------- |
| Create    | ⚠️ implicit via lesson_songs + trigger | ❌                                      | no direct create endpoint        |
| Read      | ⚠️ RLS direct query                    | ⚠️ `getStudentRepertoireSongs()` action | `/dashboard/repertoire` **stub** |
| Update    | ⚠️ RLS only, no action/API             | ✅ own notes + difficulty rating (RLS)  | no UI                            |
| Delete    | ⚠️ RLS only                            | ❌                                      | no UI                            |

- 🔲 Repertoire has **no dedicated API/actions layer** — all access is raw RLS-gated queries.
  Decide: build thin server actions, or accept RLS-direct as the pattern and document it.
- 🔲 Deprecated `student_song_progress` table still exists alongside — schedule removal
- 🔲 Document the lesson_songs → student_repertoire sync mechanism (trigger-based, undocumented)

### Practice Sessions

| Operation     | Student                          | Teacher/Admin      | Surface                               |
| ------------- | -------------------------------- | ------------------ | ------------------------------------- |
| Create        | ✅ `logPracticeSession()` action | ❌                 | trigger updates repertoire aggregates |
| Read history  | ❌ **no UI, no endpoint**        | ⚠️ aggregates only | `/dashboard/practice` doesn't exist   |
| Update/Delete | ❌ immutable by design           | ❌                 | —                                     |

- 🔲 Students can log practice but **never see their history** — biggest student-facing gap
- 🔲 Decide if immutability is intended (a typo'd 480-min session is permanent today)

### Users / Profiles

| Operation   | Admin                                 | Teacher                  | Student                          | Surface                                 |
| ----------- | ------------------------------------- | ------------------------ | -------------------------------- | --------------------------------------- |
| Create      | ✅ form + API (incl. shadow + invite) | ⚠️ via users API         | ❌                               | `/dashboard/users/new` works            |
| Read list   | ⚠️ API only                           | ⚠️ API (linked students) | ✅ own profile                   | `/dashboard/users` **stub**             |
| Read detail | ⚠️ API only                           | ⚠️                       | ✅ own                           | detail page **stub**                    |
| Update      | ⚠️ API only (roles, status)           | ⚠️ limited               | ⚠️ own via API, **no edit form** | edit page **stub**                      |
| Delete      | ✅ hard (auth user + cascade)         | ❌                       | ❌                               | inconsistent with soft-delete elsewhere |

- 🔲 Users list/detail/edit pages
- 🔲 Student self-service profile editing
- 🔲 Reconsider hard-delete for users (songs/lessons/assignments all soft-delete)

### Cross-cutting CRUD issues

- 🔲 Multi-role users are storable (`is_admin`/`is_teacher`/`is_student` booleans) but UI logic
  assumes single role in places (`isStudent && !isTeacher && !isAdmin`)
- 🔲 Some student filtering happens in route handlers rather than RLS — RLS tests would prove
  defense-in-depth (see §5)
- 🔲 Routed pages use `components/*/editorial/*`; `components/` v1 and `components/v2/` both
  still ship — three component generations coexist

---

## 2. Auth & Authorization

### Working today ✅

- [x] Sign-up: Zod validation → disposable-email check → rate limit (3/h per IP+email) →
      `auth.signUp` → event logging (`app/auth/actions.ts`)
- [x] Email confirmation via `/auth/callback` code exchange
- [x] Sign-in with rate limiting (10/15min), account lockout (5 fails → 30 min,
      `profiles.failed_login_attempts`/`locked_until`)
- [x] Password reset flow with rate limiting
- [x] Auth event logging to `auth_events` (16+ event types, IP capture)
- [x] Middleware path-gating to `/sign-in`; role enforcement at API layer
      (`withApiAuth` + `loadAuthedProfile`, request-memoized) and RLS
      (`is_admin()`/`is_teacher()`/`is_student()` SQL helpers)
- [x] API keys: `gcrm_` prefix, SHA256-hashed in `api_keys`, `last_used_at` tracking
- [x] Cron auth via `CRON_SECRET` bearer (`lib/auth/cron-auth.ts`)
- [x] Onboarding: role guard → goals/skill/style form → `completeOnboarding()` sets
      `is_student=true`

### Gaps / action items

- [ ] 🔲 **Bearer auth fragmentation**: `lib/bearer-auth.ts` (old) duplicates
      `lib/auth/api-auth.ts::authenticateRequest()` — routes use different patterns
      inconsistently (the "broken on 111 routes" finding). Consolidate on `withApiAuth`,
      delete `lib/bearer-auth.ts`.
- [ ] 🔲 **MFA half-built**: sign-in returns `{ mfaRequired, factorId }` but there's no MFA
      verification UI — users with factors enrolled hit a dead end
- [ ] 🔲 **Google OAuth sign-in incomplete**: `/api/auth/google` redirects, but the callback
      only handles integration tokens, not auth sign-in
- [ ] 🔲 No admin UI to view/unlock locked accounts (auto-unlock after 30 min only)
- [ ] 🔲 Verify `check_auth_rate_limit` RPC exists on remote (migration drift risk)
- [ ] 🔲 Middleware relies on `autoRefreshToken` — validate config to avoid random logouts
- [ ] 🔲 Onboarding has **three UI variants** (v1 `OnboardingForm`, v2, Stitch) selected via
      `lib/ui-version.server.ts` — pick one, delete two

---

## 3. Shadow Users → Real Users

### Lifecycle as implemented ✅

1. **Creation** (3 paths, all deduped through `matchStudentByEmail()` + unique partial index
   on `profiles(invite_email)`):
   - [x] Admin user form (`is_shadow=true`, random UUID, `shadow_<uuid>@placeholder.com`)
   - [x] Google Calendar import (unmatched attendees become shadows)
   - [x] Inline lesson-form picker ("Create shadow for …")
2. **Linking on sign-up** — `handle_new_user()` trigger
   (`20260425000002_rewrite_handle_new_user_trigger.sql`):
   - [x] Match priority: real profile by email → shadow by `invite_email` → shadow by email
   - [x] `transfer_shadow_profile_references()` moves all FKs (lessons, assignments,
         repertoire…), handles unique-constraint collisions, returns per-table counts
   - [x] New profile created with `id = auth.user.id`, shadow deleted,
         `shadow_link_completed` logged
3. **Manual linking** — [x] `POST /api/admin/link-shadow-user` (admin)

### Gaps (most are specced in ADR `docs/adr/2026-05-17-0002-shadow-students-…`)

- [ ] 🔲 **Invite flow never built**: `invite_email` column exists but no UI sets it, and
      `supabase.auth.admin.inviteUserByEmail()` is never called. Today students must sign up
      with a matching email by out-of-band coordination. **Highest-value missing piece.**
- [ ] 🔲 **Emails silently sent to placeholder addresses**: lesson reminders / assignment
      notices / summaries go to `shadow_<uuid>@placeholder.com` with no teacher visibility.
      Implement `getDeliverableEmail(profile)` chokepoint (`invite_email` for shadows, else
      skip + log).
- [ ] 🔲 Calendar events created with placeholder attendee email; no reconciliation after
      linking (ADR proposes an async reconcile queue)
- [ ] 🔲 No stale-shadow cleanup (ADR: archive after 90 days inactivity)
- [ ] 🔲 Duplicate shadows possible from concurrent imports before the dedup index existed —
      audit for orphans once

---

## 4. Google Calendar Integration

### Working ✅

- [x] OAuth connect from settings (`calendar` + `userinfo.email` + `drive.file` scopes),
      tokens in `user_integrations`, auto-refresh in admin/cron context
- [x] **Manual bulk import** (`POST /api/calendar/sync/stream`, SSE progress): month-chunked,
      Calendly-marker filter, dedup by `google_event_id`, shadow-student creation,
      past→COMPLETED / future→SCHEDULED
- [x] **Strummy → Google**: lesson create/update/delete all sync
      (`lib/services/calendar-lesson-sync.ts`), graceful 404/410 handling
- [x] **Webhook handler** (`/api/webhooks/google-calendar`): token validation, channel→user
      mapping, background sync of −7/+30 day window
- [x] **Webhook renewal cron** (daily, well-tested in `webhook-renewal.test.ts`)
- [x] **Conflict engine**: detection, last-write-wins with 60s manual-review threshold,
      `sync_conflicts` table, auto-resolve after 7 days

### Gaps / action items

- [ ] 🔲 **UI is dark**: `CalendarWebhookControl.tsx` and `HistoricalCalendarSync.tsx` are
      built but **mounted nowhere**; `/dashboard/calendar` is a stub. Users cannot enable
      webhooks or run bulk import from the UI. Wiring these is cheap and unlocks the whole
      feature.
- [ ] 🔲 No conflict-resolution UI (backend fully implemented)
- [ ] 🔲 `syncAllTeacherCalendars()` exists but no cron calls it — teachers without webhooks
      never auto-sync
- [ ] 🔲 **Recurring events not expanded** — a weekly recurring lesson imports as one event
- [ ] 🔲 Token refresh only in admin context; user-session `getGoogleClient()` doesn't check
      expiry → silent failures possible
- [ ] 🔲 No disconnect/deauth flow (tokens persist after Google-side revoke)
- [ ] 🔲 No incremental sync tokens (window-based fetch can miss events)
- [ ] 🔲 Webhook token validation skipped entirely in dev; only first non-teacher attendee
      becomes the student (multi-attendee unhandled)

---

## 5. Test Coverage Map

~100 active unit/integration tests + 25 E2E specs; **61 quarantined suites** excluded in
`jest.config.ts` (~lines 104–168).

| Domain                                         | Unit/Integration                                | E2E        | Verdict                            |
| ---------------------------------------------- | ----------------------------------------------- | ---------- | ---------------------------------- |
| Songs CRUD                                     | ✅ 9 active                                     | ✅ 4 specs | Well-tested                        |
| Assignments CRUD                               | ✅ 6 active                                     | ✅ 4 specs | Well-tested                        |
| Auth actions (sign-in/up, lockout, rate-limit) | ✅ 5 active                                     | ✅ 4 specs | Well-tested                        |
| Dashboards (3 roles)                           | ✅ 8 active                                     | ✅ 3 specs | Well-tested                        |
| Users/roles/permissions                        | ✅ 7 active                                     | ✅ 2 specs | Well-tested                        |
| Lessons CRUD                                   | ✅ 7 active (11 quarantined)                    | ✅ 4 specs | Partial                            |
| Google Calendar                                | ✅ 4 integration                                | ❌ none    | Partial — no E2E                   |
| Practice/repertoire                            | ✅ 5 active                                     | ⚠️         | Partial                            |
| AI agents                                      | ✅ 3 active                                     | ✅ 3 specs | Partial (history untested)         |
| Shadow user linking                            | ⚠️ creation only; merge test is `describe.skip` | ❌         | **Effectively untested**           |
| In-app notifications                           | ❌ (preferences only)                           | ❌         | **Untested**                       |
| Email workflows (weekly insights cron)         | ❌                                              | ❌         | **Untested**                       |
| Onboarding                                     | ⚠️ action-level only                            | ❌         | Untested E2E                       |
| RLS policies                                   | ⚠️ 1 smoke test (lessons)                       | —          | **Critical gap — 1/7 core tables** |
| Auth form components                           | ❌ 8 files quarantined                          | —          | Untested                           |

### Improvement plan (priority order)

**P0 — security & data integrity**

- [ ] 🔲 RLS tests for `assignments`, `profiles`, `practice_sessions`, `student_repertoire`
      (extend `jest.config.rls.ts` harness; proves teacher isolation + student self-only)
- [ ] 🔲 Shadow-linking test: shadow with lessons/assignments → sign-up with matching email →
      assert FK transfer counts and shadow deletion (un-skip the existing `describe.skip`)
- [ ] 🔲 Email verification journey E2E (sign-up → confirm → dashboard)

**P1 — critical features with zero coverage**

- [ ] 🔲 Calendar sync E2E (or at minimum a wired integration test: import → lessons +
      shadows created → conflict path)
- [ ] 🔲 In-app notification delivery (create → read/unread → batch)
- [ ] 🔲 Weekly-insights cron test (it's one of the crons known to 500)
- [ ] 🔲 Onboarding E2E (sign-up → form → `is_student=true` → dashboard)

**P2 — restore signal**

- [ ] 🔲 Fix Jest `testPathIgnorePatterns` worktree collision (~30 min, from May audit)
- [ ] 🔲 Triage 61 quarantined suites: un-rot the 8 auth-form tests first, delete tests for
      components that no longer exist
- [ ] 🔲 Dedupe `__tests__/` vs colocated duplicate pairs (5–7 known)
- [ ] 🔲 Add `@smoke` Playwright subset to PR CI (E2E currently runs only on `production`)

---

## 6. The One-Screen Summary

**What Strummy genuinely does today**: full backend CRUD for songs/lessons/assignments/users
with sound RLS + role guards; lesson/assignment list & detail UI; song create/detail UI;
robust sign-up/sign-in with lockout, rate limiting, and event logging; a sophisticated
shadow-student system that auto-merges on sign-up; Google Calendar bulk import and
bidirectional lesson sync with webhook infrastructure; AI agents; notification/email queues.

**What it doesn't do (yet)**: show most of that in the UI. The stub pages (songs list,
lesson/assignment create-edit, users, repertoire, practice history, calendar) and the
unmounted calendar components are the gap between "backend done" and "feature shipped".
The shadow-user invite flow and MFA verification are the two half-built flows that can
strand real users. Testing is strong exactly where the UI works (songs, assignments, auth,
dashboards) and absent where the risk is highest (RLS breadth, shadow merge, calendar,
notifications).

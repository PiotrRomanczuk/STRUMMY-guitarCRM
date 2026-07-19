---
created: 2026-06-16
updated: 2026-06-16
---

# Strummy — Testing

The single living reference for testing Strummy. For where testing fits in the merge gates, see [../91-testing-strategy.md](../91-testing-strategy.md).

---

## Philosophy & Pyramid

Test-first where practical (red → green → refactor). Push coverage down the pyramid: most behavior is verified cheaply at the unit/integration layer; E2E is reserved for critical, browser-dependent user flows.

```
        E2E (Playwright)   ~10%  — critical journeys, real browser
     Integration (Jest)    ~20%  — handlers + mocked Supabase
  Unit (Jest)              ~70%  — business logic, utils, schemas
```

- **Unit (Jest)** — pure logic in `/lib`, schema validation, helpers, components. Mock external dependencies. Fast (<50ms each).
- **Integration (Jest)** — call API route handlers and server actions directly with mocked Supabase via `createMockQueryBuilder` / `createMockAuthContext` from `lib/testing/integration-helpers.ts`. Covers CRUD, validation, access control.
- **E2E (Playwright)** — real browser against a running app. **Playwright is the only E2E tool.** Reserve for flows that genuinely need a browser; default a journey's scenarios to the integration layer.

> **Cypress is removed** (retired 2026-07, commit `fda52ea7`). Any `cy.*` commands, `cypress.config.ts`, `npm run cypress:*`, or `*.cy.ts` specs in older docs are historical — do not write new Cypress tests.

Target: 70% coverage on new code, focused on `/lib` business logic. Critical paths covered E2E.

---

## Commands

```bash
# Unit (Jest)
npm test                 # all unit suites
npm test -- --watch      # watch mode
npm run test:coverage    # with coverage report

# Integration (Jest, mocked Supabase)
npm run test:integration
npm run test:integration -- --testPathPatterns="lessons/__tests__/route.integration"

# All Jest (unit + integration)
npm run test:all

# RLS (real Supabase, serial)
npx jest --config jest.config.rls.ts

# E2E (Playwright)
npx playwright test
npx playwright test teacher-full-journey      # single spec
npm run test:pw:security                       # security suite (--grep @security)

# Test data cleanup (manual)
npm run test:cleanup
```

Config files: `jest.config.ts` (unit), `jest.config.integration.ts` (integration), `jest.config.rls.ts` (RLS, serial against real Supabase), `playwright.config.ts` (E2E + global teardown), `jest.setup.js` (mocks). Tests live in `/__tests__` mirroring source structure.

---

## Test Infrastructure

### Seed / cleanup / teardown

E2E tests create data tagged with recognizable patterns (timestamps + `E2E`/`Teacher`/`security-test-` prefixes) so it can be swept afterward.

- **Helper**: `tests/helpers/cleanup.ts` — pattern-matches test data by title/artist/name/email and deletes across all tables in FK-safe order: assignment templates → assignments → AI conversations (cascades messages) → songs → lessons → pending students → users (cascades practice sessions, song progress, lessons, assignments) → orphaned practice sessions / song progress.
- **Global teardown**: `tests/global-teardown.ts`, wired via `globalTeardown` in `playwright.config.ts`. Runs automatically after the Playwright suite.
- **Manual**: `scripts/cleanup-test-data.ts` (`npm run test:cleanup`) with a 3s abort countdown. Use after interrupted/failed runs or on a polluted DB.

Recognized patterns (see `TEST_PATTERNS` in `cleanup.ts`):

| Entity                  | Match examples                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Songs                   | `E2E Song {ts}`, `Teacher Song {ts}`, titles ending `EDITED`/`UPDATED`; artists `E2E Test Artist`, `Teacher Test Artist` |
| Lessons                 | `E2E Lesson {ts}`, `Teacher Lesson {ts}`, `Test Lesson {ts}`; notes `E2E Test lesson notes`                              |
| Assignments / Templates | `E2E Assignment {ts}`, `E2E Template {ts}`, `Teacher …`, `Test …`                                                        |
| Users                   | `e2e.{role}.{ts}@example.com`, `test.{ts}@example.com`; first names starting `E2E`                                       |
| Pending students        | `e2e.pending.{ts}@example.com`, `test.pending.{ts}@example.com`                                                          |
| AI conversations        | titles starting `E2E Test Conversation`, `Test AI Conversation`                                                          |

**Rules**: always timestamp test data (uniqueness); follow established naming so auto-cleanup catches it; run `npm run test:cleanup` after failed runs; in CI add a cleanup step with `if: always()`. Cleanup reads Supabase creds from `.env.local` (service role key preferred for delete permissions).

### Integration helpers

`lib/testing/integration-helpers.ts` provides `createMockQueryBuilder` (chainable Supabase query mock) and `createMockAuthContext` (admin / teacher / student / unauthenticated). Handlers are invoked directly — no HTTP server.

---

## RLS Testing

RLS policies are validated against a **real local Supabase** instance, run **serially** via `jest.config.rls.ts` (parallel runs collide on shared DB state). This is the authoritative layer for multi-tenant isolation — it cannot be bypassed by API bugs. See **ADR-0001** for the rationale (real DB over mocks for security-critical policies).

Policies live in `supabase/migrations/022_rls_policies.sql`. Multi-teacher isolation that's awkward to drive through a browser is verified here or at the integration layer rather than E2E.

---

## Known Limitations

### API-route handlers using Next.js request context

Route handlers that call Next.js `cookies()` / `headers()` (e.g. via `createClient()` from `@/lib/supabase/server`) fail in Jest with:

```
`cookies` was called outside a request scope
```

Affected: `app/api/spotify/track-from-url/route.ts` and any route using server-context Supabase client creation.

**Tested**: business logic (`lib/api-keys.ts`, `lib/auth/api-auth.ts` helpers), components, integration tests with mocked Supabase, E2E with Playwright.
**Not unit-tested**: route handlers that depend on server request context. Cover these via E2E (real HTTP) instead. Proper unit coverage would need a Next.js test env with request context or a full `next/headers` mock.

---

## Known Issues (audit 2026-06-16)

Full findings: former `docs/audits/2026-06-16-test-cicd-audit.md` (deleted 2026-07-18; git history). Remediation: [`../91-testing-strategy.md`](../91-testing-strategy.md). Measured state on 2026-06-16:

| Area             | State                                                                                                          | Severity |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- | --- |
| **Unit suite**   | green (2,681/2,682) **only because ~51 files are quarantined** via `testPathIgnorePatterns`                    | S1       |
| **Integration**  | **16 failing** (`__tests__/api/song/export.integration.test.ts` + 1 — Supabase client `undefined`)             | S2       |
| **RLS**          | the only `*.rls.test.ts` is `describe.skip` — **0 RLS tests run** (ADR-0001 unverified)                        | S1       |
| **Coverage**     | **53% lines** (goal 70%); CI check is **non-blocking**; jest thresholds 30–40%; README says 70%                | S2       |
| **CI typecheck** | `tsc --noEmit` output **filtered with `grep -v`** + `                                                          |          | true` — real type errors pass the gate | S1  |
| **E2E**          | Playwright runs **only on `production` pushes** (Desktop Chrome); never gates `main`/PRs                       | S1       |
| **Hooks**        | pre-commit runs the full `npm run quality` (typecheck+lint+jest+coverage+DB+Lighthouse) → multi-minute commits | S2       |
| **Lint**         | `@typescript-eslint/no-explicit-any` is `warn` (not `error`); ~37 prod `any`s                                  | S2       |
| **Dead code**    | `cypress/` still present; `jest.config.simple.ts` unused                                                       | S3       |

> **The suite is green by exclusion.** Treat the all-pass unit result with suspicion until the quarantine is burned down (spec 11, Phase 11B) and RLS/integration are honest (Phase 11A).

---

## Security Test Patterns

Security tests verify **teacher data isolation** (multi-tenant): a teacher must only reach their own students and lessons.

- **Suite**: `tests/e2e/security/teacher-isolation.spec.ts` (Playwright, `@security` tag).
- **Setup** (`beforeAll`, Supabase admin client): 2 teachers, 3 students, 2 lessons; all rows prefixed `security-test-`.
  ```
  Teacher 1 → Student 1, Student 2 → Lesson 1
  Teacher 2 → Student 1            → Lesson 1
  ```
- **Categories**: API endpoint isolation (student list, lesson list, direct lesson access by ID, cross-teacher modify/delete), dashboard UI isolation, cross-teacher operations (creating a lesson for another teacher's student).
- **Run**: `npm run test:pw:security` (or `... -g "VULNERABILITY"`). Requires local Supabase running and `.env.local` with anon + service-role keys.

**Defense in depth**: (1) DB RLS (`022_rls_policies.sql`) — authoritative, (2) API handler filtering — must mirror RLS, (3) frontend — never trust client filtering alone.

**Reference patterns**:

- _Secure_: `app/api/lessons/handlers.ts` filters teacher queries to `getTeacherStudentIds()` and backstops with `lessons_select_teacher` RLS (`teacher_id = auth.uid()`).
- _Filter-by-relationship_: scope a teacher to their students by collecting `student_id`s from lessons they teach, then `.in('id', studentIds)` on profiles — rather than relying on role alone.

When a security test documents a known gap, it asserts the current (leaky) behavior; flip the assertion the moment the fix lands.

---

## E2E Test Plans by Journey

Per-journey plans. Most scenarios are covered at the integration layer (Jest); the **E2E** column lists only what runs in a real browser. Auth helpers: `tests/fixtures/auth.fixture.ts`. E2E data uses `data-testid` selectors and timestamped names.

### Teacher — Lessons (P0)

- **Integration** (`app/api/lessons/__tests__/route.integration.test.ts`): create (valid → 201; missing student/teacher/scheduled_at → 400; student → 403), update (notes/status → 200; `handleLessonSongsUpdate` inserts `status: to_learn`; `RESCHEDULED` rejected by Zod), delete (soft-delete sets `deleted_at`, never hard delete; student → 403; unauth → 401), access control (teacher scoped via `.in(student_id)`; admin sees all; unauth list → 401), utils (`prepareLessonForDb` merges date+time → `scheduled_at`, strips undefined; `transformLessonData` splits/preserves), recap email (`sendLessonSummaryEmail` → `lesson_recap` + cancels queue; missing lesson → error).
- **E2E** (`tests/e2e/teacher-full-journey.spec.ts`): (1) **Create happy path** — create lesson with 2 songs, verify detail (title/student/notes/songs, lesson #), edit → "Save Changes" → notes updated. (2) **Live Mode** — start lesson, advance song statuses on StatusStepper (to_learn → started → mastered, skips allowed), autosave notes (2000ms debounce → "Notes saved"), end lesson (no status change). (3) **Delete with confirm** — delete → accept `confirm()` → gone from list.
- **Known gaps**: lesson form shows ALL students (list page scopes correctly); no date-range filter, duplicate detection, teacher auto-fill, or "Complete Lesson" in Live Mode; repertoire forward-sync trigger untested (needs local Supabase).

### Teacher — Google Calendar (P0 OAuth / P1 Import, Webhook)

Three separate features (≤10 E2E each). CI uses a dedicated Google test account (creds in CI secrets); webhook tests create/update/delete events via the Google Calendar API and **poll every 2s up to 30s** (no fixed waits).

- **Design**: Calendly metadata identifies lesson events (no keyword matching); full `calendar` read/write scope; primary calendar only; 28-day display window (±14d); strict-email student matching else shadow student; times stored UTC; 429 → exponential backoff; soft-delete (mark `cancelled`) on event delete; webhook auth via `X-Goog-Channel-ID` + `X-Goog-Channel-Token`.
- **J5 OAuth**: disconnected state → "Connect" → consent (scopes incl. `calendar.events`) → connected badge, Calendly-only events shown. Edge: deny consent → error + stays disconnected; token expiry → silent refresh; disconnect/reconnect.
- **J6 Import** (`/dashboard/lessons/import`): pick range → SSE streaming progress (per-event `created` / `shadow_created` / `skipped`), lessons get `google_event_id`. Re-import dedups by `google_event_id`; locally-edited lessons flag a conflict. Edge: cancel mid-import keeps partial (server continues), no-attendee event imports unassigned, 429 backoff, tab-close continues server-side.
- **J7 Webhook** (`/api/webhooks/google-calendar`): enable live sync → `webhook_subscriptions` row; API create/update/delete events auto-sync (create links student, update keeps same id, delete soft-cancels); stop sync halts updates. Edge: cron auto-renews before 7-day expiry; duplicate-enable is no-op; spoofed/invalid token → 401; unknown attendee → shadow student.
- **Integration** (26 tests, `__tests__/lib/google-calendar-*.integration.test.ts`): `timeMin`/`timeMax` range, invalid webhook token → 401, conflict detect/resolve, full `calendar` scope. Multi-teacher isolation verified here via RLS, not E2E.

### Teacher — Assignments (P0 CRUD / P2 Templates)

- **Integration** (`app/api/assignments/__tests__/route.integration.test.ts`, 43 scenarios) covers all CRUD + templates; **no E2E** (fully covered at integration layer).
- **J8 CRUD** (`/dashboard/assignments`): list (title/student/status/due, status filter not_started|in_progress|completed|overdue) → create (validate required title) → detail → edit → delete. Overdue auto-detected by `assignment-overdue-check` cron.
- **J9 Templates** (`/dashboard/assignments/templates`): create template → pre-fill a new assignment from it → delete. Teacher sees only own templates.

### Teacher/Admin — Integrations (P1)

Both covered at integration layer; **no E2E**.

- **J10 Spotify match review** (`/dashboard/admin/spotify-matches`): pending matches (title/track/artist/confidence/art) → approve (sets `spotify_link_url`) / reject (leaves empty); re-scan via SSE. Matches ≥85% confidence auto-apply and never appear in review.
- **J11 Song of the Week** (admin): set song + teacher message (≤500 chars) + `active_until` → shows on dashboard → deactivate / replace. DB constraint: at most one `is_active = true`. Integration: `app/actions/__tests__/song-of-the-week.integration.test.ts` (30).

### Teacher/Admin — User Management (P0 Invite / P1 Shadow / P2 Pipeline)

Covered at integration layer (`app/api/students/__tests__/pipeline.integration.test.ts`, 22); **no E2E**.

- **J12 Invite** (admin, `/dashboard/users/new`): email/name/role → "Send Invitation" → user appears Pending. Edge: existing email error, invalid email validation, non-admin blocked.
- **J13 Shadow student** (teacher): create shadow (`is_shadow`/`pending_students`) → usable in lesson dropdown → on real signup with same email, `handle_new_user` trigger merges (creates profile, migrates lessons, deletes pending row). Edge: existing email errors.
- **J14 Pipeline** (`/dashboard/users/[id]`, `/dashboard/health`): advance lead → trial → active → inactive (`status_changed_at`); health monitor shows engagement/risk + CSV export.

### Teacher/Admin — AI Features (P1 / P2 email)

All covered by existing unit/integration tests (`__tests__/api/ai/*`, 30+); **no E2E**.

- **J15 Chat** (`/dashboard/ai`): send → streamed response (<30s), conversation memory, model switch, clear, history at `/dashboard/ai/history`. Send disabled on empty input.
- **J16 Lesson notes**: AI button appears once student + songs chosen → generates structured notes referencing context → editable before save. Hidden without context; failure shows error, field stays editable.
- **J17 Assignment generation**: AI button after student + title → fills description → save. Hidden without student.
- **J18 Email drafts** (P2): 4 templates (lesson reminder, progress report, payment reminder, milestone). Generates personalized draft; new student with no history handled gracefully.

### Student Journeys (P0 onboarding/dashboard/assignments, P1 repertoire/request, P2 SOTW)

Covered at integration layer (`repertoire` 35, `song-of-the-week` 30); **no E2E** (onboarding/dashboard deferred).

- **J20 Onboarding** (`/onboarding`): fresh student redirected here; 3 steps (goals → skill level + learning style → instrument prefs) → `/dashboard`. Re-visiting onboarding when done redirects to dashboard.
- **J21 Dashboard/nav**: student view (not admin), stats cards, next/last lesson, SOTW, activity feed; sidebar scoped (no Users list, Admin Stats, Health, Logs, AI, Skills, no "New …" buttons). Empty states; mobile (375px) bottom nav, no overflow.
- **J22 Repertoire** (`/dashboard/repertoire`): list (status/priority/self-rating) → self-rate 1–5 stars (persists, `self_rating_updated_at`) → song detail. Students cannot change song **status** (teacher-only via Live Mode).
- **J23 Song request**: student submits (title/artist/url/notes) → "pending", sees only own; teacher approves (optionally creates song) / rejects with notes; student sees updated status.
- **J24 SOTW interaction**: dashboard widget → "Add to My Repertoire" (→ `to_learn`, button becomes "Already in Repertoire"); hidden when no active SOTW.
- **J25 Assignment lifecycle** (`/dashboard/assignments`): own list + status filter; detail has **no** edit/delete, only status controls; not_started → in_progress → completed (terminal); overdue still actionable; linked song navigates to song detail.

### Cross-Role (P0 lifecycle/RBAC, P1 MFA)

Covered at integration layer (`role-access-control` 12, `teacher-isolation` 8, `multi-role-visibility` 6); **no E2E** (MFA needs real auth stack).

- **J26 Full lifecycle**: admin invites → student accepts (password setup, mismatch validated, expired link errors) → onboarding → admin sees Active student with prefs.
- **J27 MFA** (TOTP via `otplib`): enroll (QR + secret + recovery codes) → sign-in challenge → success; wrong/expired code errors; repeated failures rate-limited; unenroll removes challenge.
- **J28 RBAC boundaries**: admin-only pages load for admin, redirect/403 for teacher & student; teacher sees only own students; student sees only own lessons/assignments/songs; direct-URL access to others' data → 403/404 via RLS; students have no create/delete UI and `POST /api/lessons` → 403; unauthenticated `/dashboard/*` → `/sign-in`, unauthenticated `/api/*` → 401.

---

## Best Practices

- Test behavior, not implementation; descriptive test names; isolate edge cases at the unit layer.
- E2E only for critical browser-dependent flows; use `data-testid` selectors and assertion-based waits (no fixed sleeps).
- Always timestamp E2E data and follow cleanup naming conventions.
- Run `npm run lint && npm run test:all` before pushing; never commit broken or skipped-without-reason tests; add a regression test for every bug fixed.

---
created: 2026-07-18
updated: 2026-07-18
---

# Testing Strategy

How anything in this blueprint gets proven. Mechanics (commands, configs, helpers, pyramid) live
in [reference/TESTING.md](reference/TESTING.md) — this doc adds the strategy layer: what a gap must ship with,
where RLS proof lives, and how E2E journeys map to domains.

## Definition of Done for any blueprint gap

Every gap brief's acceptance tests roll up to these gates before merge:

1. **Unit/integration** — new logic covered at the Jest layer per
   [TESTING.md](reference/TESTING.md) (70% on new code; integration for handlers/actions with mocked
   Supabase via `lib/testing/integration-helpers.ts`).
2. **RLS** — if the gap touches a table's read/write path, an RLS case proving role isolation
   (see below). No RLS case → no merge for data-surface changes.
3. **E2E** — only if the gap changes a critical browser journey; extend the _existing_ journey
   spec rather than adding a new one (journey catalog: [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md)).
4. **Quality gates** — `npm run lint && npm test` green locally; full suite in CI.

## RLS testing

Two layers, both against a **real** Supabase (never mocked):

- **Jest RLS suite** — `npx jest --config jest.config.rls.ts`, serial, per-table policy cases.
- **Cross-role E2E** — `tests/e2e/cross-role/rls-data-isolation.spec.ts` (student A cannot read
  student B via `/rest/v1/`) and `tests/e2e/cross-role/access-control.spec.ts` (route-level
  role gating).

Launch-critical: the cross-role suite must pass **against StrummyProd** before cutover — a
hard gate in [92-launch-runbook.md](92-launch-runbook.md). Passing against dev does not count.

## E2E journey ↔ domain map

| Blueprint domain       | Journey specs (`tests/e2e/`)                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 01 Identity & Access   | `auth/*` (role-login, sign-out, sign-up-complete), `onboarding/complete-flow`                                                         |
| 02 Lessons & Calendar  | `teacher/lessons-crud`, `teacher/lesson-song-status`, `student/lessons-read`, `dashboard/today-lessons`, `dashboard/upcoming-lessons` |
| 03 Songs & Repertoire  | `teacher/songs-crud`, `student/songs-read`, `student/repertoire`                                                                      |
| 04 Practice & Progress | `student/practice`, `student/practice-bpm`                                                                                            |
| 05 Chords & Theory     | `student/chord-quiz-srs`, `teacher/fretboard`                                                                                         |
| 06 Assignments         | `teacher/assignments-crud`, `student/assignments-interact`                                                                            |
| 07 Notifications       | `notifications/inbox`, `notifications/prefs`                                                                                          |
| 08 AI                  | `ai/*` (playground, assignment-ai, lesson-notes)                                                                                      |
| Cross-cutting          | `teacher-full-journey`, `student-full-journey`, `smoke/critical-path`, `cross-role/*`, `mobile/mobile-responsiveness`, `demo/*`       |

Full catalog with per-journey status: [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md). Cap: journeys
stay few and critical — new scenarios default to the integration layer (TESTING.md philosophy).

## Environment strategy

- **Local dev Supabase** = `StudentManager` stack on uwh (543xx) — where Jest RLS + E2E normally
  run (see `reference_local_e2e_runbook` memory / `playwright.config.ts` auto-detection).
- **StrummyProd** (553xx) — pre-cutover verification target only: RLS cross-role suite + smoke.
- **Known open item**: local-LLM (Ollama) AI E2E — see gap in
  [08-ai-assistant.md](08-ai-assistant.md).

## Quarantine policy

Rotted tests are quarantined in `jest.config.ts` rather than deleted silently; the quarantine
list is debt (tracked in [90-roadmap.md](90-roadmap.md) Tranche 4). Do not add to it to make CI
green — fix or consciously quarantine with a comment.

## Core Coverage Target (100%)

_Updated: 2026-07-20 (post phase-1 implementation on `test/core-coverage`)._

The blueprint targets 100% line/branch/function unit coverage for the "core" domains —
**Assignments, Lessons, Songs, Students** — across `lib/services` + `app/actions` + `schemas`
(41 files total under this mandate). Baseline before this effort: global 52.3% lines; 19 core
files at literal 0%.

### Phase 1 — DONE (2026-07-20, branch `test/core-coverage`)

~160 new tests across 17 test files brought **every previously-0% core file to 100% lines**,
and these 17 files to a perfect 100/100/100 (lines/branches/functions):

- **Actions**: `assignment-edit` (26 tests), `assignment-status` (14), `song-edit`, `song-form`
- **Services**: `assignments-queries`, `lessons-queries`, `lesson-detail-queries`,
  `song-detail-queries`, `songs-list-queries`, `users-list-queries`
- **Schemas** (already at 100 before): Lesson, Song, SongRequest, SongVideo,
  StudentRepertoire, UserFavorite, AssignmentTemplate

Also landed: `student-detail-queries`, `student-dashboard-queries`, `student-activity-helpers`,
`teacher-dashboard-queries`, `teacher-dashboard-backfill-queries`, `lesson-form-data`,
`assignment-detail-queries`, `lesson-edit` tests — all at **100% lines** but with branch gaps
(see phase 2). Global after phase 1: **57.8% lines / 79.7% branches**; full suite 242 suites /
3012 tests green.

### Phase 2 — REMAINING (mostly branch/function rounding; exact %s from `npm run test:coverage`)

| File                                                 | Lines | Branches | Funcs | What's missing                                            |
| ---------------------------------------------------- | ----- | -------- | ----- | --------------------------------------------------------- |
| `app/actions/songs.ts`                               | 50.3  | 97.0     | 44.4  | ~half the exported actions untested — largest single item |
| `app/actions/lesson-edit.helpers.ts`                 | 37.5  | 100      | 0     | helpers never invoked directly                            |
| `app/actions/lesson-edit.ts`                         | 94.0  | 64.9     | 100   | error/guard branches                                      |
| `lib/services/teacher-dashboard-backfill-queries.ts` | 95.1  | 48.1     | 100   | join-shape + colour-threshold branches                    |
| `lib/services/student-detail-queries.ts`             | 100   | 54.8     | 100   | null-coalescing branches                                  |
| `lib/services/teacher-dashboard-queries.ts`          | 100   | 58.8     | 100   | same                                                      |
| `lib/services/student-dashboard-queries.ts`          | 100   | 64.0     | 100   | same                                                      |
| `lib/services/student-activity-service.ts`           | 95.4  | 64.3     | 100   | branch gaps                                               |
| `lib/services/user.service.ts`                       | 84.2  | 75.5     | 100   | uncovered paths + branches                                |
| `lib/services/lesson-form-data.ts`                   | 100   | 81.5     | 100   | branch rounding                                           |
| `lib/services/assignment-template-queries.ts`        | 96.8  | 83.3     | 100   | branch rounding                                           |
| `schemas/AssignmentSchema.ts`                        | 97.5  | 84.6     | 80    | 1 helper + refine branches                                |
| `lib/services/student-activity-helpers.ts`           | 99.5  | 86.4     | 100   | branch rounding                                           |
| `schemas/UserSchema.ts`                              | 98.6  | 86.7     | 100   | branch rounding                                           |
| `app/actions/song-requests.ts`                       | 98.1  | 86.8     | 100   | branch rounding                                           |
| `app/actions/assignment-checklist.ts`                | 95.9  | 87.0     | 100   | branch rounding                                           |
| `app/actions/assignments.ts`                         | 92.1  | 88.2     | 100   | branch rounding                                           |
| `lib/services/assignment-detail-queries.ts`          | 100   | 88.6     | 100   | branch rounding                                           |
| `lib/services/assignment-list-params.ts`             | 96.0  | 89.1     | 100   | branch rounding                                           |
| `schemas/UserApiSchema.ts`                           | 99.4  | 100      | 88.9  | 1 uncalled function                                       |
| `app/actions/assignment-templates.ts`                | 92.2  | 90.9     | 100   | branch rounding                                           |
| `schemas/SongOfTheWeekSchema.ts`                     | 100   | 80       | 100   | branch rounding                                           |

**Deliberate exclusions** from the 100% mandate, with the actual reason for each
(_re-derived 2026-07-20 — "peripheral" was imprecise_):

- `app/actions/song-of-the-week.ts` — **not peripheral, parked.** These actions are the
  surviving half of roadmap item [SNG-2](03-songs-repertoire.md) (v1.1); the dashboard card
  that consumed them died in the July 2026 dead-component purge. Excluded because the
  consumer is unbuilt, not because the code is unimportant. Test it when SNG-2 lands.
- `lib/services/song-analytics.ts` — genuinely peripheral, but **live**:
  `getDailyBriefingStats` feeds `app/actions/email/send-admin-report.ts`, which runs on two
  cron paths (`/api/cron/dispatcher`, `/api/cron/daily-report`). Untested today.
- UI hooks (`hooks/`) — better served by the E2E suite.

**Deleted rather than excluded**: `app/actions/import-lessons.ts` (2026-07-20). Zero callers,
superseded by `lib/services/calendar-bulk-import.ts`, which is what `/dashboard/calendar` →
`HistoricalCalendarSync` → `/api/calendar/sync/stream` actually runs. It was at 85% only
because a test existed for code nothing called.

### How to implement phase 2 (mechanical recipe)

1. **Mock pattern for `lib/services/*-queries.ts`** — copy
   `lib/services/__tests__/assignment-template-queries.test.ts`: `jest.mock('@/lib/supabase/server')`
   with a chain object mirroring the file's exact query chain; per-test
   `mockX.mockResolvedValue({ data, error })`. Cover both sides of every
   `Array.isArray(join) ? join[0] : join`, every `?? fallback`, and the supabase-error branch
   (assert `logger.warn`). Freeze time with `jest.useFakeTimers().setSystemTime(...)` wherever
   `new Date()` feeds overdue/relative-date derivation.
2. **Mock pattern for `app/actions/*`** — copy `app/actions/__tests__/assignment-status.test.ts`:
   mock `getUserWithRolesSSR` (role fixtures incl. `isDevelopment` for the demo-guard branch),
   `next/cache`, supabase; drive Zod with real invalid literals, never mock schemas. For
   module-scope `createLogger()` calls, resolve spies lazily inside the mock factory (TDZ trap).
   For a defensive branch behind a real helper, partial-mock with
   `jest.requireActual` + an override variable (see `assignment-status.test.ts`).
3. **Lockdown (do LAST, in the same PR as the final gap close)** — in `jest.config.ts`
   `coverageThreshold`, add per-path 100s so core can never regress:
   `'lib/services/assignment*': {...100}`, `'lib/services/lesson*'`, `'lib/services/song*'`,
   `'lib/services/student*'`, `'lib/services/teacher-dashboard*'`, `'lib/services/users-list*'`,
   `'app/actions/assignment*'`, `'app/actions/lesson*'`, `'app/actions/song-edit.ts'`,
   `'app/actions/song-form.ts'`, `'app/actions/songs.ts'`, plus the core `schemas/` files.
   (Jest accepts glob keys; each gets `{ lines: 100, branches: 100, functions: 100, statements: 100 }`.)

## What the E2E layer adds (Playwright — no mocks, by policy)

_Inventoried 2026-07-20: 50 spec files / ~298 test definitions; last full green pass 144
passed / 41 data-gated skips on Desktop Chrome (2026-06-20)._

E2E is not "more coverage of the same code" — it proves the five things Jest structurally
cannot, because it runs a real browser against a real Next server and the real local
Supabase with **RLS enforced**:

1. **Security actually holds in the shipped stack.** The `cross-role/` suite logs in as
   student A and tries to read student B's rows table-by-table, and probes admin routes as
   a student. Unit tests mock the Supabase client, so a broken RLS policy or a
   service-role leak in a server component is invisible to them — this layer is the only
   automated place that catches cross-tenant data leaks for real.
2. **Auth/session wiring works end to end** — cookie handling, sign-up→onboarding→role
   routing, sign-out, lockout (44 auth tests + 24 onboarding). Entirely mocked at unit level.
3. **Server-action round-trips persist** — a teacher creating a lesson/song/assignment in
   the browser and seeing it after reload proves form → action → Zod → RLS-write → re-render.
   Unit tests prove each link; only E2E proves the chain.
4. **The UI is actually usable** — hydration succeeds, nav/drawer works, mobile viewports
   don't clip (16 mobile tests), demo accounts are write-guarded (11 tests), no critical
   console errors (smoke).
5. **Role-scoped rendering** — the same routes render teacher vs student variants with the
   right capabilities hidden/shown (student sees no Create buttons, etc.).

### Current inventory (by area)

| Area                                                     | Specs / tests | What it proves                                                                                                                                                     |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `teacher/`                                               | 13 / 49       | CRUD for songs, lessons (incl. repeat-weekly, song-status), assignments (+history), student onboarding/preferences/users-management, calendar conflicts, fretboard |
| `student/`                                               | 7 / 40        | Read-scoped songs/lessons, assignments interact (status transitions, filters), repertoire, practice (+BPM), chord-quiz SRS                                         |
| root journeys                                            | 3 / 22        | `teacher-full-journey`, `student-full-journey`, `student-learning-journey` — multi-phase happy paths chaining the above                                            |
| `auth/`                                                  | 3 / 44        | role-login matrix, sign-up complete, sign-out                                                                                                                      |
| `onboarding/`                                            | 1 / 24        | full first-run flow                                                                                                                                                |
| `ai/`                                                    | 5 / 31        | assignment AI, lesson-notes AI (+editorial), playground, feedback                                                                                                  |
| `cross-role/`                                            | 2 / 11        | **RLS data isolation** (A cannot read B, per table) + route access control                                                                                         |
| `mobile/`                                                | 1 / 16        | responsive behaviour at phone viewports                                                                                                                            |
| `dashboard/`                                             | 3 / 8         | sidebar, topbar, dashboard states                                                                                                                                  |
| `demo/`                                                  | 2 / 11        | demo-account mutation guards + screenshot capture                                                                                                                  |
| `admin/`                                                 | 3 / 11        | debug dashboard, lockout widget, system logs                                                                                                                       |
| `smoke/`                                                 | 1 / 8         | app boots, auth present, protected routes, 404s, no console errors                                                                                                 |
| `notifications/`, `settings/`, `integration/`, `manual/` | 6 / 23        | inbox+prefs, api-keys/avatar, cross-feature workflows, kuba onboarding script                                                                                      |

Run mechanics: `npx playwright test` (config auto-detects the local Supabase; see
`reference/TESTING.md` and the local-E2E runbook memory — prod build + port 3100 for
authed runs, session-cached `loginAs(role)` fixtures, login rate-limiter awareness).
Budget rule: E2E is for **critical flows, max ~10 per feature** — depth belongs in Jest.

### E2E gaps for core

Missing, both from the assignments feature branch (2026-07-20):

1. **Checklist toggle** (student taps item row → optimistic tick + progress % + persists) — add to
   `tests/e2e/student/assignments-interact.spec.ts`.
2. **Templates round-trip** (teacher saves template → creates assignment from it) — new
   `tests/e2e/teacher/assignment-templates.spec.ts`, ≤3 tests.

Also: after the 2026-07-20 UX remediation, specs must assume **live filters** (no
Filter/Apply buttons — fill/select auto-applies, debounced ~350 ms).
`teacher/users-management.spec.ts` is already updated; audit others before adding new ones.
`reference/E2E_JOURNEYS.md` (the per-journey catalog) predates the suite's growth
19→50 specs — treat its ✅/❌ per-journey statuses as stale until re-derived; the
inventory above is the current truth at area level.

## References

- [reference/TESTING.md](reference/TESTING.md) — mechanics, commands, helpers
- [docs/app-blueprint/reference/E2E_JOURNEYS.md](reference/E2E_JOURNEYS.md) — journey catalog
- Superseded: `docs/specs/11-testing-cicd.md` (deleted 2026-07-18; git history)

# Strummy — Whole-App Test Coverage Analysis

_Generated 2026-05-10. Branch `feature/STRUM-QUIZ-001-chord-quiz` (worktree)._

---

## TL;DR

- **247 test files / 1,498 source files** → ~16% of source has any associated test file. The `coverageThreshold` (40% lines / 35% functions) only applies to a narrow slice (`lib`, `hooks`, `app/actions`, `components/shared`) — most of the app is excluded from the gate.
- **Critical bug discovered**: the default Jest config silently runs **0 tests** inside this worktree because `testPathIgnorePatterns` includes `/.claude/`, and the worktree path is `…/.claude/worktrees/strum-quiz-001-chord-quiz/…`. Locally on `main` this is fine; CI also runs from the root. But anyone running `npm test` inside a worktree gets a green "no tests found, exit 1" → noisy false-positive _and_ false-negative depending on `--passWithNoTests`.
- **Coverage is bottom-heavy**: server actions and lib utils are well-tested. The 1,036-file `components/` tree, the 118 API routes, and **all 14 hooks** are mostly bare.
- **Biggest risk surfaces**: `app/api/spotify/*` (15 routes, 0 tests), `app/api/admin/*` (9 routes, 0 tests), `app/api/cron/*` (13 routes, partial), `components/v2/*` (290 files, 7 tests — and v2 is the active redesign), `hooks/*` (14 files, 0 tests).

---

## 1. Inventory

| Area                         | Source files | Test files | Notes                                                     |
| ---------------------------- | -----------: | ---------: | --------------------------------------------------------- |
| `app/` (pages, API, actions) |          343 |        ~35 | 118 API routes / 68 pages / 44 server actions             |
| `components/`                |        1,036 |        ~38 | 18 `*.unit.test.*` + 20 component-level `*.test.*`        |
| `lib/`                       |          231 |         53 | Strongest coverage layer                                  |
| `hooks/`                     |           14 |      **0** | None of `hooks/*.ts` has a co-located test                |
| `schemas/`                   |           40 |         10 | 9 Zod schemas covered out of 29                           |
| `tests/e2e/` (Playwright)    |            — |   19 specs | Within the "max 10 per feature" guideline overall         |
| `__tests__/` (legacy)        |            — |         53 | Mostly pre-migration; some duplicates of co-located tests |
| **Total**                    |    **1,498** |    **247** | ~16% of source files have any test                        |

Test typology:

- **Unit (`*.unit.test.*`)**: 47
- **Integration (`*.integration.test.*`)**: 15
- **E2E (Playwright `*.spec.ts`)**: 19
- **Co-located component `*.test.tsx`** (run through default Jest only when matching `components/**/*.unit.test.*` or `components/shared/**/*.test.*`): ~20 — many of these are **silently excluded** from the default `npm test` run because they don't match the testMatch patterns. E.g. `components/auth/SignInForm.test.tsx` and `components/dashboard/Dashboard.test.tsx` exist but never execute under `npm test`.

This is a major hidden problem: tests that look real, are written, and pass locally if executed manually — but don't run in CI's default suite.

---

## 2. Coverage by Domain

### 2.1 `app/actions/` — server actions (✅ best-covered area)

Tested (24): `account, ai, ai-conversations, ai-generation-logging, assignment-templates, assignments, calendar-webhook, dashboard-actions, get-authors, identity, import-csv-songs, import-lessons, mfa, notification-preferences, onboarding, practice, repertoire, song-of-the-week, song-requests, songs, student-dashboard, student-management, teacher-dashboard, send-admin-report`

**Untested (9)**:

- `ai-history.ts` — AI conversation history (data integrity risk)
- `api-keys.ts` — **security-sensitive**, generates/revokes API keys
- `calendar-conflicts.ts` — schedule collision logic (correctness-sensitive)
- `chord-quiz.ts` — newly added (this branch); has helper tests but no action test
- `in-app-notifications.ts` — fan-out logic
- `parse-text-to-csv.ts` — input parser (edge-case heavy, prime unit-test target)
- `self-rating.ts` — student-facing write path
- `settings.ts` — user settings writes
- All of `app/actions/admin/`, `app/actions/student/`, `app/actions/teacher/`, `app/actions/email/` (only `send-admin-report` is tested)

### 2.2 `app/api/` — 118 routes, ~10 test files

| Domain                                                | Routes |                                  Tested | Risk                                           |
| ----------------------------------------------------- | -----: | --------------------------------------: | ---------------------------------------------- |
| `song`                                                |     25 |                    3 (handlers, export) | High — large surface, public + admin endpoints |
| `spotify`                                             |     15 |                                   **0** | High — OAuth tokens, third-party sync          |
| `lessons`                                             |     15 | 5 (id, bulk, search, list, integration) | Medium — best-tested API domain                |
| `cron`                                                |     13 |            partial via `lib/api/cron/*` | High — silent failures = silent data drift     |
| `admin`                                               |      9 |                                   **0** | Critical — privileged operations               |
| `drive`                                               |      4 |                                   **0** | Medium — Google Drive integration              |
| `users / students / student / external`               |     12 |                                   **0** | High — RBAC boundaries                         |
| `widget / teacher / assignments / api-keys / cohorts` |     11 |                                   **0** | Medium                                         |
| `webhooks / oauth2 / calendar-sync / calendar`        |      4 |                                   **0** | High — external trust boundary                 |
| Single endpoints (stats, exports, health, …)          |     14 |                                1 (auth) | Low–Medium                                     |

**Bottom line**: 8.5% of API routes have a test file. Public, security-relevant, and money-relevant domains (admin, spotify OAuth, webhooks, api-keys) have zero unit/integration coverage.

### 2.3 `lib/` — domain logic (best signal-to-noise)

| Subdir                                                                              | Src | Tests | Verdict                                                       |
| ----------------------------------------------------------------------------------- | --: | ----: | ------------------------------------------------------------- |
| `ai/`                                                                               |  44 |     6 | OK on rate-limiter, provider factory; gaps in stream handling |
| `services/`                                                                         |  27 |     9 | Good                                                          |
| `email/`                                                                            |  27 |     7 | Good (bounce, retry, send)                                    |
| `auth/`                                                                             |  12 |     6 | Good (lockout, rate-limit, shadow-email, disposable)          |
| `music-theory/`                                                                     |   9 |     4 | OK                                                            |
| `mutations/`                                                                        |   5 |     4 | Excellent                                                     |
| `api/`                                                                              |   4 |     3 | Good (errors, cron)                                           |
| `access/`                                                                           |   1 |     1 | Good (`StudentAccess` central RBAC primitive)                 |
| `supabase/`                                                                         |   7 |     1 | **Gap** — only credentials covered                            |
| `database/`                                                                         |   4 | **0** | **Gap**                                                       |
| `testing/`                                                                          |   6 |     0 | N/A (test infra)                                              |
| `repositories/`                                                                     |   1 |     1 | OK                                                            |
| `health, queries, notifications, demo, calendar, animations, fonts, hooks, logging` |  16 |     1 | **Gaps everywhere**                                           |

### 2.4 `components/` — 1,036 files, ~38 tests

**Domain-by-domain test counts** (sorted by source size):

| Domain                                                                                       | Files | Tests | Coverage                                                  |
| -------------------------------------------------------------------------------------------- | ----: | ----: | --------------------------------------------------------- |
| `v2/`                                                                                        |   290 |     7 | 2.4% — **active redesign, near-zero tests**               |
| `dashboard/`                                                                                 |   136 |     9 | 6.6%                                                      |
| `songs/`                                                                                     |   116 |     2 | 1.7%                                                      |
| `lessons/`                                                                                   |    90 |     4 | 4.4%                                                      |
| `ui/`                                                                                        |    47 |     2 | 4.3% — design-system primitives                           |
| `users/`                                                                                     |    40 |     2 | 5%                                                        |
| `assignments/`                                                                               |    37 |     3 | 8.1%                                                      |
| `landing/`                                                                                   |    27 | **0** | Marketing surface; SEO/conversion-critical but low logic  |
| `settings/`                                                                                  |    23 |     2 | 8.7%                                                      |
| `fretboard/`                                                                                 |    22 |     3 | 13.6% — best ratio                                        |
| `shared/`                                                                                    |    17 | **0** | Cross-cutting; gated by coverage threshold but unverified |
| `auth/`                                                                                      |    16 |     4 | 25% — but tests don't run in default suite (see §3)       |
| `profile/`                                                                                   |    13 |     5 | Strong                                                    |
| `debug/`                                                                                     |    12 |     0 | Low priority                                              |
| `student/`                                                                                   |    11 |     0 | Student-facing UI                                         |
| `home/`                                                                                      |    10 |     0 |                                                           |
| `navigation/`                                                                                |    10 |     2 |                                                           |
| `drive, ai`                                                                                  |  9 ea |     0 | Newer integrations                                        |
| `skills/` (chord quiz)                                                                       |     8 |     1 | This branch added the helper test                         |
| `song-of-the-week, theory, providers, onboarding, notifications, admin, teacher, repertoire` |   ~40 | **0** | Most are small but include critical flows                 |

### 2.5 `hooks/` — 14 source files, 0 tests

Untested hooks include: `useDashboardStats`, `useLessonStats`, `useDatabaseStatus`, `useAIConversation`, `useAIStream`, plus a stack of UI hooks (`use-haptic`, `use-mobile`, `use-media-query`, `use-keyboard-viewport`, `use-reduced-motion`, …).

The mutation hooks under `lib/mutations/` are tested (4 of 5). The dashboard data hooks — which feed the most-loaded screens — are not.

### 2.6 `schemas/` — 29 Zod schemas

Tested (10): `Song, Lesson, Auth, User, Assignment, CsvSongImport, SelfRating, SongRequest, UserApi, PracticeSession`

Untested (19, notable): `ActivityLog, AssignmentTemplate, ChordQuizAttempt, Contact, DriveFile, Invite, Onboarding, Profile, RecurringLesson, Settings, SongOfTheWeek, SongVideo, StudentRepertoire, Task, TheoryLesson, UserFavorite, Common`.

Schemas are pure functions and the **highest test-ROI in the codebase** — every untested one is a 5-minute, deterministic, no-mock test.

### 2.7 E2E (Playwright) — 19 specs

| Bucket      |                                    Specs | Notes                                                  |
| ----------- | ---------------------------------------: | ------------------------------------------------------ |
| Smoke       |                      1 (`critical-path`) | Good                                                   |
| Auth        |                   1 (`sign-up-complete`) | Should also cover sign-in MFA, password reset          |
| Teacher     |                       3 + 1 full-journey | CRUD per resource — solid                              |
| Student     |                       3 + 2 full-journey | CRUD per resource — solid                              |
| AI          | 3 (playground, assignment, lesson-notes) | Good                                                   |
| Onboarding  |                                        1 |                                                        |
| Mobile      |                       1 (responsiveness) | Token coverage on mobile UI; v2 redesign isn't checked |
| Demo        |         2 (mutation guards, screenshots) | Demo-mode safety — important                           |
| Integration |                          1 (`workflows`) | Cross-role flows                                       |

**Gaps** — no E2E for: payments/api-keys, Spotify OAuth round-trip, Google Drive/Calendar OAuth, admin actions (impersonation, role changes), webhook receivers, song-of-the-week admin flow, chord-quiz (this branch).

---

## 3. The Hidden Coverage Bugs

These are the items that distort the apparent coverage numbers and should be fixed before any further test work.

### 3.1 Worktree path collision with `testPathIgnorePatterns`

`jest.config.ts:91-100` ignores `/.claude/`. The whole worktree lives under `.claude/worktrees/`, so **every test file inside a worktree is excluded** by the default config. `npm test` reports 0 tests, exits with `--passWithNoTests` true would mask this entirely.

**Fix**: scope the ignore to actual claude-internal directories, e.g. `'/.claude/(?!worktrees/)'` or move worktrees outside `.claude/`. The `jest.config.simple.ts` config doesn't have this issue and finds 247 tests.

### 3.2 Component tests that never run

Several `components/<domain>/*.test.tsx` files exist (auth forms, dashboard, settings, songs, assignments, profile, navigation, ui) but the default `testMatch` only picks them up if named `*.unit.test.*` or under `components/shared/`. About **20 component test files are dead** in the default suite.

**Fix**: either rename them to `*.unit.test.tsx` (cheap; matches the conventional split) or broaden `testMatch` to include `components/**/*.test.{ts,tsx}` and rely on `*.integration.test.*` ignore for the integration boundary.

### 3.3 Duplicate test trees (`__tests__/` vs co-located)

Several files exist twice:

- `lib/google.test.ts` and `__tests__/lib/google.test.ts`
- `lib/getUserWithRolesSSR.test.ts` and `__tests__/lib/getUserWithRolesSSR.test.ts`
- `lib/bearer-auth.test.ts` and `__tests__/lib/bearer-auth.test.ts`
- `schemas/SongSchema.test.ts` and `__tests__/schemas/SongSchema.test.ts` (and `schemas/__tests__/SongSchema.unit.test.ts`)
- Auth forms duplicated in `components/auth/*.test.tsx` and `__tests__/components/auth/*.test.tsx`

**Fix**: pick one location (co-located is the documented convention per `CLAUDE.md`) and delete the legacy `__tests__/` copies. Diff each pair before deleting; the legacy ones are sometimes more thorough.

### 3.4 Coverage threshold scope is misleading

`coverageThreshold` is global (40% lines), but `collectCoverageFrom` only includes `lib, hooks, app/actions, components/shared`. The **massive `components/` tree, all of `app/api/`, all of `app/(dashboard)/...` pages, and all of `schemas/` contribute zero to the gate**. A 99% gate on the current scope wouldn't change real risk; the gate isn't doing what its number suggests.

**Fix**: either expand `collectCoverageFrom` and lower the threshold realistically, or split into per-zone thresholds (e.g. `app/actions ≥ 70%`, `lib ≥ 60%`, `schemas ≥ 90%`, `components ≥ 25%`).

### 3.5 Skipped tests in production code

- `__tests__/database/shadow-user-linking.test.ts` (already in ignore list)
- `lib/services/__tests__/notification-service.test.ts` — has `.skip(`. Check whether the skip is still needed.

---

## 4. Risk-Ranked Recommendations

### P0 — Do this before adding more tests (fixes the measurement)

1. Fix `testPathIgnorePatterns` so worktrees actually run their tests (§3.1).
2. Decide on test file naming and either rename or adjust `testMatch` so the ~20 dead component tests run (§3.2).
3. Deduplicate `__tests__/` vs co-located (§3.3).
4. Split `coverageThreshold` per zone so the gate reflects real risk (§3.4).
5. Add an actionable `npm run test:coverage` baseline once the above settle. Today's number is fictional.

### P1 — Highest-leverage gaps (cheap tests, high blast-radius if broken)

| Target                                          | Why                                                                                                                       | Effort |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| **All untested Zod schemas** (19)               | Pure functions, no mocks; one bad schema = data corruption                                                                | XS     |
| **`lib/access/*`, RBAC helpers**                | Single source of truth for student/teacher/admin gating                                                                   | S      |
| **`app/api/admin/*`** (9 routes)                | Privileged ops; broken authz = security incident                                                                          | M      |
| **`app/api/spotify/*` token refresh path**      | OAuth refresh failures already showed up in `lib/__tests__/spotify-error-handling.test.ts` — extend to the route handlers | M      |
| **`app/api/webhooks/*` and `oauth2/*`**         | External trust boundary, signature verification                                                                           | M      |
| **Cron handlers** (13 routes)                   | Silent failures in production, need at minimum a "happy + 401 + 500" trio                                                 | S each |
| **`hooks/useDashboardStats`, `useLessonStats`** | Drive most-loaded screens; would catch tanstack-query regressions                                                         | S      |
| **`app/actions/api-keys.ts`**                   | Issues/rotates secrets, currently zero tests                                                                              | S      |
| **`app/actions/calendar-conflicts.ts`**         | Time-math is the classic bug zone                                                                                         | S      |
| **`app/actions/parse-text-to-csv.ts`**          | Pure parser → table-driven unit tests are a freebie                                                                       | XS     |

### P2 — Surface area worth boxing in (component-level tests)

- `components/v2/*` — pick the 10 highest-traffic widgets (dashboard tiles, song table, lesson form) and add unit tests for the deterministic helpers + a smoke render test for the shells. The current 7 tests for 290 files is the single biggest gap by raw count.
- `components/shared/*` (17 files, 0 tests). These are imported widely; even snapshot/smoke tests catch regressions cheaply.
- `components/ai/*`, `components/drive/*`, `components/notifications/*` — newer integrations; lock behavior in early.
- `components/auth/*` — make the existing tests actually run (P0 #2) before writing new ones.

### P3 — E2E expansions (stay under 10 per feature)

- Spotify OAuth roundtrip (mock provider boundary only)
- Admin impersonation / role switch / lockout flow
- Chord-quiz student journey (added in this branch)
- Webhook receiver smoke test (signature pass / fail)
- Calendar import end-to-end (Google → DB → display)

### P4 — Long-term hygiene

- Add a `npm run test:dead` check that errors if any `*.test.{ts,tsx}` is on disk but Jest doesn't load it.
- Add `npx jest --listTests | wc -l` to CI as a tripwire — sudden drops mean someone broke `testMatch`.
- Move worktrees out of `.claude/` (or fix the ignore pattern) so this whole class of bug stops happening.

---

## 5. Suggested Coverage Targets (after measurement is fixed)

| Zone                                         | Realistic 90-day target                     | Stretch |
| -------------------------------------------- | ------------------------------------------- | ------- |
| `schemas/`                                   | 95% lines                                   | 100%    |
| `lib/access`, `lib/auth`                     | 90%                                         | 95%     |
| `lib/` overall                               | 70%                                         | 80%     |
| `app/actions/`                               | 75%                                         | 85%     |
| `app/api/` (admin, webhooks, oauth, spotify) | 60% (handlers)                              | 75%     |
| `app/api/` (cron)                            | 60% (happy + auth-fail per route)           | 80%     |
| `hooks/`                                     | 60%                                         | 75%     |
| `components/v2`, `components/shared`         | 25%                                         | 40%     |
| `components/` (rest)                         | 15%                                         | 25%     |
| E2E critical paths                           | 100% (5 paths × auth+student+teacher+admin) | —       |

---

## 6. What "deep coverage" should actually mean here

A useful definition for Strummy:

1. **Boundary coverage** — every place untrusted data enters: Zod schemas at form/API edges, webhook signatures, OAuth callbacks, cron auth headers. This is currently the weakest layer relative to risk.
2. **Authorization coverage** — every RLS-bypass-capable operation (admin actions, service-role queries, `withApiAuth` seam). `lib/access/StudentAccess` has a test; the rest of the auth surface needs the same treatment.
3. **State-transition coverage** — assignments lifecycle, lesson lifecycle, song-of-the-week rotation, MFA enrollment, account deletion. State machines hide most product bugs; a handful of integration tests per state machine pays for itself.
4. **Cross-role coverage** — verifying that a student request hits a path a teacher can't, and vice versa. The `__tests__/api/lessons/integration.test.ts` model is good — extend it to admin/teacher/student × all CRUD-capable resources.

Pure line coverage of UI components is the lowest-priority dimension; visual/E2E tests dominate there.

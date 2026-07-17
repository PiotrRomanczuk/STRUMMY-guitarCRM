# Strummy (guitar-crm) — Architecture Health Deep-Dive

**Date**: 2026-07-12
**Author**: Claude (read-only analysis)
**Scope**: Whole-repo static analysis on branch `feature/auth-email-templates` (v0.158.5, HEAD `76d866ee`). No code was executed against live services; database findings are derived from migration files, not a live instance.

---

## 1. Executive Summary

**Verdict: C+ — a well-intentioned safety baseline undermined by a confirmed critical data-exposure bug and accumulating architectural entropy. One finding needs fixing this week.**

Strummy is a real production SaaS (Next.js 16 App Router, React 19, Supabase, ~20–30 DAU) with ~174,500 LOC of source TypeScript across ~1,700 files, 174 migrations, and a genuinely strong _intended_ safety baseline: TypeScript `strict: true`, `no-explicit-any` as an ESLint **error**, near-total RLS coverage (53/56 tables), every cron route gated by `verifyCronSecret`, HMAC-signed unsubscribe tokens, a clean `NEXT_PUBLIC_`/secret env split, and zero `dangerouslySetInnerHTML`.

**But that baseline has a hole that matters right now**: `GET /api/lessons` and `GET /api/lessons/[id]` query with the **service-role client (RLS bypassed) and do no ownership check** — any authenticated student can read every lesson in the system, including all students' and teachers' names and emails (§7.2, verified against source). The routes carry comments claiming RLS enforces visibility; it does not, because the admin client bypasses it. The recently-added RLS isolation test passes but tests the wrong layer, giving false confidence. This is a **CRITICAL IDOR** and the reason the overall grade is C+ rather than B−.

Beneath the acute bug is chronic **entropy**: three write paths (Server Actions ∥ API routes ∥ TanStack hooks) and four read patterns coexist for the same entities; 42 API files use the service-role client with hand-rolled authorization (the lessons IDOR is the proven instance, the other 41 are unaudited); two UI generations run in parallel behind a runtime switch; ~25 unit suites are quarantined with coverage floors at 30–40%; 105 components exceed the 200-LOC limit.

**Fix the lessons IDOR and the Spotify-token leak this week; then the work is consolidation, not construction.**

| Dimension    | Grade                       | One-liner                                                                                       |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| Security     | **D** (→B+ once IDOR fixed) | Strong intended guards, but a confirmed critical IDOR + service-role sprawl bypass RLS entirely |
| Database/RLS | **A−**                      | 313 policies, 53/56 tables — excellent, but silently bypassed by admin-client API routes        |
| Architecture | **C+**                      | Sound layers, but 3 write paths + 4 read patterns + 2 UI trees                                  |
| Code health  | **C**                       | 105 components >200 LOC, 71 lib/hooks >150 LOC; ~39 raw `any` but 62 `any`-suppressions         |
| Tests        | **C+**                      | Broad E2E suite (44 specs), but 25 quarantined unit suites, 30–40% floors, RLS test misleads    |
| Dependencies | **B−**                      | Modern (bleeding-edge, even), but duplicated chart/spreadsheet/Radix installs                   |

---

## 2. Architecture & Module Map

### 2.1 Module inventory

| Area          | Files (.ts/.tsx) | Contents                                                                                                                                                                                  |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | 404              | Route groups `(auth)`, `dashboard/` (~40 feature subroutes), `onboarding/`, plus **124 API `route.ts`** and **43 server-action files** in `app/actions/` (58 files marked `'use server'`) |
| `components/` | 1,042            | 39 domain dirs + parallel `v2/` and `_editorial/` generations                                                                                                                             |
| `lib/`        | 290              | 28 subdirs — `services/` (55, the RSC read layer), `ai/` (51), `email/` (35), `testing/` (21), `auth/` (20), `supabase/` (9), `mutations/` (9)                                            |
| `schemas/`    | 54               | Zod schemas, one per entity (`LessonSchema.ts`, `SongSchema.ts`, …)                                                                                                                       |
| `types/`      | 30               | Plus generated `types/database.types.generated.ts` (2,924 LOC) and `types/database.types.ts` (2,355 LOC)                                                                                  |
| `hooks/`      | 18               | UI/util hooks incl. `use-ui-version.ts` (runtime UI-generation switch)                                                                                                                    |
| `supabase/`   | 174 migrations   | Plus `baseline/`, `migrations_archive/` (7 files)                                                                                                                                         |

### 2.2 Data flow — the intended paths

- **Read (server)**: RSC page → `lib/services/*-queries.ts` → RLS server client. Example: `app/dashboard/lessons/page.tsx:8` imports `getRecentLessons`/`summariseLessons` from `lib/services/lessons-queries.ts`; auth via `getUserWithRolesSSR()`.
- **Read (client)**: component → `useQuery` → `lib/api-client.ts` → `app/api/**/route.ts` (53 files use TanStack hooks; single provider at `components/providers/QueryProvider.tsx`).
- **Write (Server Action)**: e.g. `app/actions/lesson-edit.ts:37` `createLessonAction` — RLS client from `lib/supabase/server.ts`, `getUserWithRolesSSR()` authz, `guardTestAccountMutation`, Zod `LessonInputSchema`, `revalidatePath`.
- **Write (API + hook)**: `lib/mutations/useLessonMutations.ts:27` → `apiClient.post('/api/lessons')` → `app/api/lessons/route.ts:28` wrapped in `withApiAuth`, then `invalidateQueries(['lessons'])`.
- **Auth gate**: Next 16 `proxy.ts` (root) — session check, redirect unauthenticated `/dashboard/*`, deactivated-account sign-out, `/dashboard/admin` gated on `is_admin`, injects `x-user-id`/`x-user-roles`, sets CSP + security headers. API routes are excluded from the matcher and rely on `withApiAuth` (`lib/auth/withApiAuth.ts` → `authenticateRequest`: cookie session OR API-key bearer).

### 2.3 Data flow — the actual mess

For the same entities (lessons, songs) **three write paths coexist**: Server Actions (`app/actions/songs.ts`, `song-edit.ts`, `song-form.ts`), API routes (`app/api/song/*` — 25 routes incl. `/song/update`, `/song/bulk`), and TanStack mutation hooks (`lib/mutations/useSongMutations.ts`). They partially share helpers (`app/actions/lesson-edit.ts` imports from `@/app/api/lessons/utils`) but there is no single source of truth for mutations.

On the read side, **four styles coexist**: RSC service functions, apiClient+TanStack Query, **raw `fetch()` in 56 component/app files**, and **direct browser supabase-js in 33 component files** (`lib/supabase/client.ts`) that bypass both the API layer and the Query cache.

### 2.4 Structural inconsistencies

1. **Two authorization models** (detailed in §7): 75 routes use the RLS server client; 42 files under `app/api` use `createAdminClient()` (service-role, RLS bypassed) and re-implement role filtering in JS — e.g. `app/api/lessons/route.ts:31` lists lessons via service role with hand-written role scoping in `getLessonsHandler`.
2. **Parallel UI generations**: `components/v2/*` (settings, health, theory, admin, navigation, cohorts, primitives) and `components/_editorial/` alongside base domain components, switched via `hooks/use-ui-version.ts`. Two UI trees are being maintained at once.
3. **Duplicate API trees**: `app/api/student/*` (2 routes) vs `app/api/students/*` (3); `app/api/teacher/*` vs `app/api/teachers/*`. Lessons has overlapping stats surfaces (`stats`, `stats/advanced`, `stats/daily`, `analytics`).
4. **Three logging homes**: `lib/logger/`, `lib/logging/`, `lib/observability/`.
5. **Repo hygiene**: self-referencing symlink `guitar-crm -> /Users/piotr/Desktop/MainCV/guitar-crm` at repo root (untracked, **not** gitignored — recursion foot-gun for any tool that follows symlinks); `.LEGACY_DATA/`; `seed.sql.bak/.tmp`; `.env.local.bak`; committed artifacts (`all-journeys.mp4` 2.9 MB, `bruno-results-*.json` 5.5 MB, `lighthouse-report.json` 389 KB); a stray `cypress/` dir with one spec left over from the pre-Playwright era.

---

## 3. Tech Stack & Dependency Risk

Lockfile: ~1,990 resolved packages; `node_modules` ≈ 1.7 GB. **No `engines`, no `.nvmrc`, no `packageManager`** — Node version unpinned while `@types/node ^25` implies a very new runtime.

### 3.1 Core stack (current and modern)

`next ^16.2.9`, `react 19.2.4` (exact pin), `@supabase/supabase-js ^2.97.0`, `@supabase/ssr ^0.8.0` (pre-1.0), `@tanstack/react-query ^5.90.21`, `zod ^4.3.6`, `tailwindcss ^4`, `ai ^6.0.140` + `@ai-sdk/openai-compatible ^2.0.37`, `@sentry/nextjs ^10.40.0`, `pino ^10`, `posthog-js ^1.356.1`. The risk profile is **churn, not lag** — nearly everything is on a latest major. `eslint ^10` is so new it breaks `eslint-config-next`'s bundled react plugin (worked around in `eslint.config.mjs:29-36`), and `eslint-config-next` is pinned at `16.1.6` while `next` floats at `^16.2.9`.

### 3.2 Duplicated and heavy dependencies

- **Two charting libraries**: `@nivo/{bar,calendar,line,sunburst}` (4 packages, 0.x) **and** `recharts ^3.7.0` — both ship D3 to the client.
- **Two spreadsheet libraries**: `exceljs ^4.4.0` (runtime) **and** `xlsx ^0.18.5` (dev) — the npm `xlsx` line is stale with past advisories.
- **Radix double-install**: umbrella `radix-ui ^1.4.3` **plus** 17 granular `@radix-ui/react-*` packages (`package.json:95-109`).
- **`googleapis ^171`**: the entire Google API surface for what is likely Calendar + Drive; scoped `@googleapis/calendar`-style packages would cut install weight dramatically.
- Legacy: `node-fetch ^3.3.2` (Node ≥18 has global fetch). Security pins: `overrides` for `qs` and `minimatch` (`package.json:149-152`).

### 3.3 Config safety

- `tsconfig.json`: `strict: true` ✅, but `skipLibCheck: true`, `allowJs: true`, target ES2017; tests/scripts excluded from typecheck.
- `next.config.ts`: **no** `ignoreBuildErrors` / `ignoreDuringBuilds` ✅; Sentry-wrapped with `/monitoring` tunnel; async config probes local Supabase and silently falls back to remote in dev (a surprise-in-waiting when local is down).
- `eslint.config.mjs`: `@typescript-eslint/no-explicit-any: error` ✅, but `max-lines`, `max-lines-per-function`, `complexity` are all **warn** — the repo's size limits are advisory in practice, which §4 shows.
- ~85 npm scripts; `dev` wraps `next dev` in nodemon with `--max-http-header-size=65536`.

---

## 4. Code Health vs the Repo's Own Limits

Limits: component ≤200 LOC, hook/lib ≤150 LOC, function ≤50 LOC (CLAUDE.md, enforced only as ESLint _warnings_).

### 4.1 Violations at a glance

- **105 component files exceed 200 LOC.**
- **71 lib/hooks files exceed 150 LOC.**
- Total source (excl. tests): **~174,500 LOC**; ~4,900 of that is the two generated DB-types files.

### 4.2 Worst offenders (hand-written, excluding generated types)

| LOC | File                                                           | Class                                  |
| --- | -------------------------------------------------------------- | -------------------------------------- |
| 727 | `components/ui/sidebar.tsx`                                    | component (3.6× limit; shadcn-derived) |
| 583 | `lib/services/user.service.ts`                                 | service                                |
| 542 | `lib/services/notification-monitoring.ts`                      | service                                |
| 537 | `app/dashboard/actions.ts`                                     | server actions                         |
| 524 | `components/songs/student/StudentSongDetailPageClient.tsx`     | component                              |
| 511 | `lib/services/notification-service.ts`                         | service                                |
| 492 | `components/logs/SystemLogs.tsx`                               | component                              |
| 484 | `components/dashboard/admin/SpotifyMatchesClient.tsx`          | component                              |
| 464 | `app/api/assignments/handlers.ts`                              | API handlers                           |
| 460 | `app/api/users/route.ts`                                       | API route                              |
| 458 | `lib/repositories/user.repository.ts`                          | repository                             |
| 441 | `components/design-preview/lib/mock-data.ts`                   | fixture                                |
| 428 | `lib/ai/providers/openrouter.ts`                               | AI provider                            |
| 421 | `components/users/editorial/SongImportForm.tsx`                | component                              |
| 420 | `lib/logging/notification-logger.ts`                           | logging                                |
| 411 | `app/dashboard/theory/actions.ts`                              | server actions                         |
| 410 | `lib/services/cohort-analytics.ts`                             | service                                |
| 404 | `components/dashboard/admin/drive-videos/ReviewQueueTable.tsx` | component                              |
| 402 | `app/dashboard/calendar-actions.ts`                            | server actions                         |
| 396 | `lib/ai/registry/context-fetcher.ts`                           | AI                                     |

The notification subsystem alone owns three 400–550 LOC files (`notification-service`, `notification-monitoring`, `notification-logger`) plus `types/notifications.ts` at 435 LOC — a strong split-candidate cluster.

### 4.3 Type escape hatches (surprisingly clean — with one asterisk)

- **~39** raw `any`-pattern hits in source (`: any`, `as any`, `any[]`, `<any>`) — low for 174k LOC. Clustered in `lib/ai/execution/batch.ts`, `lib/ai/registry/validation.ts`, `components/debug/DatabaseStatus.tsx`, `app/api/lessons/handlers/get.ts`, `components/ui/drawer.tsx` (vendor). A further ~129 live in test files.
- **The asterisk**: of **94** `eslint-disable` comments, **62 suppress `@typescript-eslint/no-explicit-any`** — so the true `any` footprint is the suppression count, not the raw grep. Each is a deliberate opt-out from the repo's strongest lint rule and worth a periodic burn-down. The rest: ~15 `react-hooks/exhaustive-deps` (mostly justified with comments), 4 `no-require-imports`, 4 size-limit waivers, 2 `no-console` (logger chokepoint).
- **0** `@ts-ignore`, **5** `@ts-expect-error`, **3** TODO/FIXME (all legitimate, e.g. `app/api/users/route.ts:419` `TODO(phase-0.1)` bucket-A restore), only 8 commented-out code blocks repo-wide. Comment hygiene is genuinely good.
- Hooks over the 150-LOC limit: `useDriveVideos.ts` (217), `useAIStream.helpers.ts` (216), `lib/hooks/useAuth.ts` (211), `useSignUpLogic.ts` (211), `useNotifications.ts` (190), `useDriveFileUpload.ts` (164).

### 4.4 Duplication & dead code

**Structural duplication (two competing directory conventions spawned copies):**

- `components/lessons/` has flat-vs-subdir twins: `LessonTable.helpers.ts` vs `list/LessonTable.helpers.ts` (near-identical `formatDate`/`formatTime`, 47 vs 49 LOC), `useSongs.ts` vs `hooks/useSongs.ts`, `useProfiles.ts` vs `hooks/useProfiles.ts`, `LessonForm.SongSelect.tsx` vs `form/LessonForm.SongSelect.tsx`.
- **`AssignmentList` is implemented 6×**: `assignments/student/`, `assignments/AssignmentList/`, `assignments/list/`, `student/assignments/`, `dashboard/teacher/`, `teacher/dashboard/` — the last two revealing dueling layout conventions (`dashboard/teacher` vs `teacher/dashboard`).
- The **editorial parallel UI tree is 68 files / 9,490 LOC** (`*Editorial.tsx` variants alongside originals), on top of `components/v2/` (§2.4).
- `formatDuration` defined 3× with no shared util: `lib/ai/token-estimation.ts:112`, `components/songs/student/StudentSongs.constants.ts:57`, `components/dashboard/admin/spotify/helpers.tsx:31`.
- Two `useAuth` implementations: `components/auth/AuthProvider.tsx` and `lib/hooks/useAuth.ts` (211 LOC).
- **Six Supabase client entrypoints** (`lib/supabase.ts`, `lib/supabase-browser.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/index.ts`, `lib/supabase/admin.ts`) with ~405 raw client-creation call sites.
- Singular/plural API route twins (`student`/`students`, `teacher`/`teachers`); three logging modules (`lib/logger/`, `lib/logging/`, `lib/observability/`).

**Dead code (import-checked):**

- `components/lessons/form/LessonForm.SongSelect.old.tsx` — confirmed unimported. Safe delete.
- `components/landing/_legacy/` (~573 LOC) — no imports from outside the directory. Strong delete candidate.
- `cypress/` (1 spec, superseded by Playwright), `.LEGACY_DATA/`, `supabase/migrations_archive/`, `seed.sql.bak/.tmp`, `.env.local.bak`, committed test videos/reports.
- **Not dead, but heavy**: `components/design-preview/` (82 files / 11,299 LOC) backs the live `/design-preview` route and its `editorial-tokens.css` is imported by ~20 dashboard pages — however `mock-data.ts` (441 LOC) ships in-tree. `components/debug/` (820 LOC / 12 files) is a live debug surface — confirm it's route-gated in production.

---

## 5. Database & RLS Surface

### 5.1 Inventory

- **174 migration files** (`supabase/migrations/`), spanning Oct 2025 → Jun 2026, mostly timestamp-named, plus a `baseline/` and 7 archived migrations.
- **~56 distinct tables** created across migrations. Domains: teaching core (`lessons`, `lesson_songs`, `songs`, `assignments`, `student_repertoire`, `student_song_progress`, `practice_sessions`), auth/identity (`profiles`, `user_roles`, `api_keys`, `auth_events`, `auth_rate_limits`, `pending_students`), notifications (`notification_queue/_log/_preferences`, `in_app_notifications`), AI (`ai_conversations/_messages/_generations/_usage_stats`, `agent_execution_logs`), theory (`theoretical_courses/_lessons`, `chord_quiz_attempts`, `chord_srs`, `skills`, `student_skills`), content/integrations (`content_posts`, `spotify_matches`, `drive_files`, `user_integrations`, `webhook_subscriptions`, `sync_conflicts`), ops (`system_logs`, `audit_log` + partitions, `task_management`).

### 5.2 RLS coverage — near total

- **74** `ENABLE ROW LEVEL SECURITY` statements covering **53 unique tables**; **313 `CREATE POLICY`** statements.
- Set-difference of created-tables vs RLS-enabled-tables leaves only **`audit_log_` partition artifacts and `audit_log_default`** — i.e. partitions of the audit table. Postgres does not cascade the parent's RLS to direct partition access, so this is a (low-severity, service-role-only) gap worth one migration to close.
- **Flag for audit**: `USING (true)` policies appear in 4 migrations — `20251107131550_rls_lesson_songs.sql`, `20251217000000_create_skills_tracking_tables.sql`, `20260214000000_song_videos.sql`, `20260224000000_fix_song_videos_rls_student_restriction.sql` (the last one _fixing_ an earlier over-permissive policy — good sign the practice is being caught, but the first two deserve the same review).
- **44 migration files contain `SECURITY DEFINER` functions** — each bypasses RLS by design; they are the second half of the "two authorization models" problem and should be inventoried alongside the service-role routes.

### 5.3 Migration hygiene

- Only 5 `DROP TABLE/COLUMN` statements across 174 files — destructive changes are rare.
- Non-conforming files sit inside `supabase/migrations/`: `fix_track_user_changes.sql` (no timestamp — will sort wrong), `ROLLBACK_040_...sql` and `VALIDATION_in_app_notifications.sql` (operational scripts living in the migration dir), plus two markdown docs. These risk being picked up (or mis-ordered) by tooling that globs the directory.
- Two generated type files (`database.types.ts` and `database.types.generated.ts`, ~5,300 LOC combined) coexist — drift risk between them; one should be canonical.

---

## 6. Test Coverage

### 6.1 The layers

| Layer                                           | Volume                                                                                                                    | Verdict                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Jest unit (`__tests__/` + colocated)            | 42 files / ~270 `it()` blocks running (total test estate: 308 files / 61,586 LOC, incl. quarantined + integration + E2E)  | Thin for 174k LOC, and shrinking via quarantine                                                                          |
| Jest integration (`*.integration.test.*`)       | separate config, 50% workers                                                                                              | Present, targeted                                                                                                        |
| Jest RLS (`*.rls.test.*`, `jest.config.rls.ts`) | serial (`maxWorkers: 1`)                                                                                                  | **Standout strength** — real RLS isolation proofs (see commit `6ecf57a0`, cross-read isolation against real `/rest/v1/`) |
| Playwright E2E (`tests/`)                       | **44 spec files** across auth, teacher CRUD, student journeys, cross-role RLS isolation, notifications, AI, mobile, smoke | Far beyond the "5 core journeys" CLAUDE.md claims — docs are stale, reality is better                                    |
| Cypress                                         | 1 leftover spec                                                                                                           | Dead — delete                                                                                                            |

### 6.2 The problems

1. **~25 quarantined unit suites** listed in `jest.config.ts:109-151` with honest comments ("rotted tests… stale mocks, renamed components, drifted assertions"). These include high-value targets: `sign-in/page.test.tsx`, `sign-up/page.test.tsx`, `LessonForm.test.tsx`, `SongForm.test.tsx`, `AssignmentForm.test.tsx`, all 5 Spotify route tests, `getUserWithRolesSSR.test.ts`. The core form components and auth pages currently have **zero running unit coverage**.
2. **Coverage floors set to the baseline, not a target**: branches 30 / functions 35 / lines 40 / statements 40 (comment admits "~44% baseline"). The CLAUDE.md claim of "70% coverage minimum" is not enforced anywhere.
3. **60 `.skip`/`xit`/`xdescribe` occurrences** across `__tests__/` and `tests/`.
4. CI (`.github/workflows/ci-cd.yml`) runs the Jest layer; the Playwright matrix (7 device projects) is primarily local/on-demand — E2E regressions can reach `main` between manual runs.
5. Unit-vs-E2E inversion: with 44 E2E specs vs 42 running unit files, the pyramid is inverted relative to the repo's stated 70/20/10 strategy. E2E is carrying coverage that belongs in cheaper layers.

---

## 7. Security Surface

### 7.1 What's solid (verified, not assumed)

- **Cron**: all **14/14** `app/api/cron/*` routes call `verifyCronSecret` from `lib/auth/cron-auth.ts` (e.g. `app/api/cron/lesson-reminders/route.ts:28`). ✅
- **Webhooks**: `app/api/webhooks/google-calendar/route.ts:17` validates the `x-goog-channel-token` against a secret. ✅
- **Unsubscribe**: HMAC-signed tokens via `verifyUnsubscribeToken`, with legacy raw-param requests explicitly rejected. ✅
- **Content routes**: gated by `requireTeacher()` (`app/api/content/_lib/require-teacher.ts`). ✅
- **API auth**: 54 routes wrapped in `withApiAuth` (cookie session or API-key bearer + `loadAuthedProfile` role loading); the rest checked individually resolve to OAuth callbacks or tokened endpoints.
- **Boundary hygiene**: zero `dangerouslySetInnerHTML`; no `.env` files tracked in git; no `NEXT_PUBLIC_` secrets (anon keys only — public by design); **no client component imports the admin client**; `proxy.ts` sets CSP + security headers and enforces deactivation/admin gates. (Caveat: one deliberate token leak exists — the Spotify callback, §7.3 High — so "no secret ever logged" does **not** hold repo-wide.)
- **Auth flows**: sign-in/up/reset/invite under `app/(auth)/`; session validated in `proxy.ts` for pages and `withApiAuth`/`getUserWithRolesSSR` server-side; `guardTestAccountMutation` protects demo accounts from mutation.

### 7.2 The systemic weakness: service-role sprawl — with a live, confirmed exploit

**42 files under `app/api` use `createAdminClient()`** (`lib/supabase/admin.ts:5`), each bypassing RLS and re-implementing tenant/role scoping in JavaScript. This is not a theoretical risk — the lessons list route is a **confirmed CRITICAL IDOR** (verified against source, not inferred):

- `app/api/lessons/route.ts:31` builds the admin client and hands it to `getLessonsHandler` (`app/api/lessons/handlers/get.ts:38`). The handler applies **only optional caller-supplied `userId`/`studentId` filters** (`get.ts:14-20`) and **no role scoping**. The comment at `get.ts:68` — _"Visibility (admin/teacher/student) enforced by RLS — see ADR-0001"_ — is **false**, because `createAdminClient()` bypasses the very RLS it cites. Any authenticated user (including a student) who calls `GET /api/lessons` with no filters receives **every lesson system-wide**, with each student's and teacher's `full_name` + `email` joined in (`get.ts:61-63`).
- `app/api/lessons/[id]/route.ts:16-28` has the same defect: admin client, `.eq('id', id)`, no ownership check, carrying the same false RLS comment (`:12-14`). Any authed user reads any lesson by id.

**This also means the RLS cross-read isolation test (commit `6ecf57a0`) gives false confidence** — it proves isolation at Supabase's `/rest/v1/` layer, but these API routes go _around_ that layer. Contrast `app/api/assignments/handlers.ts:57-61`, which scopes correctly and shows the pattern the lessons routes should follow.

RLS — the platform's strongest guarantee, backed by 313 policies — is silently not the enforcement boundary for a third of the API surface. **This is the single most important issue in the repo.**

### 7.3 Individual findings (all verified against source)

| Severity     | Finding                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Lessons IDOR (§7.2) — `app/api/lessons/route.ts:31` + `handlers/get.ts:38-81` + `[id]/route.ts:16-28`. Any authenticated user reads all lessons + joined student/teacher emails. Fix: switch these routes to the RLS server client, or scope by `roles`/ownership as `assignments/handlers.ts` does.                                            |
| **High**     | `app/api/spotify/callback/route.ts:66` writes the Spotify **refresh token to `console.log`** (→ Vercel logs) and `:73` reflects it into the redirect URL (`?refresh_token=…`, exposed via browser history/referrer). Route validates no OAuth `state` (connect-CSRF). Stop logging it; deliver the token server-side; add `state` validation.   |
| Medium       | Open redirect: `app/auth/callback/route.ts:10` reads `next` unvalidated and redirects to `${origin}${next}` (`:45,55`); `?next=@evil.com` / `?next=.evil.com` escape the origin, and `:46-47` trust attacker-controllable `x-forwarded-host`. Password reset flows through here. Fix: require `next.startsWith('/') && !next.startsWith('//')`. |
| Medium       | `app/api/admin/set-passwords/route.ts:23` — bulk password-set gated by a **non-constant-time `!==` compare** of the service-role key as bearer, with **no rate limiter** (only a 250ms inter-item delay). A network-reachable password-reset primitive that sends the god-key over HTTP. Should be a CLI/script, not a route.                   |
| Medium       | Over-broad admin gates: `app/api/admin/link-shadow-user/route.ts:23` allows `isAdmin \|\| isTeacher` (not admin-only) before service-role FK re-parenting + profile DELETE by arbitrary id; same teacher-permitted pattern on `admin/drive-sync` and `admin/drive-videos`.                                                                      |
| Medium       | Service-role sprawl (§7.2) — 42 files, hand-rolled authorization; the lessons IDOR is the proven instance, others are unaudited.                                                                                                                                                                                                                |
| Low          | Email PII in logs: `app/auth/actions.ts:234` (`Password reset failed for ${email}`) and the rate-limit warn (~`:205`) log full email addresses.                                                                                                                                                                                                 |
| Low          | `app/api/spotify/matches/[songId]/route.ts:5` (GET) — authed but no role check; any user reads pending Spotify match candidates.                                                                                                                                                                                                                |
| Low          | `audit_log` partitions without their own RLS enable (§5.2); `USING (true)` policies in `rls_lesson_songs` / `skills_tracking` migrations — verify intentional.                                                                                                                                                                                  |
| Low          | Committed credentials: `bruno-results-local.json:37` holds a real (local, expired) GoTrue session `access_token` + `refresh_token`; `logs/server_debug_3.log:94` leaks `password=test123_admin` in a URL. `git rm --cached` both and gitignore `bruno-results-*.json` + `logs/*.log`.                                                           |
| Info         | `.env.local.bak` on disk (untracked) — delete; secrets in backups evade rotation.                                                                                                                                                                                                                                                               |

**Rate limiting (positive)**: `lib/auth/rate-limiter.ts` (Supabase-RPC-backed) covers login/signup/resend/password-reset (`app/auth/actions.ts:52,133,188,211`); AI actions via `enforceRateLimit` (`lib/ai/registry/core.ts:85`); email/notification sends via `lib/email/rate-limiter.ts`. The notable gap is `set-passwords` (above). No dedicated invite route exists — confirm any invite server action calls `enforceRateLimit`.

---

## 8. Ranked Tech-Debt Hotspots

0. **[P0 — SECURITY] Lessons IDOR** (§7.2/§7.3) — `GET /api/lessons` and `/api/lessons/[id]` leak all lessons + student/teacher emails to any authenticated user via the RLS-bypassing admin client. Confirmed against source. Plus the Spotify refresh-token leak (§7.3, High). Fix this week, before any of the below.
1. **Triple write path + quadruple read path** (§2.3) — every feature pays a "which pattern?" tax; cache invalidation and authz behave differently per path. The root cause of most other drift.
2. **Service-role authorization sprawl** (§7.2) — 42 files re-implementing what RLS already enforces; the lessons IDOR is the proven instance, the other 41 are unaudited. Highest security-relevance debt.
3. **Quarantined/rotted test suites + floor-level coverage** (§6.2) — the safety net has documented holes exactly where change velocity is highest (forms, auth pages).
4. **Parallel UI generations** (`components/v2/`, `_editorial/`, base + `use-ui-version.ts`) — 1,042 component files; the editorial layer alone is 68 files / 9,490 LOC of variants, and `AssignmentList` exists 6×. Every visual change potentially needs doing twice.
5. **Oversized service/notification cluster** (§4.2) — `user.service.ts` 583, notification trio ~1,470 LOC combined; the files hardest to change safely. Plus six Supabase client entrypoints with ~405 raw client-creation call sites — no single chokepoint for connection behavior.
6. **Dependency duplication** (nivo+recharts, exceljs+xlsx, Radix umbrella+granular, full googleapis) — bundle weight and upgrade surface.
7. **API-tree drift** — singular/plural twins, four overlapping lesson-stats routes, 124 routes total with no inventory doc (`npm run audit:routes` exists — use it).
8. **Repo hygiene** — self-symlink, `.LEGACY_DATA/`, committed media/report artifacts, stray non-timestamped files inside `supabase/migrations/`, dead `cypress/`.
9. **Docs drift** — CLAUDE.md claims 5 E2E specs (there are 44), 70% coverage minimum (config says 30–40%), version 0.113.0 (repo is 0.158.5). Stale docs mislead every future agent session.

---

## 9. Recommendations

### Fix this week (security — do before anything else)

| #   | Action                                                                                                                                                                                                                                                                                                                                                                         | Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| S1  | **Close the lessons IDOR**: switch `app/api/lessons/route.ts` + `[id]/route.ts` from `createAdminClient()` to the RLS server client, or add explicit `roles`/ownership scoping in `handlers/get.ts` mirroring `app/api/assignments/handlers.ts:57-61`. Delete the false "enforced by RLS" comments. Add a regression test that a student cannot list another student's lesson. | ~3–4h  |
| S2  | **Stop leaking the Spotify refresh token**: remove the `console.log` at `spotify/callback/route.ts:66`, drop `refresh_token` from the redirect URL (`:73`), deliver it server-side; add OAuth `state` validation.                                                                                                                                                              | ~2h    |
| S3  | Fix the open redirect in `app/auth/callback/route.ts` — require `next.startsWith('/') && !next.startsWith('//')` before redirecting.                                                                                                                                                                                                                                           | ~1h    |
| S4  | `set-passwords`: constant-time key compare + rate limiter, or (better) delete the route and move logic to `scripts/` (see quick-win 8). Restrict `admin/link-shadow-user` + `admin/drive-*` gates to admin-only.                                                                                                                                                               | ~2–3h  |
| S5  | Untrack committed secrets: `git rm --cached bruno-results-local.json logs/server_debug_3.log`; gitignore `bruno-results-*.json` + `logs/*.log`. Stop logging full emails in `app/auth/actions.ts`.                                                                                                                                                                             | ~1h    |

### Quick wins (hours each)

| #   | Action                                                                                                                                                                                                                                                                                                                           | Effort |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Delete the self-referencing `guitar-crm` symlink; add defensive gitignore entry. Remove `cypress/`, `.env.local.bak`, confirmed-dead `components/lessons/form/LessonForm.SongSelect.old.tsx` and `components/landing/_legacy/`, committed `all-journeys.mp4` / `bruno-results-*.json` / lighthouse reports (gitignore the dirs). | ~1h    |
| 2   | Move `ROLLBACK_*.sql`, `VALIDATION_*.sql`, `fix_track_user_changes.sql`, and the two `.md` files out of `supabase/migrations/` into `supabase/ops/` or docs.                                                                                                                                                                     | ~1h    |
| 3   | Pin Node: `engines.node` + `.nvmrc`; align `eslint-config-next` with the `next` version.                                                                                                                                                                                                                                         | ~1h    |
| 4   | One migration: `ENABLE ROW LEVEL SECURITY` on `audit_log_default` / partitions; review the two pre-2026 `USING (true)` policies.                                                                                                                                                                                                 | ~2h    |
| 5   | Retire `xlsx` (dev) in favor of `exceljs`; decide umbrella-vs-granular Radix and remove the loser.                                                                                                                                                                                                                               | ~2–3h  |
| 6   | Update CLAUDE.md to reality (version, E2E count, actual coverage floors, `proxy.ts` not `middleware.ts`) — it is the context every agent session loads.                                                                                                                                                                          | ~1h    |
| 7   | Convert `max-lines`/`max-lines-per-function` ESLint warns to errors **for new files only** (via overrides), so the 200/150/50 limits stop being advisory going forward.                                                                                                                                                          | ~2h    |
| 8   | Relocate `app/api/admin/set-passwords` logic to a script under `scripts/` and delete the route.                                                                                                                                                                                                                                  | ~2h    |

### Strategic investments (days → weeks)

| #   | Action                                                                                                                                                                                                                                                                                          | Payoff                                                       | Effort             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------ |
| 1   | **Pick one write path** (recommend: Server Actions for app-internal mutations; keep API routes only for external/API-key consumers) and migrate lessons + songs to it. Delete the losing path per entity as you go.                                                                             | Kills hotspot #1; every future feature has one pattern       | 1–2 wk incremental |
| 2   | **Service-role reduction campaign**: inventory the 42 `createAdminClient` call sites; for each, either (a) switch to the RLS client, or (b) document why service-role is required (cron, admin aggregates) and add a test. Target: service-role only in `app/api/cron/*` and a short allowlist. | RLS becomes the real boundary; IDOR class largely eliminated | 1–2 wk incremental |
| 3   | **Un-quarantine the test backlog**: burn down `jest.config.ts:109-151` starting with auth pages and the three entity forms; then raise coverage floors 5 points per release until ~60%.                                                                                                         | Restores the safety net where it matters most                | 3–5 days           |
| 4   | **Finish the UI migration**: pick the surviving generation (v2/editorial vs base) per surface, migrate, delete `use-ui-version.ts` and the losing tree. Component count should drop by hundreds of files.                                                                                       | Halves UI maintenance; kills hotspot #4                      | 2–4 wk incremental |
| 5   | **Consolidate charting** on one library (recharts is the more mainstream choice; nivo covers calendar/sunburst — audit which charts actually exist first).                                                                                                                                      | Bundle size, single upgrade path                             | 2–3 days           |
| 6   | **Merge the three logging dirs** into `lib/observability/` with one pino-based API; the notification-logger (420 LOC) becomes a thin domain wrapper.                                                                                                                                            | Simplifies hotspot #5's worst cluster                        | 2–3 days           |
| 7   | **Wire Playwright smoke tier into CI** (`test:pw:smoke` on PR, full matrix nightly) so the excellent E2E suite actually gates merges.                                                                                                                                                           | E2E regressions can't reach main unnoticed                   | 1–2 days           |

### Sequencing note

Do quick wins 1–8 in one hygiene PR-batch first (they're independent and low-risk). Then strategic #2 (service-role reduction) before #1 (write-path consolidation) — consolidating write paths is much easier once every path uses the RLS client, because the authz code you'd otherwise have to port simply disappears.

---

_Method: static analysis only — file reads, `grep`/`wc` scans over `app/`, `components/`, `lib/`, `schemas/`, `supabase/migrations/`, `__tests__/`, `tests/`, and configs, cross-checked by parallel read-only exploration agents. No live database, no test execution, no network audit (`npm audit` unavailable offline). Line numbers reference HEAD `76d866ee`._

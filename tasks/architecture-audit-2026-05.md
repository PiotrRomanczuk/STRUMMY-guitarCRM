# Architecture Audit — 2026-05

## Summary

Strummy is in **decent shape for a ~20-30 DAU SaaS** but is showing classic
"organic growth" tech debt: a partial v1 → v2 component migration, several
peripheral feature directories that shipped to ~80% and stopped, an AI
subsystem that's clearly the most architected area while notification and
content domains feel improvised. TypeScript strictness is on (no
`noImplicitAny` violations besides the ~47 explicit `any` annotations in
production code), and direct Supabase usage from components is a recurring
layering concern (~50 files import `@/lib/supabase/*` from `components/`).

Top 3 risks:

1. **v1/v2 component duplication** with no decommission plan — `components/`
   and `components/v2/` both ship live UI, with overlapping features
   (`song-of-the-week`, `cohorts`, `dashboard`, etc). Cost compounds with
   every new feature.
2. **Migrations directory is a graveyard** — 145 files in
   `supabase/migrations/`, plus `migrations_backup/`, plus stray
   `ROLLBACK_*.sql`, `VALIDATION_*.sql`, and a `999_simplify_student_status.sql`
   numbered out of band. Hard to reason about prod schema state from git.
3. **Notification subsystem complexity** — 7+ files in `lib/services/notification-*`
   plus `lib/logging/notification-logger.ts` (420 LOC) plus
   `lib/services/notification-monitoring.ts` (542 LOC). The architecture has
   grown organically and is the largest cluster of >300 LOC files outside AI.

Overall recommendation: **freeze v1 components**, rip out cohorts (cheap,
cleanly bounded), and treat the migrations directory + notifications
subsystem as the next two refactor campaigns. Do NOT start new peripheral
features (theory courseId pages, fretboard sidebar, etc.) until the v1/v2
story is resolved.

---

## Findings by category

### 1. Oversized files

Excluding generated DB types (2876 + 2355 LOC; acceptable as generated).

**Egregious server-side files (>400 LOC)**:

- `app/actions/ai.ts` — **1140 LOC**. Single file holds all AI server actions.
  Top candidate for splitting by AI agent / concern.
- `lib/services/user.service.ts` — 583 LOC. Likely needs split by use case
  (invite, profile, role mgmt).
- `lib/services/notification-monitoring.ts` — 542 LOC.
- `lib/services/notification-service.ts` — 479 LOC.
- `lib/repositories/user.repository.ts` — 458 LOC.
- `app/api/assignments/handlers.ts` — 464 LOC.
- `app/api/lessons/handlers.ts` — 437 LOC.
- `app/dashboard/actions.ts` — 432 LOC (mixed dashboard concerns).
- `lib/ai/providers/openrouter.ts` — 428 LOC.
- `lib/logging/notification-logger.ts` — 420 LOC.
- `app/dashboard/theory/actions.ts` — 411 LOC.
- `app/api/users/route.ts` — 411 LOC (route handlers should delegate).
- `lib/services/cohort-analytics.ts` — 410 LOC (will be deleted).

**Components >300 LOC** (rule says max 200):

- `components/ui/sidebar.tsx` — 727 LOC. shadcn sidebar primitive — likely
  vendored as-is; tolerate or extract usage layer.
- `components/songs/student/StudentSongDetailPageClient.tsx` — 524 LOC.
- `components/logs/SystemLogs.tsx` — 492 LOC (peripheral; low priority).
- `components/dashboard/admin/SpotifyMatchesClient.tsx` — 484 LOC.
- `components/songs/details/SpotifyMatchDialog.tsx` — 432 LOC.
- `components/dashboard/admin/drive-videos/ReviewQueueTable.tsx` — 404 LOC.
- `components/onboarding/OnboardingForm.tsx` — 379 LOC.
- `components/navigation/AppSidebar.tsx` — 366 LOC.
- `components/auth/SignUpForm.tsx` — 365 LOC.
- `components/assignments/AssignmentsList.tsx` — 365 LOC.
- 20+ more in 200–350 LOC range; cluster mostly in `dashboard/admin`,
  `songs/`, `auth/`, `landing/`.

**Hooks >150 LOC** (rule says max 150):

- `hooks/useAIStream.ts` — 351 LOC (largest hook in repo).
- `components/lessons/hooks/useLessonForm.ts` — 241 LOC.
- `hooks/useDatabaseStatus.ts` — 220 LOC.
- `components/dashboard/admin/drive-videos/useDriveVideos.ts` — 217 LOC.
- `components/auth/useSignUpLogic.ts` — 211 LOC.
- `components/users/hooks/useUserFormState.ts` — 206 LOC.
- `components/notifications/useNotifications.ts` — 190 LOC.

**Cluster pattern**: oversized files concentrate in (a) `app/actions/*.ts`
single-file action collections, (b) `app/api/*/handlers.ts` aggregator files,
and (c) `lib/services/notification-*` and `lib/services/user.service.ts`.

### 2. `any` type usage

**~47 occurrences** in production code (excluding tests and
`database.types.generated.ts`). Hot spots:

| File                                           | Count  | Notes                         |
| ---------------------------------------------- | ------ | ----------------------------- |
| `lib/testing/test-utils.ts`                    | 11     | Test helper, OK to defer      |
| `components/ui/drawer.tsx`                     | 4      | Vendored shadcn — leave       |
| `components/debug/DatabaseStatus.tsx`          | 4      | Debug-only, low priority      |
| `app/api/lessons/handlers.ts`                  | 4      | **Production hot spot — fix** |
| `lib/testing/integration-helpers.ts`           | 3      | Test helper, defer            |
| `components/songs/form/Content.tsx`            | 2      | Forms — fix                   |
| `components/notifications/useNotifications.ts` | 2      | Fix                           |
| `components/lessons/hooks/useLessonForm.ts`    | 2      | Fix                           |
| `app/dashboard/songs/[id]/actions.ts`          | 2      | Server action — fix           |
| various `lib/*` files                          | 1 each | Fix opportunistically         |

**Suggested elimination order:** start with the 4 server-side hits in
`lessons/handlers.ts`, `users/route.ts` neighbours, and song actions, since
those touch business logic. Test helpers can stay typed as `any` longer.

`tsconfig.json` already has `strict: true` and Next.js project, so adding a
`"noExplicitAny"` ESLint rule would catch all 47 in CI.

### 3. Duplicate / extractable patterns

- **v1 vs v2 components** — biggest duplication source. Both
  `components/song-of-the-week/` and `components/v2/song-of-the-week/` exist.
  Both `components/dashboard/cohorts/` and `components/v2/cohorts/` exist.
  Pattern repeats for songs, lessons, users, settings. No deprecation
  markers. **Pick one and delete the other.** This is bigger than any single
  refactor below.

- **Two student-songs page clients** — both
  `components/songs/student/StudentSongDetailPageClient.tsx` and
  `components/student/songs/StudentSongDetailPageClient.tsx` exist with
  similar names. Likely one is dead. Audit imports.

- **Duplicate Supabase client construction** — 50+ component files create
  Supabase clients directly via `createClient`. There's a service layer in
  `lib/services/` and `lib/repositories/` but it's bypassed casually. Either
  enforce the layer or admit defeat and document the policy.

- **Duplicate mutations infrastructure** — `lib/mutations/` and
  `lib/queries/` exist (TanStack Query layer), `lib/repositories/`
  (1 file: `user.repository.ts`), `lib/services/` (~25 files), and
  `lib/api/unified-db.ts`. Four overlapping abstractions. Pick the canonical
  one.

- **AI generations vs AI conversations** — `app/actions/ai-history.ts`
  (lists `ai_generations`) and `app/actions/ai-conversations.ts` (lists
  `ai_conversations`). Similar shape, different tables, similar pagination
  helpers. Likely an evolution where conversations replaced one-shot
  generations but the old code stayed.

- **SyncSpotifyButton** — both
  `components/songs/list/SyncSpotifyButton.tsx` (354 LOC) and
  `components/songs/details/SyncSpotifyButton.tsx` (275 LOC). Similar
  enough to share a hook.

### 4. Layering violations

- **Components creating Supabase clients directly**: ~50 files in
  `components/` import `@/lib/supabase/{client,server}` and bypass the
  service layer. Examples:
  `components/songs/student/StudentSongDetailPageClient.tsx`,
  `components/auth/SignInForm.tsx`,
  `components/student/songs/StudentSongsPageClient.tsx`. For auth this is
  acceptable; for data-fetching it short-circuits the abstraction.

- **Component importing from `app/api/`**:
  `components/lessons/list/index.tsx` imports from `@/app/api/...`. Only
  one occurrence, easy fix — extract the type/util to `lib/`.

- **`RouteError` references cohorts in JSDoc** —
  `components/shared/RouteError.tsx` uses `cohorts` as the example in its
  doc comment. Cosmetic; rename to `lessons` after cohort removal.

- **AI server actions co-located with route handler logic** —
  `app/actions/ai.ts` (1140 LOC) blends server actions with helper logic
  that belongs in `lib/ai/`. Pull pure helpers down.

### 5. Half-finished features

#### Theory (`/dashboard/theory`)

- Has `[courseId]/`, `new/`, and `actions.ts` (411 LOC). Suggests a course
  authoring flow.
- Components: `components/theory/` and `components/v2/theory/` both exist.
- **Status**: peripheral, surface area implies more progress than usage
  warrants. Audit whether it ships to users.

#### Fretboard

- Only one page (`/dashboard/fretboard`), `FretboardPageClient.tsx`,
  duplicated as `components/fretboard/` and `components/v2/fretboard/`.
- **Missing**: no role differentiation, no tests (0 in components/fretboard).

#### Skills (`/dashboard/skills`)

- A page exists but is on the `DEMO_HIDDEN_ITEMS` list in
  `menuConfig.ts:51` — meaning it's hidden from demo accounts because it's
  not ready. This is a **soft "WIP" marker**.
- **Same is true for**: `cohorts`, `health`, `logs`, `chord-analysis`.
  All marked hidden in demo. Confirms they are peripheral / unfinished.

#### Drive (`drive-videos`)

- Heavy admin tooling (`ReviewQueueTable.tsx` 404 LOC,
  `DriveVideosClient.tsx` 273 LOC, `SyncedVideosTable.tsx` 271 LOC), service
  files (`drive-video-matcher.ts`, `drive-video-sync.ts`). No co-located
  tests. Functional but admin-only; survival depends on whether you keep
  using it.

#### Content (`/dashboard/content`)

- Subdirs: `calendar/` and `hashtags/`. Looks like an Instagram-adjacent
  content production workflow. Branch name on this audit
  (`feature/STRUM-content-production`) confirms it's in flight.

#### Practice

- `components/practice/` doesn't exist — only `components/v2/practice/`.
  Means practice is **v2-only**. Indicates v2 is a partial rewrite, not a
  full alternate UI. Owner needs to decide direction.

#### Cohorts — being removed (see plan below).

### 6. Test coverage holes

`__tests__/` distribution by domain (test files):

- `components/`: 20
- `api/`: 12
- `lib/`: 8
- `history/`: 4
- `dashboard/`: 3
- ad-hoc test files in root: 4

**Domains with zero co-located component tests**:

- `theory` (0)
- `skills` (0)
- `drive` (0)
- `content` (0)
- `notifications` (0)
- `ai` (0)
- `song-of-the-week` (0, both v1 + v2)

`fretboard` has 3 tests. CORE domains (lessons, songs, users, assignments,
auth, dashboard) are reasonably covered.

**Recommendation**: do NOT chase coverage on peripheral domains until they
have settled scope. Add tests when refactoring the notification subsystem.

### 7. Cross-cutting concerns

#### AI / LLM abstraction

- `lib/ai/` is the most architected area: `providers/` (openrouter, ollama),
  `agents/` (per-task agents — chat, lesson-notes, song-notes, etc.),
  `registry/`, `execution/`, `context/`, `tools/`, `schemas/`, retry,
  rate-limiter, queue-manager, streaming-analytics. Looks **healthy**.
- `lib/ai/providers/openrouter.ts` is 428 LOC; could split request/response
  shaping from the client.
- Leakage: `app/actions/ai.ts` (1140 LOC) does too much — should be a thin
  shim over `lib/ai/`. The abstraction is good; the consumer just isn't
  using it cleanly.

#### Notification system

- 7 service files: `notification-service.ts` (479 LOC),
  `notification-monitoring.ts` (542 LOC), `notification-queue-processor.ts`,
  `notification-helpers.ts`, `notification-in-app-content.ts`,
  `in-app-notification-service.ts`, plus `lib/logging/notification-logger.ts`
  (420 LOC).
- Server actions: `app/actions/in-app-notifications.ts`,
  `app/actions/notification-preferences.ts`.
- Email retry/template layer: `lib/email/retry-handler.ts`,
  `lib/email/templates/base-template.ts`.
- **Coherence**: medium. Naming overlaps (`notification-service` vs
  `in-app-notification-service`), no obvious owner-of-record file. Hard to
  enter cold.
- **Recommendation**: a "Notifications" domain README in
  `lib/services/notifications.md` describing the data flow (event →
  in-app row → email fanout → unsubscribe). One day's refactor.

#### Server actions vs API routes

- Songs: server actions in `app/actions/songs.ts`, API in `app/api/song/`.
- Users: server action in `app/actions/identity.ts`, API in `app/api/users/`.
- Assignments: server action `app/actions/assignments.ts` and API
  `app/api/assignments/handlers.ts` (464 LOC).
- **Both patterns are in active use** for the same entities. Probably
  intentional (server actions for in-app forms, API for external/cron),
  but no documented boundary. Worth a one-page ADR.

### 8. Migration / config hygiene

- **145 SQL migrations** in `supabase/migrations/` — heavy, but expected for
  ~2 years.
- **Pollution**:
  - `999_simplify_student_status.sql` — out-of-band number, should be
    renamed to a real timestamp.
  - `ROLLBACK_040_in_app_notifications_priority_constraint.sql` —
    rollback file checked in (hopefully not auto-applied; verify).
  - `VALIDATION_in_app_notifications.sql` — non-migration validation file
    checked in to migrations dir.
  - `fix_track_user_changes.sql` — no timestamp prefix.
  - `migrations_backup/` (16 files) — separate backup folder; document its
    purpose or remove.
- **Top-level**: `DUMP_07_11_25.sql`, `increment_lesson_number.sql`,
  `seed.sql`, `seed.sql.bak`, `seed.sql.tmp`, `config.toml.backup`. Backups
  and tmp files committed. Clean up.
- **Env**: `.env.example` and `.env.local` only — clean, no
  `.env.production`/`.env.staging` sprawl. Good.

---

## Cohort removal plan

The cohort feature is **client-only analytics** that aggregates existing
tables (`profiles`, `lessons`, `student_song_progress`). **No cohort
tables exist in DB or generated types** (verified: `grep -i cohort
types/database.types.generated.ts` → 0 matches). No follow-up migration
required.

### Files to delete (12 source files + 1 test = 13 files)

```
app/dashboard/cohorts/page.tsx
app/dashboard/cohorts/error.tsx
app/api/cohorts/analytics/route.ts        (122 LOC)
lib/services/cohort-analytics.ts          (410 LOC)
lib/services/__tests__/cohort-analytics.test.ts
components/dashboard/cohorts/index.ts
components/dashboard/cohorts/CohortAnalytics.tsx        (90 LOC)
components/dashboard/cohorts/CohortAnalytics.Charts.tsx (93 LOC)
components/dashboard/cohorts/CohortAnalytics.Filters.tsx (72 LOC)
components/dashboard/cohorts/CohortAnalytics.Table.tsx  (65 LOC)
components/dashboard/cohorts/cohort.helpers.ts          (88 LOC)
components/dashboard/cohorts/useCohortAnalytics.ts      (62 LOC)
components/v2/cohorts/index.ts
components/v2/cohorts/CohortDashboard.tsx               (185 LOC)
components/v2/cohorts/CohortDashboard.Desktop.tsx       (15 LOC)
components/v2/cohorts/CohortCard.tsx                    (68 LOC)
components/v2/cohorts/SparklineBar.tsx                  (42 LOC)
```

(Then remove the now-empty parent directories
`app/dashboard/cohorts/`, `app/api/cohorts/`,
`components/dashboard/cohorts/`, `components/v2/cohorts/`.)

### Files to edit (5 nav/shared files)

1. `components/navigation/menuConfig.ts`
   - Line 51: remove `'cohorts'` from `DEMO_HIDDEN_ITEMS`.
   - Line 78: delete the cohorts menu entry
     `{ id: 'cohorts', label: 'Cohorts', icon: Users, path: '/dashboard/cohorts' }`.

2. `components/navigation/AppSidebar.tsx`
   - Line 117: delete the cohorts menu entry.

3. `components/navigation/HorizontalNav.tsx`
   - Line 69: delete the cohorts entry.
   - Line 109: remove `'cohorts'` from the `secondaryIds` Set.

4. `components/navigation/MobileMoreMenu.tsx`
   - Line 36: delete the cohorts entry.

5. `components/shared/RouteError.tsx`
   - Lines 12, 27, 29: replace the `cohorts` example in the JSDoc with
     `lessons` (cosmetic; not functional).

### Removal order (single PR ~30 min)

1. Run `grep -rln cohort` once to confirm only the files above match.
2. Delete the 13 source files.
3. Delete the 4 now-empty directories.
4. Edit the 5 nav/shared files.
5. Run `npm run lint && npm test && tsc --noEmit`.
   - There should be **zero broken imports** since nothing outside
     `components/{v2/,dashboard/}cohorts/` imports `cohort-analytics` or
     `useCohortAnalytics`.
6. PR title: `refactor: remove cohorts feature (#XXX)`.

### Required follow-up migration

**None.** No cohort tables exist in the schema. No data cleanup needed.

(For documentation completeness: if a future audit finds a `cohorts` or
`cohort_members` table, the follow-up migration would be:

```
-- migrations/<timestamp>_drop_cohorts_tables.sql
DROP TABLE IF EXISTS cohort_members CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
```

But this is **not currently needed**.)

---

## Roadmap (recommended)

Sequenced from highest leverage to lowest. **(B)** = before working-state
milestone closes; **(A)** = after.

### Half-day chunks

1. **(B) Remove cohorts** — single PR, ~30 min, unblocks nav cleanup.
   Pure debt removal. See plan above.

2. **(B) Migration directory cleanup** — rename `999_*.sql` to a proper
   timestamp; delete or move `ROLLBACK_*.sql`, `VALIDATION_*.sql`,
   `fix_track_user_changes.sql` outside migrations; document
   `migrations_backup/`'s purpose or delete it. Clean root-level
   `seed.sql.bak`, `seed.sql.tmp`, `config.toml.backup`,
   `DUMP_07_11_25.sql`. **~2 hours**, blocks confident schema reasoning.

3. **(B) Add ESLint rule banning `any` in production code** — with
   `// eslint-disable-next-line` allowed in test helpers. Forces the 47
   existing `any`s into a fix-or-ack list. **~1 hour**.

4. **(B) Single-page ADR: server actions vs API routes** — document when
   to use which (server actions = in-app form mutations bound to a route;
   API = external clients, cron, webhooks, exports). Stops the next
   inconsistency. **~1 hour**.

### 1-day chunks

5. **(A) v1/v2 component migration plan** — biggest single source of
   duplication. Pick ONE direction (likely v2-everywhere given new
   domains like `practice` are v2-only), produce a deletion checklist
   per domain, and treat each domain as a separate PR. **The plan itself
   is 1 day**; execution is N PRs over weeks.

6. **(A) Split `app/actions/ai.ts` (1140 LOC)** — move agent-specific
   actions into `app/actions/ai/` per agent, with thin `lib/ai/` calls.
   1 day, no behavior change, big readability win.

7. **(A) Notification system README + naming pass** — clarify
   `notification-service.ts` vs `in-app-notification-service.ts`,
   document the event → row → email → cron flow, split
   `notification-monitoring.ts` (542 LOC) by concern. 1 day.

8. **(A) Service layer enforcement** — move the ~50 component-level
   Supabase client uses behind `lib/services/` (auth flows excluded).
   Multi-day; do per-domain.

### Pure tech debt — pick up opportunistically

- Eliminate the 47 `any` annotations (after ESLint rule is in place).
- Split each oversized component as its file is touched for a feature
  change ("boy scout rule"); avoid a dedicated splitting sprint unless
  the `npm run lint` budget demands it.
- Decide the fate of `theory`, `skills`, `drive`, `content` after the
  v1/v2 decision lands. Some may be deletable.

### Items that unblock PRODUCT work

- Cohort removal: unblocks the nav cleanup and demo-mode polish.
- Migration cleanup: unblocks any schema confidence work.
- v1/v2 decision: unblocks every new feature touching shared components.

### Items that are pure tech debt (do AFTER milestone)

- `any` elimination.
- Splitting oversized files unless on the critical path.
- Notification README (helpful but not blocking).

---

## Audit metadata

- Date: 2026-05-07
- Scope: `app/`, `components/`, `lib/`, `hooks/`, `schemas/`, `types/`,
  `supabase/migrations/`. Excluded `node_modules/`, `.next/`, generated
  DB types from oversize counts, test files from `any` counts.
- LOC threshold for components: 200; for hooks: 150; per project
  CLAUDE.md.
- Cohort scan: `grep -rli cohort` across all source paths; 22 files
  found, 17 to delete, 5 to edit.

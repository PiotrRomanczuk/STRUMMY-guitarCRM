# Strummy — Master Spec: The Road to 100%

**Date**: 2026-06-16
**Author**: Claude (grilled by Piotr)
**Scope**: The single, authoritative definition of "Strummy at 100%" — functional completeness _and_ component consolidation — with implementation-grade per-feature specs.
**Status**: Living. Updated in place until 100% is reached.

**Supersedes**: `docs/2026-06-10-road-to-100-todo.md` (absorbed in full and **deleted** in the 2026-06-16 docs consolidation — recover via `git log --all -- docs/2026-06-10-road-to-100-todo.md`) and `tasks/design-preview/production-plan.md` (retained under a "Superseded by" header, no longer maintained).
**References (kept as separate layers, not absorbed)**:

- `CONTEXT.md` — the domain model / ubiquitous language. The source of truth for _what the words mean_.
- `docs/adr/0001` (RLS is the security boundary), `0002` (shadow students are first-class), `0003` (unified Pino logger). The source of truth for _settled architectural decisions_.
- `docs/2026-06-10-backend-audit.md` — the audit whose findings Phase 0 closes.
- `docs/audits/2026-06-09-schema-reconciliation.md` — the drift investigation Phase 0.1 acts on.

> This document is the one tracker. When it conflicts with any older planning doc, this wins. When it conflicts with `CONTEXT.md` or an ADR, **those** win (they are deeper layers — domain and decisions — and this spec must conform to them).

---

## 0. Definition of "100%"

Strummy is at 100% when **every one of these is true**:

**Product-level exit criteria** (inherited from road-to-100, unchanged):

1. **No Coming-soon page reachable from nav.** Every nav destination renders a real, working feature.
2. **No flow strands a user.** No dead-end (MFA branch, shadow invite, half-built OAuth).
3. **No silent failure.** No swallowed `.from()` error on a real user flow; crons return 200.
4. **Every core table is RLS-tested** against a real Supabase instance.
5. **PR CI runs smoke E2E and a blocking coverage gate.**

**Per-feature contract** — a feature section in §2 is _done_ only when all five hold:

| ✓   | Gate                      | Meaning                                                                                                                              |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ☐   | **Behavior complete**     | No stub, no Coming-soon, the full user story works for every role.                                                                   |
| ☐   | **No silent failure**     | Every backend call has a live table/RPC; errors surface, not swallow.                                                                |
| ☐   | **RLS-tested**            | The feature's tables have a real-Supabase RLS test (`jest.config.rls.ts`).                                                           |
| ☐   | **Renders via editorial** | The route mounts `components/<domain>/editorial/*`. No `ui-version` cookie branch.                                                   |
| ☐   | **v1/v2/v3 deleted**      | The old `components/<domain>/*` (v1), `components/v2/<domain>/*`, and `components/v2/stitch` (v3) trees for this domain are removed. |

This contract unifies the two historical tracks: **functional completeness** (gates 1–3) and **component consolidation** (gates 4–5).

---

## 1. Phase 0 — Restore Truth (BLOCKING)

> Nothing downstream is trustworthy until Phase 0 lands. **Full spec: [specs/00-phase-0-restore-truth.md](./specs/00-phase-0-restore-truth.md).** Every feature spec (01–10) assumes Phase 0 is complete.

**Decision:** restore schema buckets A+B, delete C+D (ledger D-04). Production ref `zmlluqqqwrfhygvpfqka`.

| Sub | Task                                                                     | Done when                                                           |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 0.1 | Resolve the 14-table schema drift (restore A+B / delete C+D)             | `supabase db diff` vs prod empty; no live call sites for bucket C/D |
| 0.2 | Reconcile migration history                                              | `supabase migration list` matches repo 1:1                          |
| 0.3 | Consolidate bearer auth → `withApiAuth()`                                | `rg "bearer-auth"` empty; Bruno passes with a `gcrm_` key           |
| 0.4 | Fix the 500-ing crons                                                    | each cron returns 200 in prod + a regression test                   |
| 0.5 | Audit the `SECURITY DEFINER` view (`v_teacher_lesson_trends`)            | a student query returns only student-visible rows                   |
| 0.6 | Restore CI signal (quarantine triage · bulk-DELETE 400 guard · CI gates) | PR runs smoke E2E + a blocking coverage gate                        |

> ✅ **Resolved (2026-06-16):** `auth_events` is reclassified **bucket C → bucket A (restore)**. It is the audit trail for the shadow invite/link lifecycle (ADR-0002) and `lib/auth/auth-event-logger.ts` / [specs/06](./specs/06-auth-shadow.md) write to it (spec 06 adds 3 new event values). Apply its migration to prod alongside the notification tables; the `cleanup-auth-events` cron stays valid. See [specs/00](./specs/00-phase-0-restore-truth.md) §0.1/§0.4.

---

## 2. Feature Specs (the spine)

Each feature has a standalone, code-grounded, implementation-grade spec under [`specs/`](./specs). This section is the index; the detail (user stories · data contracts · current-state deltas · files · edge cases · acceptance test names · 5-point DoD) lives in each file. The per-feature **5-point Definition of Done** (behavior · no-silent-failure · RLS-tested · editorial · v1/v2/v3 deleted) is defined in §0.

| #   | Feature               | Spec                                                           | Phase | Scope                                                                                |
| --- | --------------------- | -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| 01  | Songs                 | [01-songs.md](./specs/01-songs.md)                             | 2     | List (filters/pagination) + edit form; editorial; delete v1/v2/v3                    |
| 02  | Lessons               | [02-lessons.md](./specs/02-lessons.md)                         | 2     | Create/edit + Google calendar sync + inline shadow-create                            |
| 03  | Assignments           | [03-assignments.md](./specs/03-assignments.md)                 | 2     | Create/detail/edit + status state machine + notify                                   |
| 04  | Users                 | [04-users.md](./specs/04-users.md)                             | 2     | List/detail/edit + **soft-delete** (D-09) + shadow badge                             |
| 05  | Repertoire & Practice | [05-repertoire-practice.md](./specs/05-repertoire-practice.md) | 2     | Repertoire read/edit (role-scoped) + practice log (immutable + same-day undo, D-08)  |
| 06  | Auth & Shadow         | [06-auth-shadow.md](./specs/06-auth-shadow.md)                 | 2     | Invite flow, email chokepoint, MFA remove (D-06), Google sign-in (D-07), lockout     |
| 07  | Google Calendar       | [07-calendar.md](./specs/07-calendar.md)                       | 3     | Mount UI, conflicts, polling cron, recurring, refresh, disconnect, webhook hardening |
| 08  | Notifications         | [08-notifications.md](./specs/08-notifications.md)             | 2     | In-app + email on restored bucket-A tables; preferences; unsubscribe                 |
| 09  | Content / Production  | [09-content-production.md](./specs/09-content-production.md)   | 2     | ProductionTab only; remove standalone content from nav (D-10)                        |
| 10  | Profile & Multi-role  | [10-profile-multirole.md](./specs/10-profile-multirole.md)     | 2     | Self-edit form + multi-role rendering sweep                                          |

> **Universal rule (every feature):** the route mounts `components/<domain>/editorial/*`; RLS is the security boundary (ADR-0001); deleting the v1/v2/v3 trees for that domain is part of done (§3.2).

### Code-audit corrections (2026-06-16)

The spec files were written against the live code and surfaced divergences from the original §2 assumptions. Authoritative detail is in each spec; the load-bearing ones:

- **Songs list bypasses RLS** — `app/api/song` GET runs under `createAdminClient()`, so students are **not** scoped on the list today (detail/edit do use RLS). Security-relevant — see [specs/01](./specs/01-songs.md).
- **User delete is HARD today** across all three paths (not soft) — [specs/04](./specs/04-users.md) makes soft-delete net-new; `is_active` exists but **no RLS predicate uses it** yet.
- **Lesson create has no shadow-create** — `createLessonHandler` requires an existing `student_id`; inline shadow-create is net-new ([specs/02](./specs/02-lessons.md)).
- **Student assignment-status blocked at RLS** — `assignments_update_policy` admits only admin/teacher; a student-status-only UPDATE policy is net-new ([specs/03](./specs/03-assignments.md)).
- **Google sign-in already built** — `app/auth/callback` + `handleGoogleSignIn` exist; D-07 becomes verify/harden, not implement ([specs/06](./specs/06-auth-shadow.md)).
- **Calendar:** `syncAllTeacherCalendars()` **is** called (dispatcher cron) and `singleEvents=true` is **already** set — the real gap is per-instance dedupe ([specs/07](./specs/07-calendar.md)).
- **Practice undo needs stat reversal** — the metrics trigger is AFTER INSERT only (no decrement), so same-day undo must reverse `total_practice_minutes`/counts ([specs/05](./specs/05-repertoire-practice.md)).
- **Deliverable-email chokepoint is net-new** — senders currently use `recipient.email` directly ([specs/08](./specs/08-notifications.md)).

---

## 3. Cross-Cutting Concerns

### 3.1 RLS — the security boundary (ADR-0001)

RLS is the only place membership is enforced; app code never duplicates the `WHERE`. Phase 4 extends `jest.config.rls.ts` (real Supabase, serial) to every core table:

- `assignments.rls.test`, `profiles.rls.test`, `practice-sessions.rls.test`, `student-repertoire.rls.test`, plus the §0.5 `SECURITY DEFINER` view fix test.
- **Done when:** every table named in a §2 contract has an RLS test asserting teacher isolation + student own-only.

### 3.2 Editorial consolidation — sole survivor (§6 ledger D-05)

Editorial becomes the **only** generation. Per domain, as its feature section lands:

1. Mount `components/<domain>/editorial/*` directly at the route (no cookie branch).
2. Delete `components/<domain>/*` (v1), `components/v2/<domain>/*`, and the matching `components/v2/stitch` (v3) views.
3. `rg` for stragglers; `tsc --noEmit` after each deletion to catch orphan imports (e.g. v2 importing the v1 `useSongDetail`).

At 100% (after all domains migrate): delete `lib/ui-version.ts`, `lib/ui-version.server.ts`, `AppShellV2`, and the `strummy-ui-version` cookie. One generation, no runtime switching. Immediate cleanup target already unblocked: `components/songs/details/*` (~1900 LOC) and `components/v2/songs/SongDetailPage.tsx` (both unreachable since `/dashboard/songs/[id]` mounts editorial — note: there is in fact **no** `components/v2/songs/SongDetailPage.tsx`; v2 songs is list-only).

#### Editorial UI inventory (verified 2026-06-16)

8 editorial directories, 30 files. Per-component detail is in each feature spec's "Editorial UI — current implementation" section. **The dominant pattern: read surfaces are wired to real data; write surfaces are unbuilt or orphaned** — so per-domain v1/v2/v3 deletion (gate 5) is blocked in every domain until the write half is (re)built in editorial. Several finished components are **built but not mounted/reachable** (calendar controls, ProductionTab, notification preferences).

| Domain              | Editorial dir                      | Read surface                                                                                                                          | Write surface                                                                                                                           | Owning spec                             |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Songs               | `songs/editorial` (12 files)       | list **partial** (RLS-bypassed via admin client; missing key/author filters), detail **wired**                                        | edit form **partial** (scalar only, no sections)                                                                                        | [01](./specs/01-songs.md)               |
| Lessons             | `lessons/editorial` (4)            | list + detail **wired**                                                                                                               | **none** — no create/edit form (net-new)                                                                                                | [02](./specs/02-lessons.md)             |
| Assignments         | `assignments/editorial` (1)        | list **wired** (status read-only)                                                                                                     | **none** — no detail/create/edit/status control                                                                                         | [03](./specs/03-assignments.md)         |
| Users               | `users/editorial` (1)              | student detail **wired** (read-only)                                                                                                  | **none** — list + edit are stubs; no invite/soft-delete/badge                                                                           | [04](./specs/04-users.md)               |
| Repertoire/Practice | — (none)                           | read-only summaries only (in dashboards/sidebar)                                                                                      | **none** — no editorial page; practice route absent                                                                                     | [05](./specs/05-repertoire-practice.md) |
| Auth/Onboarding     | — (none; production non-editorial) | sign-in/up **live** (incl. Google); onboarding live default **v2** (3-way cookie branch)                                              | invite dialog, admin-lockout widget net-new; MFA dead-end still mounted (delete)                                                        | [06](./specs/06-auth-shadow.md)         |
| Calendar            | — (integration components)         | sync + webhook controls **built but orphaned** (0 pages import; `/dashboard/calendar` is Coming-soon; live settings has no Google UI) | conflict UI net-new; dup root `CalendarWebhookControl` is dead                                                                          | [07](./specs/07-calendar.md)            |
| Notifications       | `notifications/editorial` (1)      | feed **wired** + bell present (reads `in_app_notifications` → silent `[]` until 0.1)                                                  | preferences UI **built but unreachable** (`settings/notifications` stub)                                                                | [08](./specs/08-notifications.md)       |
| Content/Production  | —                                  | —                                                                                                                                     | ProductionTab **built but mounted nowhere** (no tab container, no v2 detail); standalone pages Coming-soon (nav `AppSidebar.tsx:93–98`) | [09](./specs/09-content-production.md)  |
| Profile/Settings    | `settings/editorial` (1)           | settings sections **wired** (some link to stub sub-pages)                                                                             | self-edit form **name-only** (calls `updateProfileNameAction`, not the capable `PUT /api/users/profile`); no phone/avatar inputs        | [10](./specs/10-profile-multirole.md)   |

**Cross-cutting surfaces (no single feature spec owns these):**

- **Dashboards** `dashboard/editorial` (9 files) — all mounted at `/dashboard` via `resolveActiveView` (Teacher>Student>Admin). **Teacher** dashboard is the most complete editorial surface (greeting, day-spine, needs-attention, week-density, utilization, roster, library — all real data). **Student** = read-only summaries; **Admin** = entry surface. v1/v2 dashboard trees still to delete.
- **Fretboard** `fretboard/editorial` (1 file) — self-contained static theory tool, fully wired, no backend. Mounted at `/dashboard/fretboard`. Not tied to a feature spec.
- **Shared primitives** — `dashboard/editorial/primitives.tsx` + per-domain `primitives.tsx`/`format.ts` are the editorial design-system pieces; keep and consolidate, don't delete with the v1/v2 trees.

### 3.3 Testing & CI gates (Phase 4)

- **RLS breadth** (§3.1) — P0.
- **Shadow merge test** — un-skip; assert transfer counts (§2.6 acceptance) — P0.
- **Journey E2E** — `sign-up-email-verification`, `onboarding-flow`, `calendar-sync-workflow` (after §2.7).
- **Untested subsystems** — `in-app-notifications`, `send-weekly-insights`, `ai-history`, `profile-settings`.
- **Quarantine triage** — `jest.config.ts` (~61 files): fix the 8 auth-form tests first; delete tests for deleted components; dedupe the 5–7 duplicate pairs (`lib/google.test.ts` vs `__tests__/lib/google.test.ts`, etc.).
- **CI gates** — PR path gets `playwright test --grep @smoke`; coverage check blocking at today's real number, ratcheting up; remove hardcoded TS-error filters in the typecheck step; `@typescript-eslint/no-explicit-any: error` (fix the ~15 prod `any`s, `app/api/lessons/handlers.ts` ×4 first).

### 3.4 Observability — unified logger (ADR-0003)

Logger Phases 1–2.5 shipped (Pino backend + `system_logs` + admin viewer). Remaining: enforce no-console in CI (part of §3.3 lint), and confirm Sentry captures Error objects (not message strings) so stacks survive.

### 3.5 Consolidation debt (alongside, not before)

- Split `app/actions/ai.ts` (1,140 LOC, 18 functions) → `actions/ai/{lesson-notes,assignments,emails,summaries,progress,admin-insights}.ts`.
- Split `notification-service.ts` / `notification-monitoring.ts` (1,021 LOC) per channel; `user.service.ts` (583 LOC).
- Delete `cypress/` after porting its 1 active spec to Playwright.
- Drop deprecated `student_song_progress` table (data already in `student_repertoire`; remove the `slow_tempo` dead enum branch noted in `CONTEXT.md`).
- Dependabot: 34 open alerts (11 high) — `npm audit` triage pass.
- Update `CLAUDE.md` (version drift) + the stale `.env.local` Supabase URL note.

---

## 4. Sequencing (solo, ~6–8 weeks)

| Week | Focus                                                                                                                     | Gates closed                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1    | **Phase 0 entirely** (schema 0.1 → migration 0.2 → bearer 0.3 → crons 0.4 → view 0.5 → CI 0.6) + Songs 2.1/2.2 quick wins | "no silent failure", CI signal         |
| 2–3  | Feature CRUD: Lessons → Assignments → Users → Repertoire/Practice (each: behavior + editorial + delete old trees)         | gates 1,4,5 per feature                |
| 4    | Auth & Shadow 2.6 (invite flow + email chokepoint first, then MFA-remove / Google-signin / lockout)                       | "no flow strands a user"               |
| 5    | Calendar 2.7 (mount UI day 1 → conflicts → cron → recurring → disconnect)                                                 | calendar 100%                          |
| 6–7  | Testing 3.3 (RLS breadth + journeys + quarantine triage)                                                                  | "every core table RLS-tested", CI gate |
| 8    | Consolidation 3.5 + kill the `ui-version` switch + buffer                                                                 | one generation; debt down              |

Critical-path dependency: **Phase 0 must finish before Week 2** — every feature spec assumes its tables exist and bearer/cron/CI are green.

---

## 5. Decision Ledger

The grilling outcomes, recorded as mini-decisions. Each is binding for this spec; promote any that prove load-bearing to a full ADR.

| ID   | Decision                                                                                                               | Rationale                                                                       | Consequence                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| D-01 | Single consolidated master spec (this doc)                                                                             | One tracker prevents drift (THEMES.md pattern)                                  | Supersedes road-to-100 + production-plan                                            |
| D-02 | Unify functional + editorial tracks                                                                                    | A feature isn't done until it both works and renders via editorial              | 5-point per-feature checklist                                                       |
| D-03 | Hybrid skeleton (Phase 0 + feature spine + sequence)                                                                   | Phase 0 is a hard dependency; features read best whole                          | This structure                                                                      |
| D-04 | Schema drift: **restore A+B, delete C+D** (2026-06-16: `auth_events` reclassified C→A — ADR-0002 logger depends on it) | "No silent failure" forbids leaving A broken; B is a live feature; C/D are dead | Notifications + ProductionTab + shadow audit-trail become real; Phase 2/3 unblocked |
| D-05 | Editorial **sole survivor**, kill the switch                                                                           | One generation is the simplest end state                                        | Delete v1/v2/v3 + `ui-version` machinery at 100%                                    |
| D-06 | MFA: **remove** the dead-end                                                                                           | Premature for ~20–30 DAU; cheapest "no dead end"                                | Delete `{mfaRequired,factorId}` branch                                              |
| D-07 | Google sign-in: **implement** (separate callback)                                                                      | Teachers already authorize Google; friction-reducing login                      | New `app/auth/callback`; integrations cb untouched                                  |
| D-08 | Practice: **immutable + same-day undo**                                                                                | Integrity + mis-tap forgiveness                                                 | `deletePracticeSession` gated to `current_date`; no edit                            |
| D-09 | User delete: **soft-delete**                                                                                           | Consistency with system-wide soft delete; preserves FKs                         | `is_active=false` + auth ban; RLS hides inactive                                    |
| D-10 | Content: **ProductionTab only**, hide standalone                                                                       | Satisfies "no silent failure" + "no Coming-soon" at least scope                 | Remove `/dashboard/content/*` from nav                                              |
| D-11 | Supersede & consolidate older planning docs                                                                            | Single source of truth                                                          | road-to-100 + production-plan get "Superseded by" headers                           |
| D-12 | Implementation-grade altitude                                                                                          | Sections must be agent/issue ready                                              | Contracts + files + RLS + test names per feature                                    |

---

## 6. Open Questions / Risks

1. **Editorial rollback risk.** Sole-survivor deletion is big-bang per domain. Mitigation: mount editorial → soak in preview → _then_ delete the old tree (don't delete in the same PR that mounts). Not a separate generation, just staged deletion.
2. **Schema restore on prod is irreversible-ish.** Apply bucket A/B migrations to a Supabase branch first (`mcp__supabase__create_branch`), verify, then merge. Snapshot before applying.
3. **`song_sections` / `user_roles` reverse-engineering** (0.1) may surface columns the repo never modeled — budget time to reconcile types/Zod after `pg_dump`.
4. **Production lag.** `production` branch trails `main` by ~9 minor versions. This spec targets `main`/preview; a separate promotion gate must verify Phase 0 changes are prod-safe before they reach `strummy.app`.
5. **`strummy.app` NXDOMAIN.** Out of this spec's scope but tracked: either reactivate DNS or repoint CV/portfolio links to `strummy.vercel.app`.

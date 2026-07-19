# Docs vs. Implementation Audit — What's Actually Left Unimplemented

**Date**: 2026-07-19
**Author**: Claude (5 parallel research agents, synthesized)
**Scope**: Cross-check every feature spec in `docs/specs/00-*.md` through `11-*.md`, plus `docs/MASTER_SPEC.md` and `docs/PRODUCTION_REQUIREMENTS.md`, against the current codebase. These docs were last verified 2026-06-16 (~5 weeks stale) and predate a large refactor (v1/v2/v3 component deletion, the "editorial" UI redesign, and a round of E2E test repairs), so most of their specific gap claims no longer hold. Each item below was independently verified against live code (grep/read the named files, not just doc trust).

---

## TL;DR

Most domains are **much further along than the docs claim**. Songs, Lessons, Assignments, Calendar, and most of Auth/Shadow are essentially complete — the specs simply weren't updated after the work landed. `docs/PRODUCTION_REQUIREMENTS.md` is a dead artifact (footer says "Last Updated: January 2026, Version: 0.65.0"; its entire E2E section cites a `cypress/` directory that no longer exists in the repo) and should be treated as historical, not current.

What genuinely remains, in priority order:

**Status update (2026-07-19, same day)**: all 14 items below were implemented on
`feature/audit-findings-implementation`. Items 1, 3, and 7 turned out to already be shipped by
an unrelated, previously-unmerged branch discovered mid-session (`claude/docs-plan-implementation-56e7ad`,
merged in) — see that commit history for `fix(users): let teachers/admins override student
repertoire status`, etc. Item 13 needed no action (standing decision, confirmed still correct).

| #   | Item                                                                                                                                  | Type                          | Domain              | Status                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Same-day practice undo reverses the wrong table — totals never actually revert                                                        | **Bug**                       | Practice/Repertoire | ✅ Fixed — migration `20260718210000` + RLS-real test green vs live dev DB                                                          |
| 2   | Unknown chords silently render as a **G** diagram                                                                                     | **Bug**                       | Songs               | ✅ Fixed — explicit "no diagram" placeholder + test                                                                                 |
| 3   | Admin account-lockout has a full backend, zero UI                                                                                     | Backend-without-UI            | Auth                | ✅ Fixed — `LockedAccountsCard` mounted on admin dashboard                                                                          |
| 4   | Teachers cannot edit a student's repertoire (server action supports it; no UI reaches it)                                             | Backend-without-UI            | Repertoire          | ✅ Fixed — editable status `<select>` on student detail view                                                                        |
| 5   | `student_status` not editable anywhere (missing from form AND API schema)                                                             | Gap                           | Users               | ✅ Fixed — form control + `UpdateUserSchema` field                                                                                  |
| 6   | `studentStatus` filter wired server-side, no UI control (URL-only)                                                                    | Gap                           | Users               | ✅ Fixed — filter `<select>` added                                                                                                  |
| 7   | Avatar is a raw URL text field, no upload widget                                                                                      | Gap                           | Profile             | ✅ Fixed — Supabase Storage upload widget                                                                                           |
| 8   | Multi-role users still see only one role label in nav                                                                                 | Bug (relocated, not fixed)    | Navigation          | ✅ Fixed — shared `resolveRoleLabel` joins all held roles                                                                           |
| 9   | Notification feed hard-capped at 30, no pagination; unsubscribe not surfaced in-app                                                   | Gap                           | Notifications       | ✅ Fixed — offset pagination + "Load more" + explicit unsubscribe link                                                              |
| 10  | Lessons' shadow-student email resolution only exists in the editorial form's server action — REST API still UUID-only                 | Gap (API parity)              | Lessons             | ✅ Fixed — REST handler now resolves `student_email` too                                                                            |
| 11  | Assignments, auth, students, admin/role, and all 5 cron routes have **no integration tests**                                          | Test debt                     | CI                  | ✅ Fixed — assignments/auth/students/admin already had coverage (stale claim); added tests for the 10 actually-untested cron routes |
| 12  | RLS test coverage holes: calendar integration tables, notification tables, content tables, repertoire status-override/notes-whitelist | Test debt                     | RLS                 | ✅ Fixed — 4 new RLS-real suites + repertoire whitelist/override tests                                                              |
| 13  | E2E/Playwright not wired into CI                                                                                                      | Standing decision (not a bug) | CI                  | ✅ No action needed — confirmed still a deliberate decision                                                                         |
| 14  | `deploy.yml`/`version-bump.yml` not gated on green CI; `npm audit` non-blocking                                                       | Test debt                     | CI                  | ✅ Fixed — version-bump now gated on CI/CD Pipeline success; `npm audit` blocking at `critical`                                     |

---

## 1. Bugs found

### 1.1 Practice-session undo doesn't actually undo (Repertoire/Practice, spec 05)

Two independent triggers exist on `practice_sessions`:

- Legacy `tr_practice_sessions_update_progress` (`020_triggers.sql`) writes to the deprecated `student_song_progress` table.
- Current SSOT trigger `tr_practice_sessions_aggregate` / `fn_aggregate_practice_to_repertoire` (`20260322000000_practice_to_repertoire_trigger.sql`) increments `student_repertoire.total_practice_minutes` / `practice_session_count` / `last_practiced_at` — this is what `RepertoireCard.tsx:67` and `StudentDetailEditorial.tsx` actually render.

The new same-day-undo AFTER DELETE trigger (`reverse_song_progress_from_practice`, `20260616010000_practice_delete_same_day.sql:23-47`) only decrements the **legacy** `student_song_progress` table. There is no reversal trigger on `student_repertoire` at all (grepped every migration for `student_repertoire` + `DELETE` — only cascade/transfer hits, nothing practice-related).

**Effect**: a student deletes today's practice session, the row disappears and RLS/UI succeed, but `total_practice_minutes` / `last_practiced_at` on `student_repertoire` stay stale forever. This is exactly the "delete metrics drift" edge case spec 05 calls out as required — the fix landed against the wrong table.

**Also partial**: DoD-3 (RLS-tested) is incomplete for this spec — `practice_sessions` delete policy is tested, but `student_repertoire` only has basic SELECT-own tests (`core-tables.rls.test.ts:109-127`); no test for the student-notes-only UPDATE whitelist or teacher status-override path.

### 1.2 Unknown chords silently fall back to a wrong diagram (Songs, spec 01)

`components/songs/editorial/primitives.tsx:94` — `CHORD_SHAPES[name] ?? CHORD_SHAPES.G` renders the **G** shape for any chord not in the hardcoded 15-shape table, with no error or omission. No diagram-accuracy test exists (`song-chords.lowercase.test` only checks parse/normalize, not diagram correctness).

---

## 2. Backend exists, no UI reaches it

### 2.1 Admin account lockout (Auth/Shadow, spec 06)

`app/actions/admin/lockout.ts` has working `getLockedAccounts` / `unlockAccount` (both counters cleared together) plus a test file. But grepping `LockedAccountsSection` / `getLockedAccounts` / `unlockAccount` across every `.tsx` file returns **zero hits** — no widget exists anywhere, nothing is mounted on the admin dashboard. This directly contradicts the spec doc's own status header, which claims a "LockedAccountsSection widget on the admin dashboard" already exists.

### 2.2 Teacher repertoire override (Repertoire, spec 05)

`/dashboard/repertoire` (`app/dashboard/repertoire/page.tsx:21`) hard-codes `canEdit = !isAdmin && !isTeacher` — it only ever renders the signed-in student's own repertoire. The teacher-facing surface, `StudentDetailEditorial.tsx` (mounted at `/dashboard/users/[id]`), shows the Repertoire card (lines 231-304) as a plain `<Link>` list with zero edit affordance — it doesn't even import `RepertoireCard` or `updateRepertoireEntryAction`.

Meanwhile the server action **already supports** staff editing any field including `current_status` override (`repertoire.ts:127-136`, `isStaff` branch) — the spec's core teacher story ("open a student's Repertoire and edit any field, including status override") has zero UI surface to reach it.

---

## 3. Smaller real gaps

### 3.1 Users (spec 04)

- **`student_status` not editable**: `UserEditFormEditorial.tsx` (lines 62-176) only exposes Admin/Teacher/Student/Active toggles — no student_status control. `UpdateUserSchema` in `app/api/users/[id]/route.ts:7-17` has no `studentStatus` field either, so not even a hand-crafted request can set it.
- **`studentStatus` filter is server-wired but UI-invisible**: `getUsersList` / `GET /api/users` / `app/dashboard/users/page.tsx:46` already thread a `studentStatus` param end-to-end, but `UsersListEditorial.tsx`'s filter form only renders `search`, `role`, `active` — reachable only by hand-editing the URL query string.

Everything else in this spec (list, edit form, soft-delete on both `DELETE /api/users/[id]` and `deleteUser` action, `is_active` RLS predicate, shadow badge + invite wiring) is done and doc-stale.

### 3.2 Profile/Multi-role (spec 10)

- **Avatar upload**: `avatar_url` is a plain URL text input in `SettingsEditorial.tsx` — no storage-bucket upload widget.
- **Single-role-label bug relocated, not fixed**: `components/v2/navigation/MobileBottomNav.tsx:38` still takes a bare `isStudent` boolean; `Header.tsx:19` and `AppShell.Desktop.tsx:42` both still do `isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User'` — multi-role users (e.g. admin+teacher) still see only one label. The spec's cited files (`AppSidebar.tsx`, `HorizontalNav.tsx`, old `MobileMoreMenu.tsx`) no longer exist; nav consolidated into `components/v2/navigation/*`, and the chip defect moved with it.

Full-name/first/last/phone/avatar_url fields, `/dashboard/profile` → redirect to `/dashboard/settings`, and full v1 `components/profile/*` deletion are all done (doc-stale).

### 3.3 Notifications (spec 08)

- Feed pagination: `getRecentNotifications(userId, limit=30)` (`lib/services/notifications-queries.ts:14-25`) still hard-limits to 30, no offset/pagination.
- Unsubscribe isn't surfaced from any in-app UI — only the standalone `/unsubscribe` landing page and the email footer link exist.
- RLS coverage: only `in_app_notifications` has a real test; `notification_log` / `notification_queue` / `notification_preferences` / `user_preferences` have none. `test:rls` isn't wired into any CI workflow.

`components/v2/notifications/*` (deleted), `/dashboard/settings/notifications` (now real, not "Coming soon"), and the deliverable-email chokepoint (wired in both `notification-service.ts` and `notification-queue-processor.ts`) are all done — doc-stale.

### 3.4 Lessons (spec 02)

- Shadow-student email resolution (`matchStudentByEmail` / `createShadowStudent` via `resolveStudent()` in `app/actions/lesson-edit.helpers.ts`) only exists behind the new `createLessonAction` server action used by the editorial form. `app/api/lessons/handlers/create.ts` — the REST route — was **not** updated, so external/API consumers still require a raw `student_id` UUID.
- Minor housekeeping: `components/lessons/form/LessonForm.Actions.tsx` looks genuinely orphaned (only self + one stale integration test reference it). No `index.ts` barrel exists in `components/lessons/editorial/`.

Everything else — editorial create/edit form, RLS tests, v1/v2 deletion (except the two AI-assist files that are legitimately still imported by the new editorial form) — is done, doc-stale.

---

## 4. Testing / CI debt (spec 11)

**Confirmed still missing:**

- Smoke E2E not wired into CI: `ci-cd.yml:239-242,377` explicitly states "E2E (Playwright) is not part of CI — run locally." `@smoke` tests exist locally (`tests/e2e/smoke/critical-path.spec.ts`) but aren't invoked in any workflow. This is a **documented standing decision**, not an oversight.
- `npm audit` non-blocking (`--audit-level=critical || echo "::warning"`, and critical not high as the spec originally asked).
- Bruno never wired into any CI workflow.
- Pre-commit still runs full `npm run quality` (not lint-staged); pre-push still runs full-codebase `npm run lint` (not scoped to changed files).
- `deploy.yml` is manual-dispatch only; `version-bump.yml` triggers on push to `main` with **no gate on green CI**.
- `no-console` is still `'warn'`, not `'error'`.
- `test:rls` isn't run by any CI workflow.
- **Per `tasks/critical-path-tests.md` (confirmed still accurate, not stale)**: only lessons (#1-4) and songs (#5-6) have integration tests. Items #7-20 — assignments, auth, students, admin/role, and **all 5 cron routes** — have zero integration test files or handler extraction. Fully outstanding.
- RLS test gaps by domain: calendar's `user_integrations` / `webhook_subscriptions` / `sync_conflicts` (spec 07, none exist); content's `content_posts` / `content_post_metrics` / `hashtag_sets` (spec 09, none exist); notifications' `notification_log` / `notification_queue` / `notification_preferences` / `user_preferences` (spec 08, none exist); repertoire's notes-whitelist and status-override paths (spec 05, only basic SELECT tests exist).

**Confirmed done (doc-stale):** unfiltered `tsc --noEmit` in CI, `--passWithNoTests` and migration-push `continue-on-error` both removed, RLS breadth for core tables done via `core-tables.rls.test.ts`, duplicate test files deduped, `jest.config.simple.ts` deleted, coverage floor now blocking at 50%, `no-explicit-any: 'error'` set (though ~96 raw `: any` occurrences remain in the codebase — unclear if that's currently passing clean), `cypress/` fully deleted, `.github/dependabot.yml` present.

**Live-run result**: integration suite was actually executed — **238 passed / 2 failed** (down from the spec's documented 16 fail / 223 pass). The 2 remaining failures are in `scripts/backfill/__tests__/shadow-dedup.integration.test.ts`, a unique-constraint collision that looks like test pollution, unrelated to any spec claim. Quarantine list is down to ~14 files (from a documented 51), categorized by cause but with no removal dates set.

---

## 5. Domains that are essentially done (docs are just stale)

- **Phase 0 — Restore Truth** (spec 00): self-assessed "complete" 2026-06-19 and holds up. Bearer-auth fully removed, dead tables confirmed gone, CI gates (blocking coverage floor, unfiltered typecheck, no-explicit-any) all in place, bulk-DELETE empty-body bug fixed. Only gap: `@smoke` E2E not in CI (documented as intentional) and exact Jest quarantine count unverified.
- **Songs** (spec 01): list filters (key/author), pagination, and RLS-respecting reads (switched off `createAdminClient()`) are all now implemented and tested. v1/v2/v3 trees fully deleted except files still actively imported by editorial (not dead code).
- **Lessons** (spec 02): editorial create/edit form and shadow-email resolution both landed (see §3.4 for the one real gap — REST API parity).
- **Assignments** (spec 03): **zero items still missing.** All 4 editorial surfaces wired, status-actions UI mounted, RLS policy + tests landed, v1/v2 cleanup done except the actively-imported `AssignmentAI.tsx` (correctly kept, matches spec's own out-of-scope note).
- **Calendar** (spec 07): all 7 sub-specs implemented — conflict detection UI, per-instance dedupe, token refresh sharing, disconnect flow, webhook token auth. Only gap: RLS tests for the 3 integration tables (§4).
- **Auth/Shadow** (spec 06): invite dialog, deliverable-email chokepoint, calendar reconcile on shadow-link, MFA removal, and Google sign-in are all implemented. Only gaps: admin lockout UI (§2.1) and the optional stale-shadow cron (spec marks this optional itself — not urgent).
- **Content/Production** (spec 09): `ProductionTab` is mounted inside song detail (`SongDetailEditorial` → `SongDetailTabs.tsx:82`), not a standalone route — matches the spec's own decision (D-10). Only gap: no RLS tests for content tables (§4).

---

## 6. Doc hygiene notes (not code gaps)

- `docs/PRODUCTION_REQUIREMENTS.md` is dead — versioned against v0.65.0 (current is v0.158.5 per `package.json`), and its entire "Feature Implementation & Testing Matrix" cites Cypress specs from a `cypress/` directory that no longer exists anywhere in the repo. Recommend archiving or deleting rather than maintaining.
- `docs/MASTER_SPEC.md`'s domain-status map (§3) understates progress for Calendar (called "Coming soon" — it's fully wired), Content/Production (called "mounted nowhere" — it's mounted in song detail), Assignments (student-status RLS called "net-new" — already shipped via PR #472), and Repertoire/Practice (editorial dirs called "absent" — they exist with real routes).
- All 11 `docs/specs/0X-*.md` files carry `updated: 2026-06-16` frontmatter and are now ~5 weeks stale relative to actual implementation state. A refresh pass (or at minimum flipping each closed spec's `status:` frontmatter and unchecking only the items still open per this audit) would prevent this drift from compounding further.
- Important caveat for any future cleanup pass: `components/v2/*` is **not** a dead v1/v2/v3 leftover as a blanket rule — `components/v2/navigation`'s `AppShellV2` is the live main nav shell (imported by `components/layout/AppShell.tsx`), and several files under old feature directories (`AssignmentAI.tsx`, `LessonNotesAI.tsx`, `AIAssistButton.tsx`) are actively imported by the new editorial components. Always check actual import sites before deleting anything that looks like "old" code.

---

## Source

Findings synthesized from 5 parallel research passes over `docs/MASTER_SPEC.md`, `docs/PRODUCTION_REQUIREMENTS.md`, and `docs/specs/00-*.md` through `11-*.md`, each independently verified against the live codebase at commit `72321e64` (branch `fix/e2e-desktop-chrome-failures`).

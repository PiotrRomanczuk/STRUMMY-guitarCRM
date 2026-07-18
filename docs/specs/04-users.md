---
created: 2026-06-16
updated: 2026-06-16
feature: Users
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/01-identity-access.md.

# Spec 04 — Users

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md). Depends on [Phase 0](./00-phase-0-restore-truth.md). Related: [06-auth-shadow](./06-auth-shadow.md) (invite button), [10-profile-multirole](./10-profile-multirole.md).

## Goal

An admin/teacher lists Profiles (search, role, studentStatus filters), opens a Profile detail (lessons + assignments summary), edits role flags / `student_status` (admin-only), and **deactivates** a Profile via **soft-delete** (`is_active=false` + auth ban) — never a hard `DELETE`. Shadow Profiles carry an "Unclaimed" badge with an Invite button (the invite action itself lives in [06](./06-auth-shadow.md)). Routes render via `components/users/editorial/*`; the v1 (`components/users/*`) and v2 (`components/v2/users/*`) trees are deleted on done.

## User stories (by role)

| Role    | Story                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin   | List all Profiles; filter by search / role / studentStatus / active; open any detail; edit role flags + `student_status`; deactivate any Profile. |
| Admin   | See an "Unclaimed" badge + Invite button on shadow Profiles; reactivate a previously deactivated Profile.                                         |
| Teacher | List only Students I Teach (Visible Students); open their detail (lessons + repertoire + assignments summary); **cannot** flip role flags.        |
| Student | See only my own Profile via the list endpoint; never see or edit other Profiles' role flags or active state.                                      |

## Current state (verified 2026-06-16) — delete is HARD today, not soft

| Area                                                 | State                                                                                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List `app/dashboard/users/page.tsx`                  | **Stub** — "Coming soon" card.                                                                                                                                                             |
| Detail `app/dashboard/users/[id]/page.tsx`           | **Done (partial)** — mounts `StudentDetailEditorial`; SSR via `getUserWithRolesSSR` + `student-detail-queries`. No deactivate/role-edit controls.                                          |
| Edit `app/dashboard/users/[id]/edit/page.tsx`        | **Stub** — "Coming soon" card.                                                                                                                                                             |
| `GET /api/users`                                     | **Done** — search/role/studentStatus/`active` filters; role-scoped (student=self, teacher=Teaches via `lessons`, admin=all); masks shadow email; returns `{ data, total, limit, offset }`. |
| `PATCH /api/users` (collection)                      | **Done** — sets `invite_email` on **shadow** profiles only. Invite-flow territory; see [06](./06-auth-shadow.md), not the per-user edit path.                                              |
| `app/api/users/[id]` GET / **PUT** / DELETE          | GET + PUT admin-only (PUT = full role/flag/active update, no self path — self path is [10](./10-profile-multirole.md)). **DELETE = HARD-DELETE** (`supabase.from('profiles').delete()`).   |
| `deleteUser` (`app/dashboard/actions.ts`)            | **HARD-DELETE** — admin-guarded; `profiles.delete()` **then** `auth.admin.deleteUser(userId)`. Consumed by v1/v2 list delete dialogs.                                                      |
| `is_active` column (`005_table_profiles.sql`)        | **Exists** — `BOOLEAN NOT NULL DEFAULT true`; comment "false disables login"; partial index `ix_profiles_is_active`. Already selected/exposed by `GET /api/users`.                         |
| profiles RLS (`20251128140000_fix_rls_recursion_v2`) | SELECT own-or-admin + teacher-read-all; UPDATE own-or-admin; DELETE own-or-admin. **No `is_active` predicate — inactive rows are NOT hidden today.**                                       |
| "Unclaimed" badge                                    | **Absent** — no `Unclaimed` string anywhere; shadow status is currently surfaced only as `isShadow` / masked email.                                                                        |
| editorial tree                                       | `components/users/editorial/StudentDetailEditorial.tsx` only (no list/edit editorial yet).                                                                                                 |

**Divergence (must fix):** MASTER_SPEC §2.4 mandates soft-delete (ledger D-09). **Three** hard-delete paths exist today — `DELETE /api/users/[id]`, `deleteUser` action, and `transfer-shadow-references.ts` (shadow merge, out of scope here). The first two must become soft-delete; RLS must gain an `is_active` predicate to actually hide deactivated Profiles.

## Editorial UI — current implementation (verified 2026-06-16)

**Mounted at:**

- `app/dashboard/users/[id]/page.tsx` → `StudentDetailEditorial` (SSR: `getUserWithRolesSSR` auth gate + `student-detail-queries`). **WIRED (read-only).**
- `app/dashboard/users/page.tsx` (list) → **STUB** ("Coming soon" card; no `UsersListEditorial`).
- `app/dashboard/users/[id]/edit/page.tsx` → **STUB** ("Coming soon" card; no edit form).
- `app/dashboard/page.tsx` → `AdminDashboardEditorial` (admin entry surface; aggregate counts + pending-invites list, no per-user navigation).

### Inventory

| Component                 | Lines | Renders                                                                                                                                                                                                                      | Data source                                                                                                                                                | State                                                                    |
| ------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `StudentDetailEditorial`  | 358   | Avatar/initials header, joined date, 3 stats (songs in progress / mastered / total practice), Repertoire card (≤12 songs, status colour + practice mins, link to song), recent Lessons card. Back-link → `/dashboard/users`. | Props `{ profile, repertoire, lessons }` from `student-detail-queries` (`getStudentProfile` / `getStudentRepertoire` / `getStudentRecentLessons`) via SSR. | **PARTIAL** — read-only; no edit/deactivate/invite; no Unclaimed badge.  |
| `AdminDashboardEditorial` | 182   | Platform pulse (Users/Students/Teachers/Songs/Lessons counts), pending-invites list (email + relative date), ComingSoon cards (at-risk, cohort, audit log, services).                                                        | Props `{ pulse, invites, now }` from `admin-dashboard-queries`.                                                                                            | **PARTIAL** — counts only; no clickable per-user rows linking to detail. |
| `UsersListEditorial`      | —     | —                                                                                                                                                                                                                            | —                                                                                                                                                          | **MISSING** (route is a stub).                                           |
| `UserEditEditorial`       | —     | —                                                                                                                                                                                                                            | —                                                                                                                                                          | **MISSING** (route is a stub).                                           |

**What's built:** student detail (read-only editorial) wired to real SSR queries; admin dashboard surface with platform counts + pending-invites inbox; auth-gated detail route.

**What's missing:**

- **Users list editorial** — route still "Coming soon"; no search / role / studentStatus / active filters, no row navigation to detail.
- **Edit form** — route still "Coming soon"; no role-flag / `student_status` / active edit UI; `PUT /api/users/[id]` unconsumed by editorial.
- **Invite button** — no Invite control on shadow Profiles anywhere in the editorial tree.
- **Soft-delete control** — no deactivate/reactivate button on detail or list (and the underlying DELETE/`deleteUser` paths are still hard-delete).
- **Unclaimed badge** — absent; `is_shadow` is not surfaced as a badge in any editorial component.

### Gap to this spec's target behavior

- **Admin user stories** (list/filter, open detail, edit flags + `student_status`, deactivate, reactivate, Invite on shadows) — only "open detail" exists, and read-only. List, edit, deactivate, reactivate, and Invite are all unbuilt.
- **Teacher / Student stories** — no list editorial exists, so the role-scoped "Visible Students" / self-only views (enforced server-side by `GET /api/users`) have no editorial surface yet.
- **Soft-delete** — no UI control, and per the Current-state table the API/action paths remain hard-delete; the `is_active` RLS predicate is also still unbuilt. Soft-delete is 0% surfaced.
- **Shadow / Unclaimed badge** — neither the "Unclaimed" badge nor the Invite button (per [06](./06-auth-shadow.md)) appears in `StudentDetailEditorial` or anywhere editorial; shadow state is invisible to the UI today.

## Data contract

### `GET /api/users` — list (no change to shape)

- Auth: any role; student sees only self.
- Query params: `search` (ilike email/full_name), `role` (`admin|teacher|student|shadow`), `studentStatus` (`= student_status`, `all`=skip), `active` (`true|false` → `is_active` eq), `limit`/`offset`.
- Returns `{ data: Profile[], total, limit, offset }` (the `data` key is the existing API shape — leave it; do not introduce `data.data`).
- After soft-delete RLS lands, default queries (no `active` param) **already exclude** inactive rows via RLS; `active=false` is the only way an admin sees them.

### `PUT /api/users/[id]` — admin role/flag/active edit

- Auth: admin-only (`getUserWithRolesSSR` → `!isAdmin` ⇒ 401).
- Body (`UpdateUserSchema`): partial `{ full_name?, isAdmin?, isTeacher?, isStudent?, isParent?, isActive?, parentId? }`; `buildUserUpdatePayload` includes only sent fields (prevents flag clobber, STRUM-253).
- A Profile may hold **>1 Role** (CONTEXT.md) — flags are independent booleans, never mutually exclusive; do not coerce to a single "type". Multi-role edit UI ties to [10](./10-profile-multirole.md).
- Non-admin caller is rejected by both the handler **and** RLS (`update_own_or_admin_profile` admits self-or-admin only).

### Soft-delete path (replaces hard DELETE)

- `DELETE /api/users/[id]` and `deleteUser(userId)`: admin-only. Set `is_active=false` (cookie-bound client for the route; admin client for the ban) **and** `auth.admin.ban_duration` (indefinite ban via admin client). **Never** call `profiles.delete()` or `auth.admin.deleteUser()`.
- FKs to `lessons`/`assignments`/`student_repertoire` are preserved (no row removal).
- New migration adds an `is_active` predicate to the profiles SELECT policies so deactivated rows vanish from default reads (RLS = boundary, ADR-0001 — do not re-`WHERE` in app code).
- Reactivation: `PUT /api/users/[id]` with `isActive=true` + lift the auth ban (`ban_duration: 'none'`).

## Behavior & edge cases / failure modes

- **Deactivating a Profile with future lessons** → soft-delete only; future `lessons` rows remain (no cascade). Surfacing/cancelling those lessons is out of scope; deactivation must not error on existing FKs.
- **Non-admin flips a role flag** → handler 401 (admin-only PUT) **and** RLS rejects an UPDATE on a row that is not the caller's. Both layers reject; test asserts the 401/RLS denial.
- **Shadow with "Unclaimed" badge** → detail/list show badge + Invite button when `is_shadow=true`; clicking Invite calls the [06](./06-auth-shadow.md) PATCH `/api/users` invite path. Email stays masked (`maskShadowEmail`) until claimed.
- **Reactivation** → `isActive=true` restores list visibility and lifts the auth ban; round-trips with `active=false` filter.
- **Self-deactivation** → admin cannot deactivate their own Profile (guard: `id !== caller.id`) to avoid lockout.
- **No silent failure** → every `.from()`/admin call surfaces errors; a ban failure after `is_active=false` is logged and returned as a warning, not swallowed.

## Files to touch

| File                                      | Change                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `app/dashboard/users/page.tsx`            | Replace stub → mount `UsersListEditorial` (**net-new**); filters (search/role/studentStatus/active); Unclaimed badge + Invite. |
| `app/dashboard/users/[id]/edit/page.tsx`  | Replace stub → editorial role/flag/`student_status`/active edit form (admin-only); PUT `/api/users/[id]`.                      |
| `app/dashboard/users/[id]/page.tsx`       | Add deactivate/reactivate + Invite controls to the existing detail; Unclaimed badge for shadows.                               |
| `app/api/users/[id]/route.ts`             | **Replace hard `profiles.delete()`** in `DELETE` with soft-delete (`is_active=false` + auth ban).                              |
| `app/dashboard/actions.ts`                | **Replace** `deleteUser` body (`profiles.delete()` + `auth.admin.deleteUser`) with the soft-delete path.                       |
| `components/users/editorial/*`            | Add `UsersListEditorial.tsx`, `UserEditEditorial.tsx`; reuse `StudentDetailEditorial`.                                         |
| `supabase/migrations/<new>.sql`           | Add `is_active` predicate to profiles SELECT policies (hide inactive); confirm no functional dependence on hard delete.        |
| Deletions (gate 5, after editorial soaks) | `components/users/*` (v1) + `components/v2/users/*` (incl. `UserList.DeleteDialog.tsx`).                                       |

## Acceptance criteria (as test names)

- `users-list.filters.test` — search / role / studentStatus filter correctly; `active=false` reveals only deactivated rows.
- `user-soft-delete.test` — deactivating sets `is_active=false`, bans the auth user, preserves lesson/assignment/repertoire FKs, and the Profile disappears from default `GET /api/users`.
- `profiles.rls.test` — self-only update; admin sees all; non-admin cannot flip role flags; inactive rows hidden from non-`active=false` reads.
- `user-reactivate.test` — `isActive=true` restores visibility and lifts the ban.

## Definition of Done (5-point)

1. **Behavior complete** — list/detail/edit render real editorial UI; deactivate → hide → reactivate round-trips for admin; teacher sees only Visible Students.
2. **No silent failure** — every `.from()`/admin call surfaces errors; ban failure logged + returned as warning, not swallowed; no remaining `profiles.delete()` in the user CRUD paths.
3. **RLS-tested** — `profiles.rls.test` covers self-only update, admin visibility, non-admin flag-flip rejection, and the new `is_active` hide predicate against real Supabase.
4. **Renders via editorial** — routes mount `components/users/editorial/*`; no `ui-version` cookie branch.
5. **v1/v2 deleted** — `components/users/*` (v1) and `components/v2/users/*` removed; `tsc --noEmit` clean.

## Dependencies & out of scope

- **Depends on:** [Phase 0](./00-phase-0-restore-truth.md) (RLS truth). Multi-role self-edit + the `roles` bag UI tie to [10](./10-profile-multirole.md).
- **Out of scope:** the **invite/claim flow** itself (button wiring + `inviteUserByEmail` + linking) lives in [06](./06-auth-shadow.md); shadow-reference **merge/transfer** (`transfer-shadow-references.ts`); user **creation** (`POST /api/users`) beyond confirming it is unaffected; parent linking semantics beyond the existing `parent_id` validation.

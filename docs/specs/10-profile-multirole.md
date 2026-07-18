---
created: 2026-06-16
updated: 2026-06-16
feature: Profile self-edit & multi-role
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/01-identity-access.md.

# Spec 10 — Profile Self-Edit & Multi-Role Sweep

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md) (Role multiplicity). Depends on [Phase 0](./00-phase-0-restore-truth.md). Related: [04-users](./04-users.md) (PUT self-update path).

## Goal

Two independent threads under one section:

1. **Self-edit form** — one editorial form lets any Profile edit its own `full_name`, `phone`, and `avatar` through the existing self-only `PUT /api/users/profile` route (self path, distinct from the admin `PUT /api/users/[id]`). Today the editorial settings form edits **only** `full_name` (via a server action), and `app/dashboard/profile/` is a "Coming soon" stub backed by a stale v1 form.
2. **Multi-role rendering sweep** — replace single-role assumptions (`isStudent ? … : …`, `isStudent && !isTeacher && !isAdmin`) so an admin+teacher Profile (the owner) gets the teacher surface, never a degraded student-only view. CONTEXT.md: a Profile may hold **more than one Role**; flags (`isParent`, `isDevelopment`) are **not** Roles.

## User stories (by role)

| Role          | Story                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Student       | Edit my own display name, phone, and avatar from settings; changes persist and re-render.                |
| Teacher       | Same self-edit; my role chips show "Teacher" (and "Admin" if held), not a single coerced label.          |
| Admin+Teacher | Land on the **teacher** surface (roster, lessons, library) — never the student "Learning" sidebar/stats. |
| Student-only  | Land on the student surface; nav shows "Learning" / "Stats" as today.                                    |

## Current state (verified 2026-06-16)

A self-edit form **partly** exists; the multi-role chooser is **already** highest-role-wins at the dashboard root but single-role assumptions leak into nav + sub-views.

| Area                                                  | State                                                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/users/profile` (self route)                  | **Done** — GET + **PUT** (not PATCH) self-only via `getUserWithRolesSSR` → `user.id`; Zod fields `first_name/last_name/full_name/phone/avatar_url`; partial-update payload; RLS scopes to own row. |
| `components/settings/editorial/SettingsEditorial.tsx` | **Partial** — editorial form edits **only `full_name`**; no phone, no avatar. Submits to a server action, **not** the self route.                                                                  |
| `app/actions/profile-settings.ts`                     | `updateProfileNameAction` — `full_name` only; cookie-bound `profiles.update().eq('id', user.id)`; errors logged, not swallowed.                                                                    |
| `app/dashboard/settings/page.tsx`                     | Mounts `SettingsEditorial`; already renders a **multi-role** label via `roleLabelFrom` (`Admin · Teacher · Student`).                                                                              |
| `app/dashboard/profile/page.tsx`                      | **Stub** — "Coming soon" card.                                                                                                                                                                     |
| `app/dashboard/profile/profile.client.tsx`            | **v1, orphaned** — `components/profile/*` (`ProfileForm`, `useProfileData`, `MFASetup`, `EmailChangeForm`). Not mounted by the stub page.                                                          |
| Avatar upload                                         | **Absent** — `avatar_url` column written, but no storage-bucket upload UI anywhere.                                                                                                                |
| `resolveActiveView` (`app/dashboard/page.tsx:57`)     | **Highest-role-wins already** — order **Teacher > Student > Admin** (`if isTeacher → teacher; if isStudent → student; if isAdmin → admin`). Admin+Teacher correctly lands teacher.                 |

**Single-role assumption sites (file:line) — fix list:**

| #   | Site                                                                                              | Assumption                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/dashboard/lessons/page.tsx:54`                                                               | `isStudent && !isTeacher && !isAdmin` → student-scoped query flag (acceptable: derives "pure student").                             |
| 2   | `app/dashboard/assignments/page.tsx:35`                                                           | `const asStudent = isStudent && !isTeacher && !isAdmin` (same "pure student" guard).                                                |
| 3   | `components/navigation/MobileBottomNav.tsx:31`                                                    | `isStudent ? Stats : Students` — admin+teacher OK, but a Profile that is student+teacher loses Stats.                               |
| 4   | `components/navigation/AppSidebar.tsx:192`                                                        | `isStudent ? 'Learning' : 'Teaching'` — group label degrades for a multi-role Profile.                                              |
| 5   | `components/navigation/AppSidebar.tsx:177`                                                        | `isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User'` — single label chip.                                   |
| 6   | `components/navigation/HorizontalNav.tsx:129`                                                     | same single-label chip ladder.                                                                                                      |
| 7   | `components/dashboard/DashboardStatsGrid.tsx:105`                                                 | `data?.role === 'student'` branch — server-supplied single `role` string drives the whole grid.                                     |
| 8   | `components/lessons/list/index.tsx:124`                                                           | `role = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student'` collapses bag → one string.                                          |
| 9   | `components/lessons/LessonTable.Empty.tsx:8` / `components/lessons/list/LessonTable.Empty.tsx:11` | `role === 'student'` copy/image branch (downstream of #8).                                                                          |
| 10  | `app/dashboard/page.tsx:196`                                                                      | `StudentEditorialView` reached only when `activeView==='student'` — depends on #resolveActiveView precedence (correct today; keep). |

> `app/api/users/route.ts:49/86`, `app/actions/*` guards (`!isTeacher && !isAdmin`) are **authorization** checks (admit if any qualifying role), not rendering degradations — leave them.

## Editorial UI — current implementation (verified 2026-06-16)

The settings surface is `app/dashboard/settings/page.tsx` → mounts `components/settings/editorial/SettingsEditorial.tsx` (243 LOC, inline-styled, editorial theme). The page resolves a multi-role label via `roleLabelFrom` (`Admin · Teacher · Student`) and passes `email`, `fullName`, `roleLabel` as props.

### SettingsEditorial section inventory

| Section               | Renders                                                                                 | State (real / stub-link)                                                         |
| --------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Profile               | `Email` (disabled), `Role` (disabled, full multi-role label), `Display name` (editable) | **Real** — `full_name` only; submits the `updateProfileNameAction` server action |
| Notifications         | One card linking to `/dashboard/settings/notifications`                                 | **Stub-link** — target page is a "Coming soon" card                              |
| Integrations / Google | _not rendered_                                                                          | Absent — no integrations/Google section in the editorial UI                      |
| Account               | _not rendered_ (no password / email-change / MFA / delete-account)                      | Absent — those live only in orphaned v1 `components/profile/*`                   |

So the editorial settings UI is **two cards**: a working `full_name`-only Profile form and a stub-link Notifications card. No phone, no avatar, no integrations, no account section.

### Self-edit form

- **Lives in:** `components/settings/editorial/SettingsEditorial.tsx`, mounted at `app/dashboard/settings/page.tsx`. The dedicated `app/dashboard/profile/page.tsx` is a **"Coming soon" stub** (16 LOC); the v1 `app/dashboard/profile/profile.client.tsx` + `components/profile/*` are orphaned (not mounted).
- **Field edited:** `full_name` **only** (`<input name="full_name" required maxLength=120>`).
- **Submit path:** `updateProfileNameAction` (`app/actions/profile-settings.ts`) — a Server Action, **not** the `PUT /api/users/profile` route. The action's Zod schema is `{ full_name: string }` only; it does `profiles.update({ full_name }).eq('id', user.id)`, `revalidatePath('/dashboard/settings')`, errors logged (not swallowed).
- **Missing:** `phone` and `avatar_url` inputs; any avatar upload UI (no storage-bucket call anywhere).

### Self-update route (confirmed)

`app/api/users/profile/route.ts` exposes **GET + PUT** (not PATCH), self-only via `getUserWithRolesSSR()` → `.eq('id', user.id)`. PUT's Zod schema already accepts `first_name`, `last_name`, `full_name`, `phone` (`PhoneSchema`), `avatar_url` (`z.string().url().optional().nullable()`); builds a partial `updates` object and **400s on an empty body** ("No fields to update"). The editorial form does **not** use this route yet — it uses the narrower server action.

### Multi-role (confirmed)

- `resolveActiveView` (`app/dashboard/page.tsx:57–70`) precedence is **Teacher > Student > Admin** (`if isTeacher→teacher; if isStudent→student; if isAdmin→admin`, default `teacher`), with `?view=` override gated on held role. Admin+Teacher (owner) correctly lands **teacher**. Matches the spec's "Current state" row.
- **Single-role assumption sites: 10**, as listed. Spot-checked 3 — all accurate: `MobileBottomNav.tsx:31` (`isStudent ? Stats : Students`), `AppSidebar.tsx:177` (single-label ladder) + `:192` (`isStudent ? 'Learning' : 'Teaching'`), `DashboardStatsGrid.tsx:105` (`data?.role === 'student'`).

### What's built

- Working self-edit of `full_name` from the editorial settings page (server action + RLS-scoped write).
- Full multi-role label rendering on the settings page (`roleLabelFrom` → `Admin · Teacher`).
- The self route (`PUT /api/users/profile`) already supports the full field set (`full_name`/`phone`/`avatar_url`) with partial-update + empty-body 400.
- Highest-role-wins view selection at the dashboard root (admin+teacher → teacher).

### What's missing

- **`phone` field** in the editorial form (and the action ignores it).
- **`avatar` field + avatar upload** — no input, no storage-bucket upload UI, nowhere writes `avatar_url`.
- Form submits to the **narrow server action**, not the capable self route — so even though the route supports phone/avatar, the UI can't reach them.
- **Settings sub-pages are stubs** — `/dashboard/settings/notifications` is "Coming soon"; `app/dashboard/profile/page.tsx` is "Coming soon".
- The 10 single-role rendering degradations (nav chips, group labels, stats grid) are all still live.

### Gap to this spec's target behavior (by thread)

- **Thread 1 — self-edit form:** add `phone` + `avatar` inputs and repoint the form to `PUT /api/users/profile` (which already accepts all three), or widen `updateProfileNameAction` to cover them; then build the net-new avatar storage-bucket upload. Optionally redirect the `/dashboard/profile` stub to `/dashboard/settings` so there is one self-edit surface.
- **Thread 2 — multi-role sweep:** `resolveActiveView` precedence is already correct (no change). Remaining work is the 10 single-role rendering sites — replace binary `isStudent ? …` chips/labels (#3,#4,#5,#7,#9) with union-of-held-roles rendering, leaving the "pure student" query guards (#1,#2) as-is.

## Data contract (self-update)

- **Route:** `PUT /api/users/profile` (self-only). Per [04](./04-users.md) the **per-user** admin route is also `PUT` (not PATCH) — confirmed; the self route is the separate `/profile` seam.
- **Auth:** `getUserWithRolesSSR()` → `user.id`; writes only `.eq('id', user.id)`. RLS (`update_own_or_admin_profile`) admits self-or-admin only — boundary is RLS (ADR-0001), app code does not re-`WHERE`.
- **Fields (self-editable):** `full_name`, `phone` (`PhoneSchema`), `avatar_url`. **Never** role flags / `is_active` / `student_status` here (those are admin-only via [04](./04-users.md)).
- **Payload rule:** include only sent fields (mirrors the route's existing partial-update; no flag/field clobber).

## Multi-role rule

- **Precedence (highest-role-wins):** the owner is **Admin+Teacher** and must see the **teacher** surface. The shipped `resolveActiveView` order is **Teacher > Student > Admin** — keep it (it satisfies the owner case); MASTER_SPEC §2.10 phrases it "Admin > Teacher > Student" but the **operative** requirement is "admin+teacher sees teacher, not student." Do not reorder to put Admin first, or the owner loses the teaching view.
- **Explicit switch:** the `?view=admin|teacher|student` param already overrides, gated by the matching held role. Keep as the manual override.
- **Chips, not a coerced type:** role labels render the **full set** held (`Admin · Teacher`), per `roleLabelFrom`. Replace single-label ladders (sites #5, #6) with the same multi-chip rendering.
- **"Pure student" is a real concept, multi-role is the bug:** a guard like `isStudent && !isTeacher && !isAdmin` (sites #1, #2) is **correct** for scoping a query to a student-only Profile. The defect is binary `isStudent ? …` (sites #3, #4, #7, #9) that degrades a Profile _holding_ the student role even when it also teaches.

## Behavior & edge cases / failure modes

- **Admin+Teacher (owner):** teacher surface; sidebar "Teaching"; both Admin and Teacher chips; Stats reachable.
- **Teacher+Student:** teacher surface (precedence), but nav must still expose student-only destinations it would otherwise hide (site #3 Stats) — render union of role tabs, not an either/or.
- **Student-only:** unchanged — "Learning" label, student stats.
- **Flag ≠ Role:** `isParent` / `isDevelopment` never enter view selection or role chips (CONTEXT.md). Do not add them to `resolveActiveView`.
- **Avatar upload:** net-new — upload to a Supabase storage bucket, write the public URL to `avatar_url` via the self route; validate as `z.string().url()`; failure surfaces, never swallowed.
- **Empty submit:** route already 400s on no-fields; the form must not send an all-empty body.

## Files to touch

| File                                                                                                          | Change                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `components/settings/editorial/SettingsEditorial.tsx`                                                         | Add `phone` + `avatar` fields; submit to `PUT /api/users/profile` (or extend the action to cover all three). |
| `app/actions/profile-settings.ts`                                                                             | Extend schema/update to `phone` + `avatar_url`, or delegate to the self route.                               |
| `app/dashboard/profile/page.tsx`                                                                              | Replace "Coming soon" stub → redirect to `/dashboard/settings` (single self-edit surface).                   |
| `components/navigation/MobileBottomNav.tsx:31`                                                                | Tabs as union of held roles (don't drop Stats for multi-role).                                               |
| `components/navigation/AppSidebar.tsx:177,192`                                                                | Multi-chip role label; group label not gated on `isStudent` alone.                                           |
| `components/navigation/HorizontalNav.tsx:129`                                                                 | Multi-chip role label.                                                                                       |
| `components/lessons/list/index.tsx:124` + `LessonTable.Empty.tsx`, `components/lessons/LessonTable.Empty.tsx` | Don't collapse the bag to one `role` for surface choice; derive from precedence.                             |
| `components/dashboard/DashboardStatsGrid.tsx:105`                                                             | Drive the student grid off held-role precedence, not a single `role` string.                                 |
| Deletions (gate 5, after self-edit soaks)                                                                     | v1 `components/profile/*` + `app/dashboard/profile/profile.client.tsx` once editorial is sole survivor.      |

## Acceptance criteria (as test names)

- `multi-role.render.test` — an admin+teacher Profile resolves to the **teacher** surface (`resolveActiveView` → `'teacher'`); never `'student'`.
- `multi-role.nav.test` — a teacher+student Profile sees both teaching and student (Stats) nav destinations; role chip shows all held roles, not one.
- `profile-self-edit.persist.test` — `PUT /api/users/profile` with `{ full_name, phone, avatar_url }` persists all three to the caller's own row and re-renders.
- `profile-self-edit.rls.test` — a Profile cannot write another Profile's `full_name`/`phone`/`avatar_url` (self-only RLS denial).
- `flag-not-role.test` — `isParent`/`isDevelopment` never alter view selection or role chips.

## Definition of Done (5-point)

1. **Behavior complete** — one editorial self-edit form covers `full_name` + `phone` + `avatar`; admin+teacher always lands on the teacher surface; every listed single-role site renders correctly for a multi-role Profile.
2. **No silent failure** — self-update + avatar upload surface errors (logged + returned), never swallowed; route 400s on empty body.
3. **RLS-tested** — `profiles.rls.test` (shared with [04](./04-users.md)) asserts self-only update for `full_name`/`phone`/`avatar_url` against real Supabase.
4. **Renders via editorial** — settings/profile mount `components/settings/editorial/*`; no `ui-version` cookie branch.
5. **v1 deleted** — `components/profile/*` (v1) and `app/dashboard/profile/profile.client.tsx` removed once the editorial form is the sole survivor; `tsc --noEmit` clean.

## Dependencies & out of scope

- **Depends on:** [Phase 0](./00-phase-0-restore-truth.md) (RLS truth); the self route + `roles` bag (`getUserWithRolesSSR`). Admin-side role/flag/active edit is [04](./04-users.md).
- **Out of scope:** email change, account deletion, MFA setup, linked accounts (the orphaned v1 `components/profile/*` features — defer or drop; MFA is removed per [06](./06-auth-shadow.md)/D-06); `first_name`/`last_name` split (route supports them, form need not surface them).

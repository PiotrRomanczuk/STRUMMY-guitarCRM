# Editorial Production Migration Plan

**Date**: 2026-06-09
**Author**: Claude
**Scope**: Convert all 14 design-preview artboards into production pages backed by real Supabase data, in-place at existing routes.

## Goal

The editorial design-preview canvas (under `/design-preview/*`) is the new v3 visual language for Strummy. This document plans the migration from "isolated artboards with mock data" to "real production pages at existing routes." After this migration:

- `/dashboard/*` routes render the editorial design end-to-end
- `/design-preview/*` stays as the canonical visual reference (frozen design record)
- v1 (`components/<domain>/`) and v2 (`components/v2/<domain>/`) become candidates for deletion in a focused cleanup PR

## What's done

| Layer          | Section                            | Status                                  | PR       |
| -------------- | ---------------------------------- | --------------------------------------- | -------- |
| Mockup         | dashboards (student/teacher/admin) | shipped to `/design-preview/*`          | #428     |
| Mockup         | auth                               | shipped to `/design-preview/auth`       | #429     |
| Mockup         | onboarding                         | shipped to `/design-preview/onboarding` | #430     |
| Mockup         | song-detail                        | open                                    | #431     |
| Mockup         | assignments                        | open                                    | #432     |
| **Production** | **song-detail**                    | **open — first stripe**                 | **#433** |

## Pattern (proved by #433)

The production version of an editorial section follows this shape:

```
app/<route>/page.tsx
  Server component. Reads route params, auths via existing layout, parallel-fetches data,
  wraps content in `<div className="theme-editorial {geist.variable} ...">`,
  imports `@/app/design-preview/editorial-tokens.css` once at the top of the file.

components/<domain>/editorial/
  primitives.tsx        — Card, CardHeader, and any local visual primitives
  format.ts             — small pure helpers (msToClock, monthYear, …)
  <Section>.tsx         — one per visual area (Hero / Body / Sidebar pieces)
  <Domain>Editorial.tsx — orchestrator that composes the above

lib/services/<domain>-detail-queries.ts
  Server-only Supabase queries returning typed shapes consumed by the page.
```

Conventions enforced:

- Dashboard layout already provides `SidebarNav` + `TopBar` chrome and role gating; editorial sections do **not** re-mount these.
- Editorial CSS variables live behind `.theme-editorial` so the shadcn dashboard theme is unaffected outside this wrapper.
- Primitives are inlined per domain, **not** imported from `/design-preview/*` (production must not depend on the design-preview namespace).
- Lint warnings on `max-lines-per-function` and `max-lines` are accepted for the editorial visual layer (matches the shipped onboarding/dashboards pattern).

## Section catalog

Order is recommended priority. "Scope" is rough effort: S = 1 session, M = 2-3 sessions, L = 4+ sessions or needs schema work.

### Tier 1 — domain core

| #   | Section        | Production route                                        | Tables needed                                                                                      | Mutations                                          | Scope | v1/v2 to delete                                                       |
| --- | -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| 1   | song-detail ✅ | `/dashboard/songs/[id]`                                 | `songs`, `student_repertoire`, `lesson_songs`                                                      | — (deferred to assignments)                        | S     | `components/songs/details/`, `components/v2/songs/SongDetailPage.tsx` |
| 2   | assignments    | `/dashboard/assignments`, `/dashboard/assignments/[id]` | `assignments`, `assignment_submissions`, `student_repertoire`, `lesson_songs`, `practice_sessions` | create assignment, submit recording, mark reviewed | M     | `components/assignments/`, `components/v2/assignments/`               |
| 3   | lessons        | `/dashboard/lessons`, `/dashboard/lessons/[id]`         | `lessons`, `lesson_songs`, `lesson_history`, `profiles`                                            | create lesson, update notes, mark complete         | M     | `components/lessons/`, `components/v2/lessons/`                       |
| 4   | student-detail | `/dashboard/users/[id]`                                 | `profiles`, `student_repertoire`, `lessons`, `practice_sessions`, `chord_quiz_attempts`            | — (read-only first)                                | M     | `components/users/`, `components/students/`, `components/v2/users/`   |

### Tier 2 — first-time + cross-cutting flows

| #   | Section    | Production route                                                 | Tables needed                                    | Mutations                         | Scope | v1/v2 to delete                                                                           |
| --- | ---------- | ---------------------------------------------------------------- | ------------------------------------------------ | --------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| 5   | onboarding | `/onboarding`                                                    | `profiles`, `user_preferences`, `user_settings`  | save studio info, set goals/level | S     | `components/onboarding/`, `components/v2/onboarding/`, `components/v2/stitch/onboarding/` |
| 6   | auth       | `/sign-in`, `/sign-up`, `/forgot-password`, `/accept-invitation` | `auth.users`, `profiles`                         | sign in/up flows (already exist)  | S     | `components/auth/` (audit before deleting — auth flows live there too)                    |
| 7   | dashboards | `/dashboard` (role-routed)                                       | already aggregated by existing dashboard queries | —                                 | M     | `components/dashboard/`, `components/v2/dashboard/`                                       |

### Tier 3 — secondary views

| #   | Section       | Production route                                     | Tables needed                                   | Mutations           | Scope | v1/v2 to delete                                             |
| --- | ------------- | ---------------------------------------------------- | ----------------------------------------------- | ------------------- | ----- | ----------------------------------------------------------- |
| 8   | settings      | `/dashboard/settings`                                | `user_settings`, `user_preferences`, `profiles` | update each setting | S     | `components/settings/`, `components/v2/settings/`           |
| 9   | notifications | `/dashboard/notifications`                           | `notifications`, `notification_queue`           | mark read, dismiss  | S     | `components/notifications/`, `components/v2/notifications/` |
| 10  | song-form     | `/dashboard/songs/new`, `/dashboard/songs/[id]/edit` | `songs`                                         | create/update song  | M     | `components/songs/form/`                                    |
| 11  | fretboard     | `/dashboard/fretboard`                               | none (interactive)                              | —                   | S     | `components/fretboard/`, `components/v2/fretboard/`         |

### Tier 4 — new surfaces (no current route)

| #   | Section | Production route                                   | Tables needed                                                    | Mutations | Scope             | Notes                                                               |
| --- | ------- | -------------------------------------------------- | ---------------------------------------------------------------- | --------- | ----------------- | ------------------------------------------------------------------- |
| 12  | parent  | new `/parent` (or `/dashboard/parent`)             | `profiles`, `student_repertoire`, `lessons`, `practice_sessions` | —         | M                 | Needs RLS policy work — parent role doesn't exist yet               |
| 13  | tablet  | new `/tablet` or query param flag on lesson detail | reuses lesson-detail data                                        | —         | S                 | Mostly a layout variant of lesson-detail; defer until lessons ships |
| 14  | landing | `/` (homepage)                                     | none                                                             | —         | already in flight | `feature/STRUM-landing-cinematic` branch already exists per planner |

### Reference-only (no production target)

- **states** — empty + loading state previews. Not a route; the patterns get adopted into each section's empty/skeleton states as those ship. No production migration needed.

## Cross-cutting concerns

### 1. Theme scoping

Every production page wraps content in `<div className="theme-editorial ${fonts}">` and imports `editorial-tokens.css` at the page level. **Do not** add the `.theme-editorial` class to the dashboard layout — that would impose the editorial theme on every dashboard page including ones not yet migrated.

Once all sections migrate, consolidate font loading into the dashboard layout and drop per-page font declarations. Defer until last section is in.

### 2. Mobile

The editorial prototypes are desktop-first (1440 wide). Each section gets a mobile pass:

- **Hero**: stack album art above text, drop meta strip into a wrapped grid
- **Two-column body+sidebar**: collapse to single column, move sidebar below body
- **Grids in body cards**: `repeat(auto-fill, minmax(_, 1fr))` already used in song-detail
- **Tabs / chips**: stay; design works at narrow widths
- Test at 390×844 (iPhone 12/15) and 768×1024 (iPad Pro)

Mobile is a separate deliverable per section, not a per-component concern. Ship desktop-first, then add a media-query pass.

### 3. Role-based variants

Some sections render differently per role (assignments teacher vs student is the obvious one). Pattern:

- Auth happens in the dashboard layout — pages get role flags via `getUserWithRolesSSR`
- Single editorial component takes a `role: 'teacher' | 'student' | 'admin'` prop
- Branches at the orchestrator level, not inside leaf components
- This mirrors how `<LessonApp role="teacher" />` was structured in the prototype

### 4. Mutations + Server Actions

Section migrations defer mutations to focused follow-up PRs. The visual stripe ships first (read-only), then mutations land in a second PR. Reasons:

- Mutations have their own RLS + permission surface; reviewing them mixed in with visual work splits attention
- Most editorial work is GET; mutations are a small share of the diff but a large share of the risk
- Easier to test/roll-back

### 5. v1/v2 deletion

After each section ships:

1. Open a small cleanup PR that deletes the corresponding `components/<domain>/` and `components/v2/<domain>/` directories (but not the directory itself if shared by other features).
2. Run `npx tsc --noEmit` to surface any orphan references — usually a few `components/v2/navigation/Sidebar.tsx` or similar that ref the deleted UI.
3. Keep deletions one-section-per-PR so they're trivially reviewable + revertable.

This matches the planner's #1 refactor priority: "Pick v1-vs-v2 component direction and produce per-domain deletion checklist."

## Recommended order

1. **#433 lands first** (song-detail production — already open). Verify in preview, merge.
2. **assignments** — biggest user value (teachers actively use it daily) and proves role-based variant pattern.
3. **lessons** — connects assignments to song-detail. Likely needs the lesson_songs reshape mentioned in the prototype.
4. **dashboards** — high visibility; once tier-1 detail pages are editorial, the dashboard cards linking to them need to match.
5. **student-detail** — completes the teaching loop.
6. **onboarding + auth** — first-time user experience polish.
7. **settings + notifications** — small, can be done in parallel with anything.
8. **song-form** — touchier because it's the input surface for everything in song-detail.
9. **fretboard + landing + tablet + parent** — surface area; landing is in flight separately.

## Definition of done per section

Before a section can be considered shipped to production:

- [ ] Real Supabase queries replace all mock data
- [ ] Editorial visual matches `/design-preview/<section>` at desktop widths
- [ ] Loading state defined (skeleton or progressive — not a spinner)
- [ ] Empty state defined (when query returns no rows)
- [ ] 404 / not-found handled where applicable
- [ ] Role variants if any are wired correctly
- [ ] Mutations (if in scope for that PR) have a Server Action + Zod validation
- [ ] Mobile pass either landed or scheduled
- [ ] v1/v2 deletion PR opened (can be after merge, must not be skipped)
- [ ] No `any` types in new code
- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint <scope>` 0 errors
- [ ] Production page tested at preview URL against at least one real record

## Out of scope for this plan

- Adding tables that don't exist (`song_sections`, `song_tabs`, structured lyrics) — these become STRUM tickets of their own.
- Mobile-first redesign of any section that isn't desktop-stable.
- Parent role schema work (needed for section 12).
- Real-time/Supabase Realtime layer; current editorial design is request-response.
- Cleanup of `tasks/design-preview/` itself — that folder stays as the canonical per-section task tracker until all sections are merged.

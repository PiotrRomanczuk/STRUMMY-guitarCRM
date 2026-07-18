---
created: 2026-06-16
updated: 2026-06-16
feature: Lessons
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/02-lessons-calendar.md.

# Spec 02 — Lessons

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md). Depends on [Phase 0](./00-phase-0-restore-truth.md). Related: [06-auth-shadow](./06-auth-shadow.md) (shadow create), [07-calendar](./07-calendar.md) (sync).

## Goal

A Teacher (or Admin) creates and edits Lessons through real editorial pages — no "Coming soon" stub. Creating a Lesson for a student with no account yet produces a shadow Profile inline. A Google-connected Teacher's create/edit pushes the change to Google Calendar as a side-effect that never blocks the write. The route mounts `components/lessons/editorial/*` only; the v1 (`components/lessons/*`) and v2 (`components/v2/lessons/*`) trees are deleted on done (MASTER_SPEC §3.2).

## User stories (by role)

| Role    | Story                                                                                                                                                                            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher | I create a Lesson for one of my students (or a new email → shadow Profile created inline), set title / scheduled time / notes; if I'm Google-connected a calendar event appears. |
| Teacher | I edit a Lesson's title, time, status, or notes; if it has a `google_event_id` and I'm connected, the calendar event updates.                                                    |
| Admin   | I create/edit Lessons for any Teacher–Student pair (not constrained to `teacher_id = self`).                                                                                     |
| Student | I never reach the create/edit pages (mutation is admin/teacher-only); RLS hides Lessons that aren't mine.                                                                        |

## Current state (verified 2026-06-16)

| Area                                          | State                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/dashboard/lessons/new/page.tsx`          | **Stub** — renders a "Coming soon" `Card`.                                                                                                                                                                                                                         |
| `app/dashboard/lessons/[id]/edit/page.tsx`    | **Stub** — identical "Coming soon" `Card`.                                                                                                                                                                                                                         |
| `app/dashboard/lessons/page.tsx`              | Already editorial — mounts `LessonsListEditorial` via `getRecentLessons`/`summariseLessons`.                                                                                                                                                                       |
| `components/lessons/editorial/*`              | List + detail only: `LessonsListEditorial.tsx`, `LessonDetailEditorial.tsx`, `primitives.tsx`, `format.ts`. **No editorial form exists yet** — must be built. No `index.ts`.                                                                                       |
| `POST /api/lessons`                           | `route.ts` → `withApiAuth` → `createLessonHandler` (handlers/create.ts). Guards `flags.isDevelopment` (403 test-account).                                                                                                                                          |
| `createLessonHandler`                         | Validates `LessonInputSchema`, checks teacher/student rows, inserts, adds songs, then `await syncLessonCreation(supabase, data)`. **Requires an existing `student_id` (uuid).** No inline `matchStudentByEmail`/shadow-create here today.                          |
| `PUT /api/lessons/[id]`                       | `[id]/route.ts` → `updateLessonHandler`. `ALLOWED_UPDATE_FIELDS = student_id, teacher_id, title, notes, scheduled_at, status`. Calls `syncLessonUpdate` only when `title`/`scheduled_at`/`notes` changed.                                                          |
| `syncLessonCreation` / `syncLessonUpdate`     | `lib/services/calendar-lesson-sync.ts`. Both wrap Google calls in try/catch and **return silently** when no integration / no event id — never fail the lesson write.                                                                                               |
| `matchStudentByEmail` / `createShadowStudent` | `lib/services/import-utils.ts`. Used by the **calendar-import** path (`google-calendar-sync.ts`, `calendar-bulk-import.ts`, `app/actions/import-lessons.ts`) — **not** by lesson create today. Shadow rows: `is_shadow = true`, `user_id = null`.                  |
| RLS on `lessons`                              | Canonical SELECT in `20260224122350_critical_db_fixes.sql`: admin sees all (`deleted_at IS NULL` + `is_admin`), teacher sees `teacher_id = auth.uid()`, student sees `student_id = auth.uid()`. INSERT/UPDATE/DELETE in `20251208000001_…`: admin or teacher only. |
| Bulk empty-body                               | `app/api/lessons/bulk` already returns 400 on empty/non-array `lessons` — Phase 0 owns the `DELETE` empty-body 500; **out of scope here**.                                                                                                                         |

## Editorial UI — current implementation (verified 2026-06-16)

**Mounted at:**

- `/dashboard/lessons` (`app/dashboard/lessons/page.tsx`) — SSR auth via `getUserWithRolesSSR`; wraps `LessonsListEditorial` in `.theme-editorial` with Geist/Geist Mono/Fraunces font vars + `design-preview/editorial-tokens.css`. Reads `?status=` / `?sort=` searchParams, passes them to `getRecentLessons`.
- `/dashboard/lessons/[id]` (`app/dashboard/lessons/[id]/page.tsx`) — same shell; loads via `getLessonDetail(id)`, `notFound()` when null.
- `/dashboard/lessons/new` and `/dashboard/lessons/[id]/edit` — **stubs** ("Coming soon" `Card`); NO editorial form mounted. `LessonsListEditorial` links to `/dashboard/lessons/new` ("+ New lesson", teacher/admin only) and `LessonDetailEditorial` references an "edit view" in copy, but neither destination is built.

### Component inventory

| Component                   | Lines | Renders                                                                                                                                                                                                                                                                                                                                                                   | Data source                                                                                                                                                                                       | State                                                                                     |
| --------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `LessonsListEditorial.tsx`  | 337   | Header (eyebrow/title/count, "+ New lesson" CTA), status filter pills w/ per-status counts, newest/oldest sort toggle, lessons table (date, optional student col, title, status pill), empty state. Internal `Header` sub-component + `buildFilterHref`/`buildSortHref` helpers driving filter/sort via URL query.                                                        | Props only: `lessons: LessonRow[]`, `breakdown: LessonsBreakdown`, `canCreate`, `showStudentColumn`, `activeStatuses`, `activeSort`. (Page does the `getRecentLessons`/`summariseLessons` query.) | **WIRED** (read-only list; all nav is `<Link>`)                                           |
| `LessonDetailEditorial.tsx` | 291   | Back link, header (date eyebrow, italic title, status pill, "with <student>" link to `/dashboard/users/:id`), 2-col grid: Repertoire card (song rows → `/dashboard/songs/:id`, key chip, author, per-song status) + Notes card. Local `Card`/`CardHeader` sub-components + own `STATUS_LABELS`/`STATUS_COLOURS` maps (UPPERCASE keys, duplicated from `lessons-queries`). | Props only: `lesson: LessonDetail` (page does `getLessonDetail`).                                                                                                                                 | **WIRED** (read-only; "Add them from the edit view" copy points at an unbuilt edit route) |
| `primitives.tsx`            | 79    | Shared `Card`, `LessonStatusPill` (dot + uppercase mono label), `StudentInitials` (gradient avatar, 1–2 initials from name/email).                                                                                                                                                                                                                                        | Pure presentational props.                                                                                                                                                                        | **WIRED** (consumed by `LessonsListEditorial`)                                            |
| `format.ts`                 | 16    | `formatLessonDate` / `formatLessonClock` / `formatLessonWeekday` — `en-US` `toLocale*` formatters over ISO strings.                                                                                                                                                                                                                                                       | Pure string in/out.                                                                                                                                                                               | **WIRED**                                                                                 |

> Note: `LessonDetailEditorial.tsx` defines its own status label/colour maps and `Card`/`CardHeader` inline rather than reusing `primitives.tsx` or `lessons-queries`' `lessonStatusLabel`/`lessonStatusColour` (which `LessonsListEditorial` does use). Minor duplication, not a functional gap.

**What's built:**

- Read surfaces are fully wired: list (with server-driven status filtering + sort) and detail (lesson header + repertoire + notes), both rendering through `components/lessons/editorial/*` with no `ui-version` cookie branch — already matching DoD point 4 for the read paths.
- Status filter / sort are stateless and URL-driven (`buildFilterHref`/`buildSortHref` → `?status=&sort=`); the page parses + re-queries. No client state, no hooks.
- `canCreate` (teacher/admin) already gates the "+ New lesson" CTA; `showStudentColumn` (teacher/admin) toggles the student column — role plumbing for the create flow is in place at the list level.

**What's missing:**

- **No editorial create/edit FORM exists** — `LessonFormEditorial.tsx` is net-new (the `Files to touch` row). The only form components under `components/lessons/` are the **v1** tree (`form/LessonForm*.tsx`, `hooks/useLessonForm.ts`, `MobileLessonForm.tsx`) slated for deletion, not editorial.
- No `index.ts` re-export barrel in `components/lessons/editorial/`.
- No student picker / email→shadow input, no `scheduled_at` input, no status select, no song picker — i.e. none of the create/edit interaction surface from the user stories.
- Detail view has no edit affordance (no link/button to an edit route); its "Add them from the edit view" copy is aspirational.

**Gap to this spec's target behavior:**

- **User stories (Teacher create / edit; Admin create for any pair):** unmet — there is no form to drive `POST /api/lessons` or `PUT /api/lessons/[id]` from editorial. The list/detail give the read half; the entire mutation half (incl. inline shadow-Profile create from a new email) is unbuilt.
- **Data contract (`POST` create):** the editorial layer cannot yet submit `student_id` **or** the spec's new `student_email` (xor) shadow path; `schemas/LessonSchema.ts` + `handlers/create.ts` changes are also still pending.
- **Definition of Done:** points 1 (behavior complete: `new`/`[id]/edit` render + persist), 3 (`lessons.rls.test`), and 5 (v1/v2 deletion) are open. Point 4 (renders via editorial) is **already satisfied for list + detail** and need only extend to the two form routes. The single largest gap is the **absent `LessonFormEditorial.tsx`** — every create/edit story and acceptance test depends on it.

## Data contract

### `POST /api/lessons` (create)

- **Auth**: `withApiAuth`; `flags.isDevelopment` → 403. `validateMutationPermission(profile)` → admin/teacher only.
- **Payload** (`LessonInputSchema`): `student_id` (uuid, required), `teacher_id` (uuid, required), `scheduled_at` (string, required), `title?`, `notes?`, `status?` (`SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED`), `song_ids?` (uuid[]).
- **Server checks**: teacher row exists + `is_teacher` (unless admin); non-admin may only set `teacher_id = self`; student row exists + `is_student`.
- **Shadow-create extension (this spec)**: the editorial picker may submit a new email instead of a `student_id`. Resolve via `matchStudentByEmail(email, admin)` → `MATCHED` uses the existing id; `NONE` calls `createShadowStudent(email, first, last, admin)` and uses the new id; `AMBIGUOUS` returns 409 for the UI to disambiguate. This is the same seam as [06-auth-shadow](./06-auth-shadow.md); the resulting Teaches relationship (CONTEXT.md) is materialized by the inserted Lesson itself.
- **Side-effect**: `await syncLessonCreation(supabase, data)` — see calendar note below.
- **Response**: `201` with the lesson row (do not wrap in `data`).

### `PUT /api/lessons/[id]` (edit)

- **Auth**: same guards as create.
- **Payload**: `LessonInputSchema.partial()`; only `ALLOWED_UPDATE_FIELDS` are written.
- **Side-effect**: `syncLessonUpdate` fires only when `title`/`scheduled_at`/`notes` is present in the update.
- **Response**: `200` with the updated row; `404` on `PGRST116` (not found / RLS-hidden).

### Calendar side-effect (`syncLessonCreation` / `syncLessonUpdate`)

- Best-effort, never blocks the write. `hasGoogleIntegration(teacher_id)` false → silent return. Create path also needs a deliverable student email (`getStudentEmail`); a shadow with no real email → `logger.warn` + skip (aligns with the §2.6.2 deliverable-email chokepoint). On success, create stores `google_event_id` on the Lesson.
- **RLS**: both handlers run on `createAdminClient()`; RLS is the boundary for the _read/list_ paths (no app-side `WHERE` duplication — CONTEXT.md → StudentAccess), not for these admin-client writes.

## Behavior & edge cases / failure modes

| Case                                      | Expected behavior                                                                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unknown student email (create)            | `matchStudentByEmail` → `NONE` → `createShadowStudent` (`is_shadow=true`, `user_id=null`) → Lesson inserted against the shadow id.                                                                                     |
| Ambiguous email (create)                  | `AMBIGUOUS` → 409; editorial picker prompts to pick the existing Profile.                                                                                                                                              |
| Google-disconnected teacher               | `hasGoogleIntegration` false → no event, lesson still created/updated (201/200). No error surfaced.                                                                                                                    |
| Shadow student, Google-connected teacher  | Create: no deliverable email → skip attendee/event (warn-logged), lesson succeeds. Reconciled on link by [06-auth-shadow](./06-auth-shadow.md) §2.6.3.                                                                 |
| Google API throws                         | try/catch in sync service logs and swallows — write is committed; `google_event_id` simply absent.                                                                                                                     |
| Status transitions                        | `SCHEDULED → IN_PROGRESS → COMPLETED \| CANCELLED`. `status` is in `ALLOWED_UPDATE_FIELDS`; the DB trigger `tr_notify_lesson_completed` owns the recap email (do not send from the handler).                           |
| Timezone of `scheduled_at`                | Stored as the ISO/`datetime-local` string the client submits; the editorial form must send an explicit offset (or document UTC) so the Google event time matches the displayed clock. No server-side reinterpretation. |
| Non-admin teacher targets another teacher | 403 (`Teachers can only create lessons for themselves`).                                                                                                                                                               |
| Edit with empty/no-op body                | Handler re-selects and returns the row (200); no calendar sync fires.                                                                                                                                                  |

## Files to touch

| File                                                   | Change                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/lessons/new/page.tsx`                   | Replace stub; SSR auth + mount editorial create form.                                                                                                                                                                                                                                  |
| `app/dashboard/lessons/[id]/edit/page.tsx`             | Replace stub; load lesson, mount editorial edit form (404 if RLS-hidden).                                                                                                                                                                                                              |
| `components/lessons/editorial/LessonFormEditorial.tsx` | **New** — shared create/edit form (student picker w/ email→shadow, title, `scheduled_at`, status, notes, song picker). Add `index.ts` re-exports.                                                                                                                                      |
| `app/api/lessons/handlers/create.ts`                   | Add email→`matchStudentByEmail`/`createShadowStudent` resolution before the `student_id` checks; 409 on `AMBIGUOUS`.                                                                                                                                                                   |
| `schemas/LessonSchema.ts`                              | Allow the create payload to carry an alternative `student_email` (xor `student_id`) for the shadow path.                                                                                                                                                                               |
| `__tests__` (RLS + handlers)                           | Add the acceptance tests below.                                                                                                                                                                                                                                                        |
| **Delete on done**                                     | `components/lessons/*` (v1 form/list/details/hooks, incl. duplicate `components/lessons/CalendarWebhookControl.tsx`) and `components/v2/lessons/*`, after editorial soaks in preview (MASTER_SPEC §6 risk 1: stage the deletion in a separate PR). `tsc --noEmit` after each deletion. |

## Acceptance criteria (as test names)

- `lesson-create.calendar.test` — Google-connected teacher creating a lesson produces a calendar event and stores `google_event_id`.
- `lesson-create.shadow.test` — creating a lesson for an unknown email creates a shadow Profile (`is_shadow=true`, `user_id=null`) and the Teaches relationship (via the inserted lesson).
- `lesson-create.ambiguous.test` — duplicate email candidates → 409, no lesson written.
- `lesson-edit.calendar.test` — editing title/time on a lesson with `google_event_id` calls `syncLessonUpdate`; editing only `status` does not.
- `lesson-create.google-disconnected.test` — teacher without integration still gets 201; no event, no error.
- `lessons.rls.test` — admin sees all non-deleted; teacher sees only own (`teacher_id`); student sees only own (`student_id`); soft-deleted hidden.

## Definition of Done (5-point)

1. **Behavior complete** — `new` and `[id]/edit` render the editorial form; create (incl. inline shadow) and edit both persist.
2. **No silent failure** — every backend call hits a live table/RPC; calendar failures are logged, not swallowed onto a user-facing error; writes always return their real status.
3. **RLS-tested** — `lessons.rls.test` asserts teacher isolation + student own-only against real Supabase (`jest.config.rls.ts`).
4. **Renders via editorial** — both routes mount `components/lessons/editorial/*`; no `ui-version` cookie branch.
5. **v1/v2 deleted** — `components/lessons/*` and `components/v2/lessons/*` removed (staged after preview soak); `tsc --noEmit` clean.

## Dependencies & out of scope

- **Depends on**: [Phase 0](./00-phase-0-restore-truth.md) (bearer/cron/CI signal, `notification_log` for the deliverable-email chokepoint); [06-auth-shadow](./06-auth-shadow.md) (shadow create + calendar reconciliation on link); [07-calendar](./07-calendar.md) (connect/disconnect, webhook, the editorial calendar page).
- **Out of scope**: the `DELETE /api/lessons/bulk` empty-body 500 (Phase 0 §0.6); recurring-lesson generation (07-calendar §3.4); the calendar connect/disconnect UI and `CalendarWebhookControl` consolidation (07-calendar); live-lesson and post-lesson-summary surfaces.

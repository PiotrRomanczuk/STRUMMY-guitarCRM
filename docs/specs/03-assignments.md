---
created: 2026-06-16
updated: 2026-06-16
feature: Assignments
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/06-assignments.md.

# Spec 03 — Assignments

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md). Depends on [Phase 0](./00-phase-0-restore-truth.md), [08-notifications](./08-notifications.md).

## Goal

A teacher creates an assignment (optional lesson/song link); the student sees it and receives an in-app notification. The student moves it `in_progress`/`completed` (status-only, server-enforced); the teacher sees the change. The route renders via `components/assignments/editorial/*` and the v1 + v2 trees are deleted.

## User stories (by role)

| Role          | Story                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher/Admin | Create an assignment for a student I teach, with title, optional description, due date, and optional lesson/song pickers. The student is notified in-app.   |
| Teacher/Admin | Open an assignment detail, edit any field, soft-delete it; see the student's status changes.                                                                |
| Student       | See assignments assigned to me; open a detail; move status `not_started → in_progress → completed` (or `cancelled`); never edit title/description/due date. |
| Student       | Receive an in-app notification the moment a teacher creates an assignment for me.                                                                           |

## Current state (verified 2026-06-16)

| Area                                                      | State                                                                                                                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List `app/dashboard/assignments/page.tsx`                 | **Done** — mounts `AssignmentsListEditorial`; role-aware (`asStudent`) via `getUserWithRolesSSR` + `getAssignments`/`countAssignmentsByStatus`.                                                 |
| `app/dashboard/assignments/new`                           | **Stub** — "Coming soon" card.                                                                                                                                                                  |
| `app/dashboard/assignments/[id]`                          | **Stub** — "Coming soon" card.                                                                                                                                                                  |
| `app/dashboard/assignments/[id]/edit`                     | **Stub** — "Coming soon" card.                                                                                                                                                                  |
| `POST /api/assignments` (`createAssignmentHandler`)       | **Done** — permission + student + lesson validation, then `queueNotification({ type:'assignment_created' })`. Notify is wrapped in try/catch and **does not fail** the create.                  |
| `PATCH /api/assignments/[id]` (`updateAssignmentHandler`) | **Done** — `validateStudentUpdate` blocks students from non-`status` fields at the app layer. Uses cookie-bound `createClient`.                                                                 |
| `updateAssignmentStatus` (`app/actions/assignments.ts`)   | **Done** — student-only server action; ownership + `validateStatusTransition`; cookie-bound client; revalidates paths. Consumed by `components/assignments/shared/AssignmentStatusActions.tsx`. |
| Status enum + state machine                               | **Done** — `AssignmentStatusEnum` (`not_started, in_progress, completed, overdue, cancelled`) + `VALID_STATUS_TRANSITIONS` + `validateStatusTransition` in `schemas/AssignmentSchema.ts`.       |
| RLS (`assignments_*_policy`, migration `20251208000001`)  | **SELECT** admin/teacher/student own. **UPDATE/INSERT/DELETE** admin **or** teacher only. **No student UPDATE policy.**                                                                         |
| Notification tables                                       | Restored in [Phase 0 bucket A](./00-phase-0-restore-truth.md). `queueNotification` writes `notification_queue`.                                                                                 |
| v1 tree                                                   | `components/assignments/*` (AssignmentForm, AssignmentList, list/, student/, shared/, hooks/, templates/).                                                                                      |
| v2 tree                                                   | `components/v2/assignments/*` (AssignmentForm, AssignmentDetail, AssignmentList, etc.).                                                                                                         |

**Divergence (must fix):** the student status path (`updateAssignmentStatus` and `PATCH` student branch) runs through RLS as the student, but `assignments_update_policy` admits **only** admin/teacher. A student "complete" therefore 403s at the DB even though app code allows it. The status-only write needs a dedicated RLS UPDATE policy (`student_id = auth.uid()` with a `status`-only column guard) — see Behavior below.

## Editorial UI — current implementation (verified 2026-06-16)

**Mounted at:** `app/dashboard/assignments/page.tsx` only. It wraps `AssignmentsListEditorial` in the `theme-editorial` font/token shell (Geist + Geist_Mono + Fraunces, `editorial-tokens.css`). The three sub-routes (`new`, `[id]`, `[id]/edit`) are still the literal "Coming soon — being rebuilt" `Card` stubs; none mount an editorial component. `templates/*` routes also exist but are out of scope.

| Component                                                       | Lines | Renders                                                                                                                                                                                                                                         | Data source                                                                                                                                                | State                                                                            |
| --------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `components/assignments/editorial/AssignmentsListEditorial.tsx` | 259   | Header (`From your teacher`/`Teaching` eyebrow + count strip) + bordered card with a grid table; each row is a `Link` to `/dashboard/assignments/[id]`; role-aware columns; empty-state copy. Inline `Initials` avatar sub-component (in-file). | `AssignmentRow[]` + `counts` + `asStudent` props, fetched SSR in `page.tsx` via `getAssignments(user.id, asStudent)` and `countAssignmentsByStatus(rows)`. | **WIRED** (list only) — presentational, no client state; status shown read-only. |
| `app/dashboard/assignments/new/page.tsx`                        | 16    | "Coming soon" `Card`.                                                                                                                                                                                                                           | none                                                                                                                                                       | **STUB**                                                                         |
| `app/dashboard/assignments/[id]/page.tsx`                       | 16    | "Coming soon" `Card`.                                                                                                                                                                                                                           | none                                                                                                                                                       | **STUB**                                                                         |
| `app/dashboard/assignments/[id]/edit/page.tsx`                  | 16    | "Coming soon" `Card`.                                                                                                                                                                                                                           | none                                                                                                                                                       | **STUB**                                                                         |

**What's built**

- List route fully wired through the editorial shell, role-aware: teachers/admins see a `Student / Title` + dedicated `Status` column; students (`asStudent = isStudent && !isTeacher && !isAdmin`) see a condensed layout. Status is rendered via `assignmentStatusLabel`/`assignmentStatusColour` (a coloured pill + dot, plus `overdue` due-date highlighting). Role/empty copy differs per role. Count strip shows total/pending/in_progress/completed/overdue.
- Data layer for the list is real: `getAssignments` selects from `assignments` joined to the student profile, filtered by `student_id` or `teacher_id`; errors are logged and degrade to `[]`. `countAssignmentsByStatus` is derived from the already-fetched rows (no separate count query).

**What's missing** (all net-new per this spec)

- `AssignmentFormEditorial.tsx` — no editorial create/edit form exists; `new` and `[id]/edit` are stubs. (`getAssignments` returns only list fields — `id, title, status, dueDate, teacher/student ids, studentName/email, createdAt` — so it cannot back a detail/edit view; a `getAssignment(id)` read is also missing.)
- `AssignmentDetailEditorial.tsx` — no editorial detail; `[id]` is a stub. No status-timeline render.
- **Status-control UI is absent from the editorial tree.** The list shows status read-only; there is no editorial mount of `AssignmentStatusActions` (the student `not_started → in_progress → completed/cancelled` control). The status action + server action exist (`components/assignments/shared/`, `app/actions/assignments.ts`) but are only reachable from the v1 tree, not editorial.
- No editorial create→notify entry point: the only path that calls `POST /api/assignments` + `queueNotification` is the v1 `AssignmentForm`; the editorial UI offers no "create" affordance beyond the empty-state copy.

**Gap to this spec's target behavior**

- **State machine** (`not_started → in_progress → completed`/`cancelled`, `overdue` derived): zero editorial surface to drive it — the student inbox renders status as a label only, with no transition buttons. `AssignmentDetailEditorial` + an editorial mount of `AssignmentStatusActions` are required to make `validateStatusTransition` reachable for students. (The RLS student status-only UPDATE gap from "Divergence" above still blocks the green path even once the UI lands.)
- **Create → notify flow**: no editorial form, so the teacher create path (which fires `assignment_created`) is unreachable from the editorial route; `AssignmentFormEditorial` + a "create" CTA must be built and wired to `POST /api/assignments`.
- Net: the editorial migration is **~1 of 4 surfaces done** (list). Create, detail, edit, and the student status control are all unbuilt; the route still depends on the v1/v2 trees for every mutation, so the gate-5 deletion of `components/assignments/*` and `components/v2/assignments/*` is blocked until they exist.

## Data contract

### `POST /api/assignments` — create

- Auth: `withApiAuth`; `flags.isDevelopment` → 403 (`TEST_ACCOUNT_MUTATION_ERROR`).
- Body (Zod `AssignmentInputSchema`): `{ title, description?, due_date?, teacher_id, student_id, lesson_id?, song_id?, status? }`.
- Server checks (handler): teacher/admin only; non-admin `teacher_id` must equal caller; `student_id` must be a real `is_student` Profile; if `lesson_id` set, lesson must match `(teacher_id, student_id)`.
- Side effect: `queueNotification({ type:'assignment_created', recipientUserId: student_id, entityType:'assignment', entityId: id, priority:6 })`.
- Returns `201` + assignment with joined profiles/lesson/song. RLS INSERT WITH CHECK gates teacher/admin.

### Status action — `updateAssignmentStatus(assignmentId, newStatus)`

- Student-only server action; `getUserWithRolesSSR` → `!isStudent` rejects; test-account guard.
- Ownership: `assignment.student_id === user.id`.
- `validateStatusTransition(current, next)` against `VALID_STATUS_TRANSITIONS`.
- Writes **only** `status`; cookie-bound client → **must pass RLS** (the new student-status UPDATE policy).
- `revalidatePath('/dashboard/assignments')` + the detail path.

### State machine

| From          | Allowed →                               |
| ------------- | --------------------------------------- |
| `not_started` | `in_progress`, `cancelled`              |
| `in_progress` | `completed`, `cancelled`                |
| `overdue`     | `in_progress`, `completed`, `cancelled` |
| `completed`   | _terminal_                              |
| `cancelled`   | _terminal_                              |

Same-status is a no-op (allowed). `overdue` is derived at read time (`calculateAssignmentStatus`), not written by the student path.

### Detail read — `GET /api/assignments/[id]`

- Returns assignment + `teacher_profile`, `student_profile`, `lesson(...status)`, `song`; excludes `deleted_at`.
- Access (RLS SELECT + handler `checkViewAccess`): admin, owning teacher, or owning student. The detail page renders the status timeline (status + `updated_at`; no dedicated `assignment_history` table — render current status, not a transition log, in v1).

## Behavior & edge cases / failure modes

- **Student edits a non-status field** → app layer (`validateStudentUpdate`/`updateAssignmentStatus`) returns 403/`error`; RLS also blocks (no student general-UPDATE). Both layers must reject; test asserts the 403.
- **Student status RLS gap** → add an UPDATE policy: `USING (student_id = auth.uid())` restricted so only `status` may change (column-scoped policy or a `SECURITY DEFINER` RPC the action calls). Without it the green-path "complete" silently 403s. Mirror the rule, do not re-`WHERE` in app code (ADR-0001).
- **Assignment with no lesson and no song** → both nullable; create succeeds; detail/edit render "—" for missing link. No validation requires either.
- **Lesson mismatch** → `verifyLesson` 400 if `lesson_id` does not belong to `(teacher_id, student_id)`.
- **Notification when student is a shadow with no email** → in-app notification still queues (in-app delivery needs no email). Email channel must route through the [deliverable-email chokepoint](./06-auth-shadow.md#262); a shadow with no `invite_email` is skipped (`skipped_shadow` in `notification_log`) — never addressed to `shadow_*@placeholder.com`. The create must not silently fail (Phase 0 bucket A guarantees `notification_queue`/`notification_log` exist); `queueNotification` failure is logged, not swallowed into a void.
- **Terminal status** → `AssignmentStatusActions` renders no buttons when `VALID_STATUS_TRANSITIONS[current]` is empty.
- **Soft-deleted assignment** → all reads `.is('deleted_at', null)`; deleted rows 404.

## Files to touch

| File                                             | Change                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/dashboard/assignments/new/page.tsx`         | Replace stub → mount editorial create form (`components/assignments/editorial/AssignmentFormEditorial.tsx`, **net-new**); student/lesson/song pickers; POST `/api/assignments`. |
| `app/dashboard/assignments/[id]/page.tsx`        | Replace stub → editorial detail (`AssignmentDetailEditorial.tsx`, **net-new**); status timeline + `AssignmentStatusActions` for students.                                       |
| `app/dashboard/assignments/[id]/edit/page.tsx`   | Replace stub → reuse editorial form in edit mode (teacher/admin only).                                                                                                          |
| `components/assignments/editorial/*`             | Add `AssignmentFormEditorial.tsx`, `AssignmentDetailEditorial.tsx` (list exists).                                                                                               |
| `supabase/migrations/<new>.sql`                  | Add student-status UPDATE RLS policy (status-only) on `assignments`.                                                                                                            |
| `lib/services/assignments-queries.ts`            | Add `getAssignment(id)` read for the detail/edit SSR pages if not reusing the API.                                                                                              |
| Deletions (gate 5, staged after editorial soaks) | `components/assignments/*` v1 trees + `components/v2/assignments/*`.                                                                                                            |

## Acceptance criteria (as test names)

- `assignment.roundtrip.test` — teacher creates → student sees + in-app notification queued → student completes → teacher sees status.
- `assignments.rls.test` — teacher isolation; student own-only SELECT; **student status-only UPDATE succeeds via RLS**; student non-status UPDATE rejected.
- `assignment-create.notify.test` — create queues `assignment_created` for `student_id`; create still succeeds when `queueNotification` throws.
- `assignment-status.transition.test` — illegal transition (e.g. `not_started → completed`) rejected; legal transition persists.
- `assignment-shadow-notify.test` — shadow student with no `invite_email` gets in-app notification; email path skipped + `skipped_shadow` logged.

## Definition of Done (5-point)

1. **Behavior complete** — new/detail/edit pages render real editorial UI; create → notify → status round-trip works for every role.
2. **No silent failure** — every `.from()` surfaces errors; `queueNotification` failure logged not swallowed; notification tables live (Phase 0).
3. **RLS-tested** — `assignments.rls.test` covers teacher isolation, student own-only, and the new student status-only UPDATE policy against real Supabase.
4. **Renders via editorial** — routes mount `components/assignments/editorial/*`; no `ui-version` cookie branch.
5. **v1/v2 deleted** — `components/assignments/*` (v1) and `components/v2/assignments/*` removed; `tsc --noEmit` clean.

## Dependencies & out of scope

- **Depends on:** Phase 0 (notification tables + RLS truth), [08-notifications](./08-notifications.md) (queue processor + in-app delivery), [06-auth-shadow](./06-auth-shadow.md) (deliverable-email chokepoint for the email channel).
- **Out of scope:** assignment **templates** (`app/dashboard/assignments/templates/*`) — tracked separately; AI assignment drafting (`AssignmentAI.tsx`); a dedicated `assignment_history` transition-log table (v1 renders current status only).

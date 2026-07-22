---
created: 2026-07-18
updated: 2026-07-22
domain: Assignments
tables: [assignments, assignment_templates, assignment_history]
maturity: built
---

# Assignments

## Purpose

Homework: a teacher assigns work to a student (optionally linked to a lesson and/or a song,
optionally due-dated); the student gets an in-app notification, sees it in their list, and
advances its status through a server-enforced state machine (`not_started → in_progress →
completed`, with `cancelled` and read-time `overdue`). The teacher watches the status come
back. This closes the "assigns homework → student practices" leg of the core loop.

Supersedes the former spec 03-assignments (deleted 2026-07-18; git history). That spec's headline gaps — no editorial
create/detail/edit surfaces, no student status control in editorial, missing student RLS
UPDATE policy — have all shipped (deferred in the PR #441 era, built since; verified against
code 2026-07-18). What remains open is templates, the unused history table, and DB-level
column scoping of the student write.

## Data model

| Table                  | Role                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assignments`          | `title`, `description`, `status` (enum, default `not_started`), `due_date`, `teacher_id`, `student_id`, optional `lesson_id` + `song_id`, soft `deleted_at`. CHECK `teacher_id <> student_id`. |
| `assignment_templates` | Reusable `title` + `description` per teacher — schema only; nothing reads or writes it in a mounted flow.                                                                                      |
| `assignment_history`   | Trigger-written audit: `change_type` (`created/status_changed/updated/deleted`), jsonb before/after, `changed_by`.                                                                             |

Enum `assignment_status`: `not_started | pending | in_progress | completed | overdue |
cancelled` — `pending` is legacy (the app's state machine never produces it); `overdue` is
derived at read time (`calculateAssignmentStatus`), not written by the student path.

### Triggers, functions, RLS (behavioral one-liners)

- `track_assignment_changes` → `assignment_history` on every insert/update/delete; `tr_audit_assignments` → legacy `audit_log`.
- `update_updated_at_column` on `assignments` + `assignment_templates`.
- RLS: SELECT admin / owning teacher / owning student (+ `assignments_select_parent` via `is_child_of_parent` — parent UX unbuilt, see 01); INSERT/UPDATE/DELETE admin-or-teacher; **`assignments_student_status_update`** lets a student UPDATE their own row — the policy is row-scoped only, with column scope (status-only) enforced in the app layer (its own comment says so). See ASG-3.
- Templates RLS: teacher-own + admin policies exist and are ready for a UI that never came.

## Behavior & rules

- **Create** (teacher/admin): editorial form → `app/actions/assignment-edit.ts`; validates
  teacher/student pairing, optional `lesson_id` must belong to the same pair; queues an
  `assignment_created` in-app notification **best-effort** — a notification failure logs and
  never blocks the create (delivery is 07's job). API twin: `POST /api/assignments`.
- **Edit / soft-delete** (teacher/admin): full-field edit through the same form in edit
  mode; delete sets `deleted_at`; all reads filter it.
- **Student writes are status-only**: `updateAssignmentStatus` (server action consumed by
  `AssignmentStatusActions`) checks ownership, validates the transition against
  `VALID_STATUS_TRANSITIONS` (`schemas/AssignmentSchema.ts`), writes only `status` through
  the cookie-bound client so RLS is exercised. Non-status fields from a student 403 at the
  app layer (`validateStudentUpdate` on the PATCH route).
- **State machine**: `not_started → in_progress | cancelled`; `in_progress → completed |
cancelled`; `overdue → in_progress | completed | cancelled`; `completed`/`cancelled`
  terminal; same-status no-op allowed. Terminal states render no buttons.
- **Roles in the list**: teachers/admins see student column + counts; a pure student
  (`isStudent && !isTeacher && !isAdmin`) gets the condensed "From your teacher" layout.
- **AI assist**: the create form can draft the description via the AI action layer (08 owns
  providers/limits).

## UI surfaces

| Surface                                                           | Route / component                                                                       | Maturity                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| List (role-aware, counts, status pills)                           | `/dashboard/assignments` → `AssignmentsListEditorial`                                   | mounted (nav "Assignments" / "My Assignments")                |
| Create (student/song pickers, due date, AI description)           | `/dashboard/assignments/new` → `AssignmentCreateEditorial`                              | mounted                                                       |
| Detail (links to lesson/song, student status controls, edit link) | `/dashboard/assignments/[id]` → `AssignmentDetailEditorial` + `AssignmentStatusActions` | mounted                                                       |
| Edit (teacher/admin)                                              | `/dashboard/assignments/[id]/edit` → `AssignmentCreateEditorial` (edit mode)            | mounted                                                       |
| Templates list / new / detail                                     | `/dashboard/assignments/templates{,/new,/[id]}`                                         | dormant stubs ("Coming soon") — CRUD actions exist unconsumed |
| Assignment history timeline                                       | — (table written by trigger, read nowhere)                                              | unbuilt                                                       |

## Gaps & planned work

### ASG-1 — Delete the template stub routes · **decided 2026-07-18: cut stubs, keep schema**

**Decided in grill**: no usage evidence justifies templates for a solo teacher. Delete the
three "Coming soon" stub routes (`/dashboard/assignments/templates`, `/templates/new`,
`/templates/[id]`) — joins the T2 honesty-hygiene batch with LES-1/LES-2/IDA-5. The table,
RLS, and tested actions (`app/actions/assignment-templates.ts`) stay **dormant** — if real
usage shows repeated assignment text, resurrect cheaply in v1.1 (one editorial list page +
a "start from template" select on `AssignmentCreateEditorial`). **Files**:
`app/dashboard/assignments/templates/*` (delete). **Accept**: routes 404; nav has no
dangling links; actions and table untouched; build + lint green.

### ASG-2 — Surface `assignment_history` as a detail timeline

**Missing**: every change is audited into `assignment_history`, but no read path exists —
the detail page shows only current status, so "when did Emma start this?" is unanswerable in
the UI. **Approach**: extend `lib/services/assignment-detail-queries.ts` with a
`getAssignmentHistory(id)` (last ~10 rows, newest first, map `change_type` + status diff to
a label); render a compact timeline card in `AssignmentDetailEditorial` (teacher view at
minimum; student view optional). Requires an RLS SELECT policy on `assignment_history`
mirroring the parent assignment's visibility — verify; the baseline has policies for the
table but confirm student scope before rendering to students. **Files**:
`lib/services/assignment-detail-queries.ts`,
`components/assignments/editorial/detail/AssignmentDetailEditorial.tsx`, possibly a policy
migration. **Accept**: create → start → complete produces a 3-entry timeline on detail;
student sees their own timeline only (RLS test); no N+1 (single query).

### ASG-3 — Column-scope the student status write in the DB

**Missing**: `assignments_student_status_update` admits any UPDATE on the student's own row;
only app code stops a student from rewriting `title`/`due_date`. A student with a session
token and curl can edit non-status columns — RLS is supposed to be the boundary (ADR-0001).
**Approach**: replace the broad policy with column enforcement — cleanest is a
`SECURITY DEFINER` RPC `student_update_assignment_status(assignment_id, new_status)` that
validates ownership + transition in SQL and is the **only** student write path (revoke the
UPDATE policy), with `updateAssignmentStatus` switched to `.rpc()`. Alternative: keep the
policy but add a `WITH CHECK` comparing all non-status columns to their old values via a
trigger guard. Prefer the RPC — it also moves transition validation server-side.
**Files**: new migration under `supabase/migrations/`, `app/actions/assignments.ts` (or the
current status-action module), RLS test suite. **Accept**: RLS test — student status-only
update succeeds; student UPDATE of `title` via PostgREST is rejected **by the database**;
illegal transition (`not_started → completed`) rejected; teacher/admin paths unaffected;
`tests/e2e/student/assignments-interact.spec.ts` still green.

### ASG-4 — Assignable chord drills (v1.1 · first surfaced slice)

**Concept**: the sanctioned path for surfacing the chord quiz (CHT-1 / CHT-2, doc 05) out of
`nav-hidden` — make a chord drill something a **teacher assigns** and whose **score flows back**,
rather than free self-study. Chosen (grill 2026-07-22) as the **pre-designated first v1.1 slice**:
the chord quiz is the only nav-hidden learning tool both ship-ready and result-producing (real
SM-2, works cold), so it is the tracer bullet for the whole "surface what's hidden" effort.
**Approach**: reuse the existing optional-link pattern (assignments already carry optional
`lesson_id` / `song_id`) rather than a typed-assignment overhaul — add a nullable `chord_drill`
config (target chord IDs / due-set + target count) and a nullable `chord_drill_result` (score,
attempted, `completed_at`) on `assignments`. The student result-write goes through the **same
`SECURITY DEFINER` RPC discipline ASG-3 prescribes** (not a broad UPDATE policy): the student
detail deep-links into the chord quiz seeded with the drill; on completion the quiz path
(`app/actions/chord-quiz.ts`, already writing `chord_quiz_attempts` / `chord_srs`) stamps the
result and marks the assignment complete; the teacher sees the score on detail. Theory and
fretboard do **not** ride this path (theory has its own `theoretical_course_access` grant model;
fretboard is stateless — see doc 05). **Files** (pointers — not to be built before launch):
migration under `supabase/migrations/`, `schemas/AssignmentSchema.ts`,
`app/actions/assignment-edit.ts`, `components/assignments/editorial/*`, `app/actions/chord-quiz.ts`.
**Accept**: teacher assigns a chord drill → student completes the seeded quiz → `chord_drill_result`
is stamped via the RPC (RLS: a student cannot stamp another student's assignment) → teacher sees the
score on detail; the `menuConfig` reveal of `skills` is the **last** step (CHT-2), gated on the
end-to-end path working.

## Test plan

- **E2E (existing)**: `tests/e2e/teacher/assignments-crud.spec.ts` (A5.1 lifecycle),
  `tests/e2e/student/assignments-interact.spec.ts` (B5.1–B5.4: no create button, status
  advance, content read-only, filter), cross-role isolation in
  `tests/e2e/cross-role/rls-data-isolation.spec.ts`. Catalog: `reference/E2E_JOURNEYS.md` §A5,
  §B5.
- **E2E (missing per journeys)**: A5.2 full link round-trip (integration-covered), A5.3
  templates (blocked on ASG-1).
- **Unit/integration**: `AssignmentCreateEditorial.test.tsx`,
  `app/actions/__tests__/assignment-templates.test.ts`, state-machine tests around
  `validateStatusTransition`, notify-on-create tests (create succeeds when
  `queueNotification` throws), assignments RLS assertions in the `jest.config.rls.ts`
  suite — extend with the ASG-3 database-level rejections.
- **Notification leg**: assignment-created delivery is asserted in 07's queue-processor
  tests; here we only assert the queue write.

## Open questions

1. ~~Templates: worth existing?~~ — **resolved 2026-07-18: cut stubs, keep schema dormant**
   (see ASG-1).
2. **`overdue` as data vs derivation**: today `overdue` is computed at read time and also a
   writable enum value; no cron writes it. Standardize on derivation-only (and stop
   exposing it as a transition source in `VALID_STATUS_TRANSITIONS`?) or add a nightly
   marker so filters/counts and notifications (07's reminder engine) share one truth?
3. **Retire the `pending` enum value?** Unreachable from the app's state machine; dropping
   an enum value is a migration hassle — worth it on the next schema-consolidation pass, or
   document-and-ignore?
4. **Should students see who/when in history** (shapes ASG-2's student rendering):
   exposing `changed_by` to students leaks nothing (it's their teacher), but is the
   timeline useful to them or teacher-only noise?

## References

- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (§assignments,
  §assignment_templates, §assignment_history, enum `assignment_status`, policy
  `assignments_student_status_update`, trigger `track_assignment_changes`)
- Superseded spec: `docs/specs/03-assignments.md` (deleted 2026-07-18; git history)
- State machine: `schemas/AssignmentSchema.ts` (`VALID_STATUS_TRANSITIONS`,
  `validateStatusTransition`)
- RLS doctrine: `docs/app-blueprint/reference/ARCHITECTURE.md` + ADR-0001; notification delivery: 07; AI
  description drafting: 08; lesson/song linking: 02 / 03

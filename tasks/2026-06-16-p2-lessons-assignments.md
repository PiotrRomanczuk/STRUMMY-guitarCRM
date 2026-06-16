# STRUM-p2 — Lessons (spec 02) + Assignments (spec 03)

**Date**: 2026-06-16
**Branch**: feature/STRUM-p2-lessons-assignments
**Worktree**: .claude/worktrees/lessons-assignments

## Plan

### Assignments RLS

- [x] Migration `20260616120000_assignments_student_status_policy.sql` — student status-only UPDATE policy

### Lessons (spec 02)

- [ ] `lib/services/lesson-form-data.ts` — student + song options, lesson-for-edit read
- [ ] `app/actions/lesson-edit.ts` — createLessonAction / updateLessonAction (RLS client; admin client for shadow)
- [ ] `components/lessons/editorial/form/LessonFormEditorial.tsx` + sub-parts + barrel
- [ ] `app/dashboard/lessons/new/page.tsx` — mount form (create)
- [ ] `app/dashboard/lessons/[id]/edit/page.tsx` — mount form (edit)
- [ ] `lib/testing/rls/__tests__/lessons.rls.test.ts`
- [ ] Delete v1 (`components/lessons/*` non-editorial) + v2 (`components/v2/lessons/*`) — verify tsc

### Assignments (spec 03)

- [ ] `lib/services/assignments-queries.ts` — add `getAssignment(id)` + form data
- [ ] `app/actions/assignment-edit.ts` — createAssignmentAction / updateAssignmentAction (notify try/catch)
- [ ] `components/assignments/editorial/detail/AssignmentDetailEditorial.tsx`
- [ ] `components/assignments/editorial/create/AssignmentCreateEditorial.tsx` (create+edit form)
- [ ] `components/assignments/editorial/status/AssignmentStatusActions.tsx`
- [ ] `app/dashboard/assignments/new|[id]|[id]/edit/page.tsx`
- [ ] `lib/testing/rls/__tests__/assignments.rls.test.ts`

### Gates

- [x] `npm run lint` — 0 errors (599 pre-existing warnings, none in new files)
- [x] `npx tsc --noEmit` — exit 0
- [x] `npm test` — 183 suites, 2639 passed, 0 failures (RLS tests skip w/o live DB)

## Review

- Lessons + Assignments editorial create/edit/detail + student status transitions implemented
  via server actions (RLS-scoped) + editorial components. Routes mount editorial only.
- **Deferred (flagged to team-lead):** v1/v2 lesson tree deletion (gate 5). The trees are still
  reachable — `app/api/lessons/__tests__/route.integration.test.ts` imports
  `components/lessons/form/LessonForm.Actions`; `components/v2/stitch/lessons/*` and
  `components/v2/lessons/*` import `components/lessons/hooks/useLessonForm`; v2 stats/dashboard
  import the trees. Spec 02 "Files to touch → Delete on done" explicitly stages the deletion in a
  SEPARATE PR after preview soak (MASTER_SPEC §6 risk 1). Bulk-deleting now breaks the build +
  integration test. Recommend a dedicated cleanup PR once editorial soaks.

## Decisions

- Mutations via **server actions** (per team-lead) using `createClient()` (RLS). Shadow profile
  creation uses `createAdminClient()` because `insert_profile_admin_only` blocks teacher inserts.
- Student status UPDATE: RLS policy is row-scoped (`student_id = auth.uid()`); column (status-only)
  constrained in app layer per ADR-0001.
- Reuse existing `updateAssignmentStatus` server action for student status transitions.

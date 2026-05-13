# Critical-Path Integration Tests — Phase 1.5

> Tracking the ~20 highest-risk endpoints that must have Jest integration tests before Phase 2 closes.
> Pattern reference: `__tests__/api/song/handlers.integration.test.ts` + `__tests__/api/lessons/handlers.integration.test.ts` (this PR).
> Test infra: `lib/testing/integration-helpers.ts` (`createMockQueryBuilder`, `createMockAuthContext`).

## Status legend

- ✅ Done in this PR
- 🟡 Handler exists, test pending
- 🔴 No handler module — logic embedded in `route.ts`; needs refactor before testable in isolation

## Test inventory

| #   | Endpoint                                   | Test file                                                           | Status | Notes                                                          |
| --- | ------------------------------------------ | ------------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| 1   | `GET /api/lessons`                         | `__tests__/api/lessons/handlers.integration.test.ts`                | ✅     | 12 cases, covers all 4 lesson handlers                         |
| 2   | `POST /api/lessons`                        | (same file)                                                         | ✅     | createLessonHandler                                            |
| 3   | `PATCH /api/lessons/[id]`                  | (same file)                                                         | ✅     | updateLessonHandler                                            |
| 4   | `DELETE /api/lessons/[id]`                 | (same file)                                                         | ✅     | deleteLessonHandler                                            |
| 5   | `POST /api/song`                           | `__tests__/api/song/handlers.integration.test.ts`                   | ✅     | Pre-existing                                                   |
| 6   | `PATCH /api/song/[id]`                     | (same file)                                                         | ✅     | Pre-existing                                                   |
| 7   | `GET /api/assignments` + `POST`            | `__tests__/api/assignments/handlers.integration.test.ts`            | 🟡     | `app/api/assignments/handlers.ts` exists                       |
| 8   | `PATCH /api/assignments/[id]/complete`     | `__tests__/api/assignments/[id]/handlers.integration.test.ts`       | 🟡     | Per-id handler split required                                  |
| 9   | `POST /api/auth/sign-in`                   | `__tests__/api/auth/sign-in.integration.test.ts`                    | 🔴     | Logic in route.ts; consider Supabase client mock               |
| 10  | `POST /api/auth/sign-up`                   | `__tests__/api/auth/sign-up.integration.test.ts`                    | 🔴     | Same — extract handler first                                   |
| 11  | `POST /api/auth/reset-password`            | `__tests__/api/auth/reset-password.integration.test.ts`             | 🔴     | Same                                                           |
| 12  | `POST /api/students` (invite flow)         | `__tests__/api/students/invite.integration.test.ts`                 | 🟡     | Check `app/api/students/*/handlers.ts`                         |
| 13  | `PATCH /api/students/[id]`                 | `__tests__/api/students/handlers.integration.test.ts`               | 🟡     |                                                                |
| 14  | `PATCH /api/admin/users/[id]/role`         | `__tests__/api/admin/users-role.integration.test.ts`                | 🟡     | Highest-privilege mutation; must verify role-check             |
| 15  | `DELETE /api/admin/users/[id]`             | (same file)                                                         | 🟡     | Soft-delete or hard-delete? Confirm in test                    |
| 16  | `GET /api/cron/lesson-reminders`           | `__tests__/api/cron/lesson-reminders.integration.test.ts`           | 🔴     | Extract notification-queue logic to testable function          |
| 17  | `GET /api/cron/assignment-due-reminders`   | `__tests__/api/cron/assignment-due-reminders.integration.test.ts`   | 🔴     | Same                                                           |
| 18  | `GET /api/cron/assignment-overdue-check`   | `__tests__/api/cron/assignment-overdue-check.integration.test.ts`   | 🔴     | Same                                                           |
| 19  | `GET /api/cron/process-notification-queue` | `__tests__/api/cron/process-notification-queue.integration.test.ts` | 🔴     | Mock email/push sinks via existing `notification-service` mock |
| 20  | `GET /api/cron/dispatcher`                 | `__tests__/api/cron/dispatcher.integration.test.ts`                 | 🔴     | Lightweight: assert it dispatches to expected sub-jobs         |

## Refactor requirements (🔴 items)

Cron routes and auth routes embed logic directly in `route.ts`. Before they can be unit-tested cleanly:

1. Extract pure business logic into `<route-dir>/handlers.ts` (mirror the lessons/songs pattern).
2. Keep `route.ts` as a thin shell that parses request, calls handler, returns NextResponse.
3. Handler signature: `(supabase, user, profile, params/body) => { status, ...payload | error }`.

This refactor work is in-scope for Phase 2 (cleanup as audits surface issues) — the Bruno collection (Phase 1.4) will cover these endpoints in the meantime via end-to-end HTTP requests.

## How to run

```bash
npm run test:integration -- __tests__/api/lessons/handlers.integration.test.ts
npm run test:integration    # all *.integration.test.ts files
```

## Acceptance for Phase 2 gate

- All 🟡 items → ✅ (16 tests).
- All 🔴 items either ✅ or have a Bruno smoke test pinned in `bruno/strummy/<domain>/` plus an open issue tracking the route.ts → handlers.ts refactor.
- `npm run test:integration` exits 0.
- ≥80% line coverage on the 20 endpoint handler files (measure via `npm run test:coverage -- --testPathPattern integration`).

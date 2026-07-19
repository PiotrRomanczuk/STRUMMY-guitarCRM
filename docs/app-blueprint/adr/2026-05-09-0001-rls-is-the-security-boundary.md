---
status: accepted
---

# RLS is the security boundary

Row-level security on Supabase is the **single** authorization boundary for who can read or write what. Application code (API routes, Server Actions, Server Components) does **not** duplicate RLS predicates as defense-in-depth. We rely on RLS being correct and tested, and we delete redundant app-side `student_id IN (...)` filters wherever they exist.

## Considered Options

- **Defense in depth** — both RLS and app filters enforce visibility. Rejected: the two definitions drift (proved out: `getTeacherStudentIds` exists in two places with different `deleted_at` handling), and the duplication adds no real safety because every consumer would have to remember to apply the filter — RLS catches anyone who forgets.
- **App filter only, RLS permissive** — rejected: scope of "every consumer must remember" is too large; RLS gives us a fail-closed default for free.

## Consequences

- The existence of two-teacher RLS-real test harnesses (`STRUM-289`) is not optional — RLS is load-bearing and must be tested with multi-tenant fixtures.
- Pre-write 403s are still done in app code (e.g. `StudentAccess.canView`) for UX, not for security. Their absence would not be a security bug; it would be a worse error message.
- New tables ship with RLS on from the first migration. There is no period where "we'll add RLS later."
- Reviewers should not "fix" the absence of app-side filtering by adding it back.

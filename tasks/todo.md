# STRUM-p2 — Users (04) & Profile/Multi-role (10)

**Date**: 2026-06-16
**Branch**: feature/STRUM-p2-users-profile

## Spec 04 — Users

- [ ] Migration: add `deleted_at` + `is_active` RLS predicate (hide inactive from teachers, admin bypass)
- [ ] `deleteUser` action → soft-delete (is_active=false, deleted_at=now()) + auth ban
- [ ] `DELETE /api/users/[id]` → soft-delete + self-deactivation guard
- [ ] Remove shadow guard in `sendUserInvite`
- [ ] `UsersListEditorial.tsx` (net-new) + users-list query service
- [ ] `UserEditFormEditorial.tsx` (net-new) wired to PUT /api/users/[id]
- [ ] Wire users list + edit pages
- [ ] Invite dialog + Shadow badge on StudentDetailEditorial
- [ ] `profiles.rls.test.ts`
- [ ] Delete v1 `components/users/*` + v2 `components/v2/users/*`

## Spec 10 — Profile & Multi-role

- [ ] Expand self-edit form (full_name, first_name, last_name, phone, avatar_url) → PUT /api/users/profile
- [ ] Multi-role sweep: nav chips + group labels + stats grid (sites #3,4,5,6,7,9)
- [ ] `/dashboard/profile` → redirect to /dashboard/settings
- [ ] Delete v1 `components/profile/*` + profile.client.tsx

## Quality gates

- [ ] npm run lint
- [ ] npx tsc --noEmit
- [ ] npm test

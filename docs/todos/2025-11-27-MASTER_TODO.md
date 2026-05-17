# Guitar CRM – Consolidated TODOs (Implemented vs Pending)

Date: 2025-11-27
Branch: `feature/google-api-integration`

This document consolidates the current implementation status across major feature areas and lists next actionable TODOs. It is derived from the repository structure and inline TODOs. Keep this file updated as features evolve.

## Auth & Foundation (01)
- Implemented: SSR role-aware dashboard via `getUserWithRolesSSR`, Supabase client setup (`lib/supabase.ts`, `lib/supabase-browser.ts`), basic login flows under `app/auth`.
- Pending:
  - Server-side auth middleware and role checks per `error-handling-logging.instructions.md` and `naming-conventions.instructions.md`.
  - Replace deprecated debug page `app/(debug)/debug-auth/page.tsx` with SSR debug using `getUserWithRolesSSR`.
  - Settings hydration from DB: `app/dashboard/settings/page.tsx` – add `settings` table, zod schema, and persist/hydrate.
  - Add centralized logging via `lib/logging.ts` for auth failures.

## User Management (02)
- Implemented: Admin user pages (`app/dashboard/users/*`), recent users in dashboard (`app/dashboard/page.tsx`).
- Pending:
  - CRUD validations per `schemas/ProfileSchema.ts` and form validation instructions.
  - Role assignment UX and RLS verification.

## Song Management (03)
- Implemented: Pages for list/new/edit (`app/dashboard/songs/*`), API route at `app/api/song/route.ts`.
- Pending:
  - Refactor `app/api/song/route.ts` (>300 lines) into service modules (`lib/services/songs.ts`) and route handlers.
  - Add zod validation with `schemas/SongSchema.ts` and structured error logging.

## Lesson Management (04)
- Implemented: Pages for list/new/edit/details (`app/dashboard/lessons/*`).
- Pending:
  - Restore/modernize API routes (use `proxy.ts` session-sync) with cookie-based auth and role checks.
  - Set `creator_user_id` from SSR user via `getUserWithRolesSSR`.

## Progress Analytics (05)
- Implemented: Admin dashboard aggregates (counts) and recent users.
- Pending:
  - Implement progress metrics in `app/api/dashboard/stats/route.ts` (define formula, queries, tests).
  - Add charts in `components/dashboard/` using a small chart lib; ensure accessibility.

## Task/Assignments (06)
- Implemented: Assignment pages (`app/dashboard/assignments/*`).
- Pending:
  - End-to-end flows (create/assign/track), schemas alignment, and API endpoints.

## Advanced Features (07)
- Implemented: Google integration scaffolding (`lib/google.ts`), debugging pages.
- Pending:
  - Complete Google API integration (OAuth flow, scopes, token storage in Supabase, usage in features).
  - Feature flags and settings persistence for toggling Google features.

## Performance & Security (08)
- Implemented: Basic lint/tsconfig, Supabase client split, potential RLS in DB layer.
- Pending:
  - Resolve inline TODOs; centralize error handling (`lib/logging.ts`) with standardized structure.
  - Performance passes per `.github/instructions/performance-optimization.instructions.md` (memoization, query caching, bundle checks).

## Testing & QA (09)
- Implemented: Jest config (`jest.config.ts`), Cypress setup (`cypress/`), tests folders under `__tests__/`.
- Pending:
  - Increase coverage for API routes and dashboard stats (unit + integration tests).
  - E2E flows for auth, users, songs, lessons, assignments (Cypress specs and fixtures).

## Deployment & DevOps (10)
- Implemented: `vercel.json`, `next.config.ts`, docs in `docs/DEPLOYMENT.md`.
- Pending:
  - CI checks for database changes and coverage thresholds; keep `docs/CI_CD_*` in sync.

---

## Actionable Next Steps
- Auth: Implement server middleware and role checks; replace debug-auth page.
- Settings: Persist and hydrate user settings from DB.
- Songs: Refactor `app/api/song/route.ts` into modular handlers; add validations.
- Lessons: Rebuild API endpoints with cookie auth; set `creator_user_id` from SSR user.
- Analytics: Implement progress calculations in `app/api/dashboard/stats/route.ts`.
- Assignments: Wire backend endpoints and validations for full CRUD.
- Google: Finalize OAuth, token storage, and feature usage on this branch.
- Logging: Enforce centralized error handling and structured logs.
- Tests: Expand unit and E2E coverage for critical flows.
- CI/CD: Ensure pipelines cover DB migrations and testing gates.

## Notes
- Follow `.github/instructions/*` for naming, error handling, performance, and testing standards.
- Use existing `schemas/` for zod validation where applicable.
 - When using `proxy.ts`, ensure cookies sync via `@supabase/ssr` client and `cookies.setAll`.
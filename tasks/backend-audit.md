# Backend Audit Findings

> Tracking findings from the Phase 1 backend audit (`feature/STRUM-backend-audit`).
> See `/Users/piotr/.claude/plans/i-have-that-crazy-humming-volcano.md` for plan.

## Severity legend

- **S1** — 5xx on a production user path or data loss
- **S2** — Auth bypass / RLS hole / privilege escalation
- **S3** — Inconsistent contract (shape, status code, schema drift)
- **S4** — Cosmetic / cleanup / dead code

## Findings

| #   | Route / Area                    | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                           | Fix PR |
| --- | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `supabase/migrations` vs remote | S3       | Local has 143 SQL files; remote `list_migrations` reports 88 versions. Final chord*quiz_attempts timestamp differs (`20260510120000` local vs `20260510122447` remote). Multiple non-versioned helper files in local migrations folder (`fix_track_user_changes.sql`, `VALIDATION*\_.sql`, `ROLLBACK\_\_.sql`). Drift is long-standing; production is the source of truth.                        | _open_ |
| 2   | `POST /api/admin/set-passwords` | ~~S2~~   | ~~Inventory script flagged no auth markers.~~ **Resolved on read**: route checks `Authorization: Bearer <SERVICE_ROLE_KEY>` header (lines 18–26). Inventory script updated to detect `SERVICE_ROLE_KEY` bearer pattern. Not a vulnerability — service-role-only utility endpoint.                                                                                                                 | _n/a_  |
| 3   | Orphan candidates (37 routes)   | S4       | Callgraph found 37 routes with no in-repo callers. Many are legitimate external-facing endpoints: cron dispatcher (Vercel scheduler), `/api/spotify/callback` (OAuth), `/api/widget/*` (external embed), `/api/external/*` (API-key consumers). Per-route triage needed: classify _external (keep), unused (delete after Phase 2)_. List lives in `docs/api-inventory.json` under `orphan: true`. | _open_ |
| 4   | `public.teacher_students` view  | S2       | Supabase security advisor flagged this as `security_definer_view` (the only ERROR-level security lint). SECURITY DEFINER views bypass RLS; queries run with view-creator privileges. Used by `teacher_students_view` migration (`20260224152209`). Decide whether to drop the DEFINER property or convert to SECURITY INVOKER with explicit RLS.                                                  | _open_ |
| 5   | RLS performance (264 WARN)      | S4       | Performance advisor: 152× `multiple_permissive_policies`, 112× `auth_rls_initplan`, 100× `unused_index`. None are user-impacting today (~20–30 DAU) but worth a sweep. Defer until after Phase 1 closes — track here for a single batched migration.                                                                                                                                              | _open_ |

## Conventions

- One row per discrete finding. Link the PR once opened.
- If a finding is rejected (e.g. intentional behaviour), strike through and add a note.
- New findings get severity assigned at discovery time, not adjusted retroactively.

---
created: 2026-06-22
updated: 2026-06-22
---

# Cloud schema baseline (source of truth)

Authoritative snapshot of the **live production schema** on Supabase Cloud
(`zmlluqqqwrfhygvpfqka`, PostgreSQL 17.6), captured 2026-06-22 for the
**Cloud → self-host migration**. Cloud — not the migration chain in
`../migrations/` — is the source of truth: prod had drifted from the repo
(renames, type changes, out-of-band DDL applied via the Supabase MCP).

## Files

| File                              | What                                                                                                | How produced                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `cloud_schema_2026-06-22.sql`     | `public` schema: 62 tables, 50 functions, 20 enum types, 199 RLS policies, 46 triggers, 213 indexes | `pg_dump --schema-only --schema=public --no-owner` (pg17.6) against the Cloud session pooler |
| `cloud_auth_hooks_2026-06-22.sql` | The `auth.users` → `handle_new_user` trigger (cross-schema, not in the public dump)                 | `pg_get_triggerdef` from Cloud                                                               |

## Loading into the new dedicated prod stack (P1)

A fresh Supabase stack already provides the `auth`, `storage`, and `extensions`
schemas. Load order:

1. `psql < cloud_schema_2026-06-22.sql` (public objects, RLS, indexes, triggers)
2. `psql < cloud_auth_hooks_2026-06-22.sql` (the auth.users trigger)
3. Verify parity: `pg_dump --schema-only --schema=public` of the new stack vs
   `cloud_schema_2026-06-22.sql` should diff empty.

## Not included (deliberate)

- **Data** — POC seeds the song library + 5 fresh students only (see vault plan).
- **`auth`/`storage`/`extensions` schema objects** — platform-managed by Supabase.
- **`storage.*` triggers** — standard, recreated by a fresh stack.

## Caveat

This baseline reflects Cloud as of 2026-06-22. If more out-of-band DDL is applied
to Cloud before cutover, re-capture before P1.

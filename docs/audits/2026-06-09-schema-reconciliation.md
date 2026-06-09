# Supabase Schema Reconciliation Report

**Date**: 2026-06-09
**Author**: Claude (with Piotr)
**Scope**: Reconcile `supabase/migrations/`, the MCP-connected project (`zmlluqqqwrfhygvpfqka`), and runtime code references
**Status**: Investigation only — no schema changes proposed yet
**Trigger**: blocked Followup B in [2026-06-09-fallow-audit.md](2026-06-09-fallow-audit.md) — couldn't safely consolidate `database.types*.ts`

---

## TL;DR

The Supabase project the MCP server talks to (`zmlluqqqwrfhygvpfqka.supabase.co`) **is not in sync with either the canonical migration history (`supabase/migrations/`) or the production codebase**. There is drift in both directions:

- **14 tables declared in `supabase/migrations/` are missing from MCP** — but called actively by the codebase (notifications, audit log, sync conflicts, user settings, …)
- **5+ tables exist in MCP without any `CREATE TABLE` in the repo** — yet the repo's later migrations and code rely on them (`*_history` tables, `song_sections`)
- The MCP project's earliest migrations include a `drop_all` on 2026-01-05 followed by a partial rebuild that never re-applied the full canonical sequence

**Consequence**: regenerating `database.types.ts` from this MCP project would silently strip type coverage for ~20 active code paths and add definitions for tables nobody owns the migrations of. That's why Followup B was paused.

**Next action (required before Followup B can resume)**: identify and inspect the _actual production_ Supabase project (not the MCP-connected one). The path forward depends on whether production matches the canonical migrations, the MCP project, or something else.

---

## Environment topology

The Guitar CRM talks to **at least three** Supabase environments. Only #1 and #2 are visible from this Mac:

| #   | Env name                               | URL                                                                              | How code reaches it                                                                                                 | Visible from Mac?                                     |
| --- | -------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | **Local Docker stack**                 | `http://127.0.0.1:54321` (stale) → actually `http://192.168.1.75:54321` on `uwh` | `NEXT_PUBLIC_SUPABASE_LOCAL_URL` in `.env.local` — `lib/supabase/config.ts` prefers this when local+key are present | partially (Tailscale; node fetch blocked, curl works) |
| 2   | **`zmlluqqqwrfhygvpfqka.supabase.co`** | hosted Supabase                                                                  | `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` — fallback "remote"                                                      | yes (MCP connected)                                   |
| 3   | **Production**                         | unknown from `.env.local`                                                        | Vercel-injected env vars on `strummy.app`                                                                           | no                                                    |

`lib/supabase/config.ts:1-37`:

```ts
const localUrl = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL;
const localAnonKey = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY;
const remoteUrl =
  process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

// Prioritize local if both URL and Key are present, unless forced remote
if (!options.forceRemote && localUrl && localAnonKey) {
  return { url: localUrl, isLocal: true };
}
return { url: remoteUrl, isLocal: false };
```

So on dev: code talks to `uwh`'s docker stack (full schema, presumably). On production: code talks to a Vercel-configured Supabase. On the MCP: we're talking to a third instance that's clearly out of date.

---

## Drift summary

### Canonical schema (per `supabase/migrations/`)

47 tables (49 `CREATE TABLE` statements, minus `pending_students` and `user_roles` which have explicit `DROP TABLE` migrations later in the sequence).

### MCP project (`zmlluqqqwrfhygvpfqka`)

37 tables (per `mcp__supabase__list_tables`).

### Diff

#### Tables in canonical migrations but **missing from MCP** (14)

| Table                      | Last migration touching it                                                  | Callers in code (sample)                                                                |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `audit_log`                | `016_table_audit.sql`                                                       | `app/dashboard/actions.ts:357`                                                          |
| `auth_events`              | `20260301000000_create_auth_events.sql`                                     | —                                                                                       |
| `content_post_metrics`     | `20260427120000_content_production.sql`                                     | —                                                                                       |
| `content_posts`            | `20260427120000_content_production.sql`                                     | many `components/songs/production/*`                                                    |
| `hashtag_sets`             | `20260427120000_content_production.sql`                                     | `components/songs/production/hooks/useHashtagSets.ts`                                   |
| `notification_log`         | `032_notification_system.sql`                                               | `lib/email/retry-handler.ts` (5 calls), `app/api/admin/notification-analytics/route.ts` |
| `notification_preferences` | `032_notification_system.sql`                                               | `app/actions/notification-preferences.ts` (3 calls + tests)                             |
| `notification_queue`       | `032_notification_system.sql`                                               | `lib/services/notification-queue-processor.ts`, `notification-monitoring.ts` (5+ calls) |
| `skills`                   | `20251217000000_create_skills_tracking_tables.sql`                          | — (`/dashboard/skills` route exists but no `.from('skills')`)                           |
| `student_skills`           | `20251217000000_create_skills_tracking_tables.sql`                          | `components/users/UserSkills.tsx`                                                       |
| `sync_conflicts`           | `024_table_sync_conflicts.sql`                                              | `lib/services/sync-conflict-resolver.ts` (5+ calls)                                     |
| `task_management`          | `20250101000008_create_task_management_table.sql` (in `migrations_backup/`) | —                                                                                       |
| `user_preferences`         | `20260226300000_create_user_preferences.sql`                                | —                                                                                       |
| `user_settings`            | `20260226400000_create_user_settings.sql`                                   | `app/actions/settings.ts` (3+ calls)                                                    |

#### Tables in MCP but **not created by any migration in the repo** (6)

`assignment_history`, `lesson_history`, `song_sections`, `song_status_history`, `user_history`, `user_roles`.

- `user_roles` was **explicitly dropped** by `20260323120000_drop_unused_user_roles.sql`. MCP never ran this migration.
- The 5 `*_history`/`song_sections` tables are altered/queried by repo migrations (`20260608000002_fix_audit_trigger_delete_fk.sql` ALTERs `lesson_history` and `assignment_history`) and by application code, **but no `CREATE TABLE` for them exists anywhere under `supabase/`**. They live in MCP as orphans.

### MCP migration history shows a hard reset

```text
001  001_extensions.sql           (pre-2026)
002  002_domains.sql
003  003_enums.sql
004  004_functions_base.sql
005  patched_005.sql
20260105100001  drop_all          ← wipes everything
20260105100002  create_enums
20260105100003  create_functions
20260105100004  create_profiles_table
...
20260608115940  unblock_auth_user_delete
```

The `drop_all` step on 2026-01-05 followed by a fresh sequence indicates someone reset this project. The replacement migration set is **a subset** of what's now under `supabase/migrations/`. Specifically the notification system, content production tables, user settings/preferences, sync conflicts, and audit log were never replayed.

---

## Impact on runtime

When code runs against the MCP project, the following calls are guaranteed to fail with `relation "..." does not exist` at the Postgres layer (Supabase typically surfaces this as `PGRST200` / a 4xx response):

```
.from('notification_log')         × 5  files
.from('notification_preferences') × 3+ files
.from('notification_queue')       × 5+ files
.from('audit_log')                × 1  file
.from('student_skills')           × 1  file
.from('sync_conflicts')           × 5+ files
.from('user_settings')            × 3+ files
.from('content_posts')            × many
.from('hashtag_sets')             × 1
```

The fact that the app appears to work in production means production is **not** running against the MCP project — production runs against env #1 or #3 above (which do have these tables). The MCP project is at best a stale staging/sandbox.

---

## Why this blocks Followup B

The audit's Followup B was "regenerate canonical types, point all imports at one path." But:

| Source for type regeneration         | What it would give us                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MCP project (`zmlluqqqwrfhygvpfqka`) | Strips 14 tables the code uses. Adds 5 orphan tables. Breaks TS for ~20 files.                                                                               |
| Local Docker (`uwh`)                 | Probably correct, but `mcp__supabase__generate_typescript_types` cannot point at it; would need `supabase gen types --db-url ...` against the Tailscale URL. |
| Production                           | Visible only via Vercel. Cannot be regenerated without prod credentials.                                                                                     |

So **Followup B can't proceed deterministically until we identify the real source of truth**.

---

## Recommended path forward

### Step 1 — Identify the production Supabase project (15 min)

Open Vercel project settings for `strummy.app` and read:

- `NEXT_PUBLIC_SUPABASE_URL` (or `_REMOTE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Compare the project ref to `zmlluqqqwrfhygvpfqka`. If different, production is a separate hosted Supabase project — call it `<PROD>`.

### Step 2 — Snapshot the production schema (15 min)

Once you have the prod project ref, either:

- **Option A**: re-point the Supabase MCP at `<PROD>` (`claude mcp` reconfigure) and run `list_tables` + `generate_typescript_types`.
- **Option B**: `npx supabase gen types typescript --project-id <PROD>` with a service-role token.

Save the output to `/tmp/prod-schema.json` and `/tmp/prod-database.types.ts`.

### Step 3 — Decide MCP project's fate (5 min)

If MCP's `zmlluqqqwrfhygvpfqka` is:

- **A stale sandbox nobody uses** → fix `.env.local` `NEXT_PUBLIC_SUPABASE_URL` to point at the actual remote, or delete the project.
- **An intentional preview environment** → schedule a `supabase db reset` against it to re-apply the full `supabase/migrations/` set.
- **Production (unlikely but possible)** → the missing tables are _real bugs_; the notification system has been runtime-broken since the 2026-01-05 reset.

### Step 4 — Reconcile orphan `*_history` migrations (30 min)

Whatever the answer in Step 3, the 5 history tables in MCP without any matching `CREATE TABLE` in the repo are a separate issue. Either:

- Find the lost migration in git history (`git log -S 'CREATE TABLE assignment_history' --all`) and restore it under `supabase/migrations/`.
- Or write a new migration that captures the current schema (introspect from `<PROD>` via `pg_dump --schema-only` and check it in).

### Step 5 — Resume Followup B (the original goal)

With `<PROD>`'s schema as the source of truth, generate fresh `types/database.types.ts`, delete the other two copies, migrate the 29 imports. This becomes mechanical once Step 2 produces the right file.

---

## Inventory: where each table is "owned"

For posterity, this is the union map of where each table is declared:

```
canonical_migrations  ∋ {agent_execution_logs, ai_conversations, ai_generations, ai_messages,
                          ai_prompt_templates, ai_usage_stats, api_keys, apple_shortcut_song_import_log,
                          assignment_templates, assignments, audit_log, auth_events, auth_rate_limits,
                          chord_quiz_attempts, content_post_metrics, content_posts, drive_files,
                          hashtag_sets, in_app_notifications, lesson_songs, lessons, notification_log,
                          notification_preferences, notification_queue, practice_sessions, profiles,
                          skills, song_of_the_week, song_requests, song_videos, songs, spotify_matches,
                          student_repertoire, student_skills, student_song_progress, sync_conflicts,
                          system_logs, theoretical_course_access, theoretical_courses,
                          theoretical_lessons, user_integrations, user_preferences, user_settings,
                          webhook_subscriptions}  (43 still alive after drops)

mcp_project           ∋ canonical_minus_14 ∪ {assignment_history, lesson_history, song_sections,
                                                 song_status_history, user_history, user_roles}

dropped_in_repo       ∋ {pending_students, user_roles}   (DROP TABLE migrations exist)

orphans_in_mcp        ∋ {assignment_history, lesson_history, song_sections, song_status_history,
                          user_history}                  (no CREATE TABLE in supabase/migrations/
                                                          or supabase/migrations_backup/, but
                                                          referenced by later migrations and code)
```

---

## Artifacts

- Fresh types pulled via MCP: `/tmp/fresh-database.types.ts` (93,611 chars, 37 tables)
- MCP table list: see `mcp__supabase__list_tables` output earlier in this session
- MCP migration history: see `mcp__supabase__list_migrations` earlier in this session

---

## Open questions (for Piotr)

1. **Where does production talk to?** Vercel env vars are the answer.
2. **Is `zmlluqqqwrfhygvpfqka` a deliberate staging env, an abandoned project, or the actual production project?**
3. **Are the orphan `*_history` table CREATEs really lost?** If yes, they need to be reconstructed before any new contributor can `supabase db reset` a fresh local clone.
4. **Should the local stack on `uwh` be the source of truth for now?** If yes, getting node-fetch to work against `192.168.1.75:54321` is worth a 30-minute fix (currently `EHOSTUNREACH`, only curl/ping work — per CLAUDE.md note 2026-06-08).

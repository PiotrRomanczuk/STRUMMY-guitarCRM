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

## Open questions (answered 2026-06-09)

### Q1. Where does production talk to?

**Answer**: `zmlluqqqwrfhygvpfqka.supabase.co` — same project as the MCP. Confirmed via `vercel env pull --environment=production`:

```text
POSTGRES_URL=postgres://postgres.zmlluqqqwrfhygvpfqka:…@aws-1-us-east-1.pooler.supabase.com:6543/postgres
POSTGRES_URL_NON_POOLING=postgres://postgres.zmlluqqqwrfhygvpfqka:…@aws-1-us-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=""    ← intentionally empty in Vercel; runtime uses POSTGRES_* via the Supabase Vercel integration
```

### Q2. Is `zmlluqqqwrfhygvpfqka` staging, abandoned, or production?

**Answer**: **It is production.** Same Postgres URL as Vercel prod above. The 14 missing tables really are absent from the database that serves `strummy.app`.

Re-querying via MCP (`execute_sql … pg_tables` against the candidate list) confirms the absences are real and not an MCP cache quirk. Only these legacy candidates actually exist in prod: `assignment_history`, `lesson_history`, `song_sections`, `song_status_history`, `user_history`, `user_roles`. The other 14 (notification*\*, audit_log, sync_conflicts, content*\*, hashtag_sets, etc.) are not there.

**Implication**: every `.from('notification_log')`, `.from('notification_queue')`, `.from('audit_log')`, `.from('sync_conflicts')`, `.from('user_settings')`, `.from('content_posts')`, `.from('hashtag_sets')`, `.from('student_skills')` call in the codebase fails at runtime on production with a `relation does not exist` error. This isn't a typing problem — it's a real bug surface.

### Q3. Are the orphan `*_history` table CREATEs really lost?

**Answer**: They exist in git history but were **deleted** by commit `2cde4c2b` (Jan 30, 2026, "refactor: major codebase cleanup and migration reorganization") which deleted 80 migration files including:

```
20260106000001_create_assignment_history_table.sql
20260106000002_create_lesson_history_table.sql
20260106000003_create_history_triggers.sql
20260106000004_create_user_history_table.sql
20260106000005_create_user_history_trigger.sql
20260105100015_create_song_status_history_table.sql
```

The reorganization renamed most files into the new `001_*` … `026_*` numbered scheme, but this handful never made it across. They can be recovered with:

```bash
git show 2cde4c2b^:supabase/migrations/20260106000001_create_assignment_history_table.sql > ...
```

**`song_sections` is different**: it was never in the repo as a CREATE TABLE. Commit `72873262` ("feat(songs): add song_sections table and structured section display") only added the TypeScript types (`types/database.types.ts`) and UI; the table was created directly in the Supabase project (likely via dashboard SQL editor). It needs to be reverse-engineered from the live schema.

### Q4. Should the local stack on `uwh` be the source of truth?

**Answer**: **Yes — uwh is the closest thing to canonical.** It has 55 endpoints (47 tables + 8 views/MVs). It is a strict superset of production:

```text
Tables in uwh LOCAL but missing from PROD (11):
  audit_log, content_post_metrics, content_posts, hashtag_sets,
  notification_log, notification_preferences, notification_queue,
  skills, student_skills, user_preferences, user_settings

Tables in PROD but missing from uwh LOCAL: 0
```

So local is what the migrations declare; production has drifted backwards by 11 tables.

**Three tables exist in `supabase/migrations/` but are absent from both LOCAL and PROD**: `sync_conflicts`, `auth_events`, `task_management`. Their CREATE TABLE migrations exist in the repo but were apparently never applied to either environment — these are migrations that got committed but never run.

**Network reachability** (re-tested 2026-06-09 from Mac on Orange LAN, IP `192.168.1.77`):

- `curl http://192.168.1.75:54321/...` → HTTP 200, ~100ms ✅
- Node.js `fetch('http://192.168.1.75:54321/...')` → `EHOSTUNREACH` (errno -65) ❌

The CLAUDE.md note from 2026-06-08 is still accurate. The Tailscale-on-LAN routing quirk only affects Node's undici/fetch, not curl. Workarounds: use Tailscale URL (`100.86.245.121:54321`) in `.env.local`, OR resolve the routing quirk in `macOS`.

---

## Runtime audit: which `.from('<missing>')` calls are actually live?

Traced every callsite of the 14 missing-from-production tables up to its trigger (page, API route, cron, server action). Four categories:

### A. Live and silently failing on real user flows (urgent)

| Table                                                                  | Trigger                                                                                                                                                                            | Where it fails                                                                                                                                | Failure mode                                                                                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification_log`                                                     | **Every lesson create/update**                                                                                                                                                     | `app/dashboard/lessons/actions.ts:65` → `sendNotification` → `lib/services/notification-service.ts:95` `.from('notification_log').insert`     | Try/catch returns `{ success: false }`; logged to `system_logs`; lesson itself still saves                                                                        |
| `notification_queue`                                                   | **Every assignment create**                                                                                                                                                        | `app/api/assignments/handlers.ts:261` → `queueNotification` → `lib/services/notification-service.ts:344` `.from('notification_queue').insert` | Same — non-throwing; logged; assignment still saves                                                                                                               |
| `notification_log` + `notification_queue` + `notification_preferences` | **4 scheduled Vercel crons**: `lesson-reminders` (10:00 daily), `assignment-due-reminders` (09:00 daily), `assignment-overdue-check` (18:00 daily), `weekly-digest` (Sunday 18:00) | Each calls `queueNotification` or reads `notification_preferences` first                                                                      | Silent in cron logs (returns 200 with error logged to `system_logs`)                                                                                              |
| `notification_preferences`                                             | **Public `GET /api/notifications/unsubscribe?token=…`** (link in every email footer)                                                                                               | `app/api/notifications/unsubscribe/route.ts:83` `.from('notification_preferences').upsert`                                                    | 5xx response to the user clicking the unsubscribe link                                                                                                            |
| `user_preferences`                                                     | **Every new-student onboarding**                                                                                                                                                   | `app/actions/onboarding.ts:66` `.from('user_preferences').upsert`                                                                             | Already wrapped in `// Note: user_preferences table not yet in generated DB types` and `// Non-fatal: profile was updated, preferences failed`. **The dev knew.** |

So every guitar teacher who creates a lesson or assignment in production has had notification emails silently failing since the 2026-01-05 reset. New-student preferences (goals, skill level, learning style) are never persisted. The unsubscribe link returns errors instead of unsubscribing.

### B. Live but limited blast radius (v2 cookie users on song detail)

These only fire when a user has `strummy-ui-version=v2` AND opens a song detail page that renders `ProductionTab`:

| Table                  | Path                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content_posts`        | `components/v2/songs/SongDetail.{Mobile,Desktop}.tsx` → `ProductionTab` → `PostList` → `useContentPosts` → `fetch('/api/content/posts')` → `app/api/content/posts/handlers.ts:40` |
| `hashtag_sets`         | Same chain via `PostFormDialog` → `HashtagSetPicker` → `useHashtagSets` → `fetch('/api/content/hashtag-sets')`                                                                    |
| `content_post_metrics` | Same chain via metrics handler `app/api/content/posts/[id]/metrics/handlers.ts:44`                                                                                                |

The `/dashboard/content/{page,calendar,hashtags}/page.tsx` standalone pages all render **"Coming soon — being rebuilt"** placeholder cards, so the standalone content section is dead.

### C. Dead at the React tree (typed code paths exist but no caller renders them)

For each, the entry component or route is not imported/rendered from any live page:

| Table                                | Dead chain                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_log`                          | `app/dashboard/actions.ts:357 getAuditLogs` ← `AuditLogSection` ← `AdminDashboardClient` ← **nothing renders `AdminDashboardClient`**; current admin dashboard is `AdminDashboardEditorial` which doesn't use it                      |
| `auth_events`                        | `getAuthEvents` ← `AuthEventsClient` ← **no page imports `AuthEventsClient`**                                                                                                                                                         |
| `sync_conflicts`                     | `lib/services/sync-conflict-resolver.ts` ← `app/actions/calendar-conflicts.ts` (3 exports: `fetchPendingConflicts`, `resolveConflict`, `autoResolveOldConflictsAction`) ← **only `__tests__/` references**                            |
| `user_settings`                      | `app/actions/settings.ts` ← `components/settings/useSettings.ts` ← `SettingsPageClient` / `components/v2/settings/Settings.tsx` ← **neither is rendered**; current settings page is `SettingsEditorial` which doesn't import the hook |
| `student_skills`                     | `components/users/UserSkills.tsx` ← **zero importers/renderers**                                                                                                                                                                      |
| `notification_preferences` (UI side) | `app/actions/notification-preferences.ts` ← `useNotificationPreferences` hook ← `NotificationPreferences` component ← **no page imports it**; `/dashboard/settings/notifications/page.tsx` is a "Coming soon" card                    |

### D. Test-only references (not in any prod code path)

| Table             | Where                                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task_management` | Only in `__tests__/auth/credentials.test.ts` and `lib/supabase/credentials.test.ts` — used as a "does the service-role key work?" probe via a known table name. Will fail the test step but not prod. |
| `skills`          | No `.from('skills')` calls. Only menu navigation strings like `path: '/dashboard/skills'`.                                                                                                            |

### Summary count

| Category                                      | Tables                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A. Live runtime failure on real flows**     | `notification_log`, `notification_preferences`, `notification_queue`, `user_preferences` (4) |
| **B. Live but v2-cookie + song-detail gated** | `content_posts`, `hashtag_sets`, `content_post_metrics` (3)                                  |
| **C. Dead in the React tree**                 | `audit_log`, `auth_events`, `sync_conflicts`, `user_settings`, `student_skills` (5)          |
| **D. Test-only / no `.from()` calls**         | `task_management`, `skills` (2)                                                              |

### What this means for prioritization

**The 4 Category-A tables are urgent and the rest is bookkeeping.** Notification flows are silently broken for every teacher who creates lessons or assignments, plus 4 daily/weekly crons, plus the public unsubscribe endpoint, plus onboarding preference saves. That's the bug that's been live since Jan 5.

The 3 Category-B tables only break for v2-cookie users opening song detail and clicking the production tab — not zero, but bounded.

The 5 Category-C tables and 2 Category-D ones are pure schema/code drift — the code is unreachable, so the missing tables don't cause runtime errors. They show up only as compiler/types confusion and `fallow` noise. They can be cleaned up at leisure: either delete the dead components/actions, or restore the missing tables and wire the UI back.

---

## What `system_logs` actually shows (last 22 days in production)

Queried production's `system_logs` table directly (via MCP `execute_sql`) to count failures during the 2026-05-18 → 2026-06-09 window. `system_logs` only goes back that far — the table itself was created by migration `20260518000000_create_system_logs.sql`.

**100 error rows, 0 warn rows from broken-schema paths. Distribution:**

| Bucket                             |   n | Error message                                                                                | Trigger                                                                                            |
| ---------------------------------- | --: | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `notification_log` missing         |  27 | "Could not find the table 'public.notification_log' in the schema cache"                     | `admin-monitoring` cron `checkFailureRate` + `daily-report` cron once                              |
| `notification_queue` missing       |  23 | "Could not find the table 'public.notification_queue' in the schema cache"                   | `admin-monitoring` cron `checkQueueBacklog` (daily)                                                |
| `get_bounce_stats()` RPC missing   |  23 | "Could not find the function public.get_bounce_stats without parameters in the schema cache" | `admin-monitoring` cron `checkBounceRate` (daily) — new finding, a missing **function**, not table |
| Drive video scan cron failed       |  22 | `[object Object]` (opaque; drive_files table exists, likely Google API auth/quota)           | `drive-video-scan` cron (daily 3am)                                                                |
| `notification_preferences` missing |   3 | Same shape                                                                                   | `weekly-digest` cron (Sundays 18:00)                                                               |
| `auth_events` missing              |   2 | Same shape                                                                                   | One-off on 2026-06-08 13:29 — looks like the admin clicked something that hit `getAuthEvents`      |

So **78 out of 100 errors are direct consequences of the schema drift**. All come from scheduled crons. None come from real user flows (`sendNotification` / `queueNotification` paths through lesson/assignment creation) — because:

### Why no user-flow errors appear

In the 22-day window:

| Activity            |      Count |
| ------------------- | ---------: |
| Lessons created     |          0 |
| Assignments created |          0 |
| Profiles created    |          0 |
| Users signed in     | 2 distinct |

The last lesson was created on **2026-05-15** (3 days before `system_logs` started capturing). For context: the project has 1,770 lessons all-time and 104 created in the last 90 days, almost all of them before 2026-05-15.

So the user-flow notification code paths I called out as urgent in Bucket A **haven't fired in production during the observable window**. The "every teacher's lesson creation silently fails" framing is correct _if_ the app sees user traffic — but it currently doesn't see much.

### What this means

- **The cron-side impact is real and ongoing**: 4 distinct missing-schema errors per day (`notification_log` × 2, `notification_queue` × 1, `get_bounce_stats()` × 1) plus the Sunday `notification_preferences` × 1. Roughly **3.5 broken-schema errors per day, every day, indefinitely** until either the migrations are applied or the crons are unscheduled.
- **The user-flow risk is latent**: whenever real teacher traffic returns, `sendNotification` / `queueNotification` failures will start landing in `system_logs`. The error swallowing means users won't see anything, but every lesson/assignment will quietly fail to dispatch its notification.
- **The unsubscribe endpoint is still broken** for anyone who finds an old email link and clicks it — but with 2 active users in the last week, that exposure is also small.
- **A missing RPC function emerged**: `public.get_bounce_stats()` is referenced by `lib/services/notification-monitoring.ts` via `supabase.rpc('get_bounce_stats')`. It needs to be added back alongside the notification tables when those migrations are restored. Add this to the recovery list.

---

## Concrete next actions (recommended order)

Given the answers above, the path through this mess is:

1. **Recover the deleted history migrations** (30 min) — `git show 2cde4c2b^:…` for the 5 files, write back under `supabase/migrations/` with current dates so `supabase db reset` works on fresh clones. _Low risk; the SQL is preserved._
2. **Reverse-engineer `song_sections`** (15 min) — `pg_dump --schema-only --table=song_sections` against uwh, save as a new migration.
3. **Decide on the 3 unapplied tables** (`sync_conflicts`, `auth_events`, `task_management`):
   - Read the code that references each
   - Either apply the migration to both LOCAL and PROD, OR delete the migration and the dead code paths
4. **Reconcile production with the canonical migrations** — this is the big one. Either:
   - Apply the 11 missing migrations against `zmlluqqqwrfhygvpfqka` (and risk schema/data conflicts on a live DB)
   - Or accept the divergence and audit every `.from('<missing>')` call to confirm it's already runtime-disabled (feature flag, dead code path, etc.)
5. **Once schema is reconciled, resume Followup B** — regenerate types from the now-canonical production project, delete the two stale `database.types*.ts` copies, migrate 29 imports to `@/types/database.types`.

The original Followup B (a 1-hour type consolidation) only becomes safe after step 4. Steps 1 and 2 are independent and worth doing immediately so `supabase db reset` stops being broken on fresh clones.

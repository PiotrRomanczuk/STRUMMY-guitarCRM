---
created: 2026-07-18
updated: 2026-07-18
---

# Database Rebuild Playbook

A from-scratch rebuild of the Strummy database, starting minimal (auth + CRUD on
songs / lessons / assignments) and growing **one migration at a time**, folding in
every structural improvement surfaced by the 2026-07 migration + baseline analysis.

This is both the design spec and the working checklist — tick each step as it lands.

## Why we're doing this

`supabase/migrations/` accumulated three mutually-incompatible schema generations
(numbered `001–044`, a 2025 timestamped chain, a 2026 chain). The full chain is
**not runnable on a fresh DB** — duplicate `CREATE TABLE profiles/songs`, and
cross-generation dependencies where later files need columns/tables defined in
another generation. The repo already declared the `supabase/baseline/` Cloud dump
(2026-06-22) the source of truth because prod had drifted via out-of-band DDL.

Rather than migrate the drifted schema, we start clean and **bake the right
foundations in from migration #1** so later subsystems (shadow students,
repertoire, notifications, AI, audit) are designed correctly instead of retrofitted.
The old migrations live in `supabase/migrations_archive/` as historical record.

### Decisions locked

| #   | Decision                                                                           | Rationale                                                                                                                   |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fresh migration chain in **this** repo; keep app code, adapt as schema lands       | Not a new project; the app layer is largely reusable                                                                        |
| 2   | Phased scope: core 3 tables first, everything else backlog                         | Matches incremental testing goal                                                                                            |
| 3   | One migration + one gate test per improvement                                      | Maximally granular, easy to verify each in isolation                                                                        |
| 4   | Identity: **independent `profiles.id` PK + nullable `user_id` FK** (null = shadow) | Avoids the RLS-rewrite churn that forced ~9 `handle_new_user` rewrites when shadow students were bolted onto the old schema |
| 5   | Target the **local** uwh stack only                                                | No Cloud/prod changes until a separate future cutover decision                                                              |

---

## Section 1 — Conventions (the "definition of done" for every migration)

Every migration in this rebuild must satisfy this contract. These are the analysis
findings turned into standing rules.

- **Filenames**: full 14-digit `YYYYMMDDHHMMSS_description.sql`. No numeric prefixes,
  no date-only prefixes — both caused lexicographic ordering hazards before. _(M4, M5)_
- **Idempotency**: `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`,
  `DROP POLICY IF EXISTS` before every `CREATE POLICY`, `DO $$ … WHEN duplicate_object`
  guards around `CREATE TYPE`. _(M2)_
- **Time**: every timestamp is `timestamptz`. _(S16 — baseline already clean; keep it)_
- **UUIDs**: `gen_random_uuid()` only. No `uuid-ossp` / `uuid_generate_v4()`. _(S17)_
- **RLS**: enabled on every table. Policies reference `(select auth.uid())`
  (InitPlan-cached, evaluated once) — **never** bare `auth.uid()`. Role checks go
  through the shared helper functions — **never** an inline
  `EXISTS (SELECT … FROM profiles …)` per row. _(S5)_
- **SECURITY DEFINER**: every such function sets `SET search_path = public`
  (or empty + fully schema-qualified names). _(M6)_
- **One `set_updated_at()`**: a single trigger function, reused everywhere. No
  per-table `updated_at` variants. _(S8)_
- **FKs**: `NOT NULL` unless the relationship is genuinely optional. Back an FK with
  an index only where it is actually queried — no speculative indexing. _(S13)_
- **Enums vs lookup tables**: enums only for closed, stable sets (e.g. `music_key`).
  Growth-prone catalogs (notification types, auth event types) become lookup tables. _(S7)_
- **Explicit grants**: every table migration `GRANT`s privileges to `authenticated`
  (and `all` to `service_role`) — RLS scopes _rows_, grants gate _table access_; both
  are required. Self-contained, not reliant on platform default privileges. The
  validation harness omits default-privileges on purpose, so a missing grant fails the gate.
- **No data in migrations**: zero seed rows, zero hardcoded UUIDs/emails, zero backfill
  DML in a schema migration. Seed lives in `supabase/seed.sql` / the `seed-factory` skill. _(M3)_
- **After each migration**: `supabase db reset` (local uwh stack) → regenerate
  `types/database.types.generated.ts` → run the step's gate test → `npm test`. _(A4)_

---

## Section 2 — Phase 1: minimal core (ordered)

Each step is one migration + its gate test. Tables start **minimal** — only the
columns basic CRUD needs — and grow in later phases. That is the whole point.

### Wave 0 — DB-only foundation (no UI)

- [x] **Step 0 — Foundation** &nbsp; `..._foundation.sql`
  - Closed-set enums only: `difficulty_level`, `lesson_status`,
    `assignment_status` (**5 values** — `pending` dropped, it was unused by the app),
    `lesson_song_status` (**unified, includes `slow_tempo` from day one** so the app
    and DB enums never drift). _(S3 root, S7, A3)_
  - `set_updated_at()` — single, `SET search_path`. _(S8)_
  - Role helpers moved to Step 1: `is_admin() / is_teacher() / is_student() /
is_admin_or_teacher()` read `public.profiles`, and Postgres validates SQL function
    bodies at creation, so the table must exist first. _(S1, S5, M6)_
  - **Gate test**: enums present (incl. `slow_tempo`, excl. `pending`); `set_updated_at`
    exists. ✅ passed via `scripts/db/validate-migrations.sh`.

- [x] **Step 1 — profiles + signup** &nbsp; `..._profiles.sql`
  - `profiles`: `id uuid PK DEFAULT gen_random_uuid()`,
    `user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE` (nullable),
    `email citext UNIQUE`, `full_name / first_name / last_name`, `avatar_url`,
    `notes`, `phone`, flags `is_admin / is_teacher / is_student / is_active
(default true) / is_development`, `created_at / updated_at`.
    **No `user_roles` table. No shadow/parent columns yet.** _(S1, S2, S11, S12)_
  - `handle_new_user()` on `auth.users` → insert profile (`user_id = new.id`, names
    from `raw_user_meta_data`); `SECURITY DEFINER`, `search_path`. This is the cleaned-up
    single version — replaces the ~9 competing rewrites in the old schema.
  - `set_updated_at` trigger; RLS: self read/update (`user_id = (select auth.uid())`),
    admin all.
  - **Gate test**: sign up via local auth → profile auto-created with names populated;
    RLS: a user sees only their own row, service role sees all.

- [ ] **Wave 0 app wiring** (code, no migration)
  - Keep `lib/supabase/{server,client,middleware}.ts` and
    `lib/auth/loadAuthedProfile.ts` (flag-based roles) and `withApiAuth`.
  - Expose `profile.id` from `loadAuthedProfile` so ownership checks can compare
    `profile.id` instead of `auth.uid()` (identity model change). _(A-reconcile)_

### Vertical slices (each: DB → API → UI → tests → **human test gate**)

- [ ] **Step 2 — songs (minimal)** &nbsp; `..._songs.sql`
  - `songs`: `id`, `title NOT NULL`, `author`, `level difficulty_level`,
    `key music_key`, `chords`, `short_title`, `ultimate_guitar_link`, `deleted_at`,
    timestamps. Media / tempo / lyrics / AI columns deferred to a later
    "songs: rich metadata" migration.
  - Soft-delete via `deleted_at` (no cascade function yet — added with repertoire).
  - RLS: authenticated read where `deleted_at IS NULL`; insert/update/delete for
    admin/teacher via helpers. _(S13 — index only `title` / `deleted_at` as needed)_
  - **Gate test**: teacher CRUD works; student is read-only; soft-delete hides the row.

- [ ] **Step 3 — lessons (minimal)** &nbsp; `..._lessons.sql`
  - `lessons`: `id`, `teacher_id NOT NULL REFERENCES profiles`,
    `student_id NOT NULL REFERENCES profiles`, `scheduled_at timestamptz NOT NULL`,
    `title`, `notes`, `status lesson_status DEFAULT 'scheduled'`,
    `lesson_teacher_number int`, `deleted_at`, timestamps.
    `UNIQUE (teacher_id, student_id, lesson_teacher_number)`.
  - `set_lesson_numbers` trigger — the **single** source of numbering, with an
    advisory lock on `(teacher_id, student_id)` to close the concurrent-insert gap.
    The app must stop computing numbers itself. _(S9, A2)_
  - RLS with the 2026-07-15 IDOR scoping baked in from the start: admin all;
    teacher sees/edits own; student reads own; UPDATE/DELETE scoped to teacher with
    `WITH CHECK`. _(S5)_
  - **Gate test**: create several lessons for a pair → numbers increment `1..n`;
    teacher sees own, student sees own, student cannot update another's lesson.

- [ ] **Step 4 — lesson_songs (join)** &nbsp; `..._lesson_songs.sql`
  - `lesson_songs`: `id`, `lesson_id NOT NULL`, `song_id NOT NULL`,
    `status lesson_song_status DEFAULT 'to_learn'`, timestamps.
    `UNIQUE (lesson_id, song_id)`.
  - RLS via lesson ownership (helper + `(select auth.uid())`).
  - **Gate test**: attach a song to a lesson; status moves through all 6 values incl.
    `slow_tempo` without error; visibility inherits the lesson. _(S3 root)_

- [ ] **Step 5 — assignments (minimal)** &nbsp; `..._assignments.sql`
  - `assignments`: `id`, `teacher_id NOT NULL`, `student_id NOT NULL`,
    `lesson_id` (nullable), `song_id` (nullable), `title`, `description`,
    `status assignment_status DEFAULT 'not_started'`, `due_date`, `deleted_at`,
    timestamps.
  - RLS: admin all; teacher own; student own but mutations restricted to `status`
    (policy / column-grant); `WITH CHECK` enforces teacher ownership on write.
  - **Gate test**: teacher creates only for own students; student can change only
    `status`; invalid status transition rejected app-side. _(A3)_

- [ ] **Step 6 — app reconciliation + seed** (code + `seed.sql`, no migration)
  - Regenerate `types/database.types.generated.ts`; reconcile hand-written Zod enums
    (`SongStatusEnum`, `AssignmentStatusEnum`) to the DB. _(A3, A4)_
  - Ownership checks compare `profile.id`.
  - Rewrite `supabase/seed.sql` for the new schema (no `user_roles`, new columns; a
    few auth users + profiles + songs + one teacher/student pair). Keep
    `config.toml` `sql_paths = ["./seed.sql"]`. _(M3)_
  - **Gate test**: `supabase db reset` runs clean end-to-end; app dev server signs in
    and lists/creates a song, a lesson, an assignment.

---

## Section 3 — Later-phase backlog

Each item is a future migration + gate test, still obeying Section 1. Designed clean,
not retrofitted:

- **Shadow students & parents** — add `is_shadow`, `invite_email`, `parent_id / is_parent`.
  Independent-PK identity means **no RLS rewrite**. One clean transfer function, not the
  ~25-table blast-radius version. _(S2 fully realized)_
- **Repertoire & progress** — a single `student_repertoire` with **one** shared progress
  enum; **no** `student_song_progress`; `song_status_history` uses the enum, not `text`;
  sync trigger handles the `slow_tempo` mapping. _(S3, S15, S18)_
- **Practice sessions** — `student_id` / `song_id` `NOT NULL`. _(S10)_
- **Notifications** — one coherent design; `entity_id` a single consistent type;
  notification/event _types_ as lookup tables. _(S6, S7)_
- **Auth events / rate limiting / lockout**. _(S7)_
- **Audit / history** — lightweight per-entity history only; **no** partitioned
  `audit_log`, no hand-managed monthly partitions. _(S4)_
- **Rich song metadata, song videos, SOTW, requests, sections** — additive.
- **AI, content production, theory courses** — additive.
- **Integrations** — `api_keys`, `user_integrations`, `webhook_subscriptions`,
  `drive_files` (decide FK vs polymorphic), `spotify_matches`. _(S14)_

---

## Section 4 — Improvement catalog (traceability)

Every finding from the analysis, mapped to where it is resolved. Nothing is dropped.

### Structural (baseline schema review)

| ID  | Finding                                                             | Resolved by                                            |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| S1  | Dual role model (`profiles` flags **and** `user_roles`)             | Step 0/1 — flags only, no `user_roles`                 |
| S2  | Dual auth linkage (`profiles.id` vs `user_id`)                      | Step 1 — independent PK + `user_id`; shadow phase      |
| S3  | Song progress in 3 tables / 2 enums + `slow_tempo` cast bug         | Step 0 unified enum; Repertoire phase                  |
| S4  | Five parallel audit mechanisms; dead partitioned `audit_log`        | Audit phase — no partitioned audit_log                 |
| S5  | RLS bare `auth.uid()` ×168, inline `EXISTS`, inconsistent helpers   | Step 0 helpers + every RLS step                        |
| S6  | Notifications: 3 near-identical tables, `entity_id` type drift      | Notifications phase                                    |
| S7  | Growth-prone catalogs modeled as enums                              | Convention + Notifications/Auth phases (lookup tables) |
| S8  | Three redundant `updated_at` functions                              | Step 0 — one `set_updated_at()`                        |
| S9  | Count-based lesson numbering, no lock                               | Step 3 — advisory lock                                 |
| S10 | `practice_sessions` FKs nullable                                    | Practice phase — `NOT NULL`                            |
| S11 | Domains defined but bypassed                                        | Step 1 — `citext` email; drop unused domains           |
| S12 | `student_status` defaults `'archived'`                              | Step 1 — sane defaults (col deferred anyway)           |
| S13 | Redundant / over-indexing (`profiles` 11 idx, `student_repertoire`) | Convention — index only what's queried                 |
| S14 | `drive_files` polymorphic, FK-less                                  | Integrations phase — decide FK                         |
| S15 | `song_status_history` status is `text`                              | Repertoire phase — use enum                            |
| S16 | (Good) all `timestamptz`                                            | Convention — keep                                      |
| S17 | Mixed UUID defaults                                                 | Convention — `gen_random_uuid()` only                  |
| S18 | Double FK on `song_status_history.student_id`                       | Repertoire phase — single FK                           |

### Migration-folder

| ID  | Finding                                            | Resolved by                         |
| --- | -------------------------------------------------- | ----------------------------------- |
| M1  | Three incompatible generations                     | Fresh chain                         |
| M2  | Non-idempotent / collisions                        | Convention — idempotency guards     |
| M3  | Seed data + hardcoded prod UUIDs inside migrations | Convention — no data in migrations  |
| M4  | Duplicate numeric prefixes (`024`, `040`)          | Convention — full timestamps        |
| M5  | Date-only prefixes sort ambiguously                | Convention — full timestamps        |
| M6  | 13 `SECURITY DEFINER` fns without `search_path`    | Convention — `search_path` mandated |
| M7  | Baseline drift / source-of-truth confusion         | N/A — fresh local chain             |

### App-layer

| ID  | Finding                                                            | Resolved by                             |
| --- | ------------------------------------------------------------------ | --------------------------------------- |
| A1  | 3 inconsistent CRUD surfaces for songs                             | Step 2 + Section 5 — one surface        |
| A2  | `lesson_teacher_number` computed in 5 places + trigger             | Step 3 + Section 5 — trust trigger      |
| A3  | Zod enum drift (`slow_tempo`, `pending`)                           | Step 0 / Step 6 — reconcile enums       |
| A4  | Generated types stale (`recording_queued_at`, `recorded_at`)       | Convention — regen after each migration |
| A5  | Response shapes mixed (`{data}` vs named keys)                     | Section 5 — named keys, no `data`       |
| A6  | Only `user` has a repository; others call `supabase.from` directly | Section 5 — pick one pattern            |

---

## Section 5 — App-layer reconciliation notes

Standing guidance as the schema lands (details in the app map — key files below):

- **Keep the auth foundation**: `lib/supabase/{server,client,middleware}.ts`,
  `lib/auth/loadAuthedProfile.ts` (flag-based roles), `lib/auth/withApiAuth.ts`.
- **One CRUD surface per table**: API route + `handlers.ts` + Zod `*InputSchema`,
  following `app/api/assignments/`. Retire the competing server-action create/edit
  paths for songs (`app/actions/song-form.ts`, `app/actions/song-edit.ts`). _(A1)_
- **Ownership checks compare `profile.id`**, not `auth.uid()` (identity model). _(A-reconcile)_
- **Trust the numbering trigger**: delete the 5 manual `calculateNextLessonNumber` /
  max+1 sites (`app/dashboard/calendar-actions.ts`,
  `app/dashboard/lessons/recurring-actions.ts`, `app/actions/import-lessons.ts`,
  `app/api/calendar-sync/route.ts`, `app/api/lessons/utils.ts`). _(A2)_
- **Standardize response shapes** to named keys (`song`, `songs`, `lesson`), no `data`. _(A5)_
- **Regenerate `types/database.types.generated.ts`** after every migration and reconcile
  the Zod enums in `schemas/`. _(A3, A4)_

---

## Section 6 — Execution model (multi-agent orchestration)

**Unit of delivery = vertical slice** (one domain, end-to-end). Ship and human-test a
slice before the next begins.

**Slices are strictly sequential — not parallelizable.** The blocker is shared state,
not file conflicts, so worktree isolation does not help:

- One shared local Supabase stack (uwh) — concurrent `supabase db reset` collides.
- One ordered migration chain — later migrations depend on earlier tables/helpers.
- One regenerated type file and one `seed.sql` — two slices both rewrite them.
- One shared app shell (auth, layout, nav).

Real concurrency would need a Supabase branch + isolated DB per slice — overkill for
solo incremental work. So: **one slice at a time, human test gate between slices.**

**Within a slice = a short agent pipeline** with one genuine parallel fan (≤2 agents at
once; no worktrees — sequential hand-off on the same tree):

```
DB agent (supabase-schema-architect)
   → migration + db reset + regen types + RLS/SQL tests        [alone, first]
        │
Backend agent (feature-developer)
   → API route + handlers.ts + Zod schema                      [needs types]
        │
   ┌────┴──────────────────┐
UI agent (ui-engineer)    Test agent (test-engineer)
   → components/hooks         → handler unit/integration tests [parallel]
   └────┬──────────────────┘
E2E (Playwright for the slice)                                 [needs UI]
```

**Phase-1 order**: Wave 0 (foundation + profiles + auth wiring; one DB agent) →
**Songs** → _human test_ → **Lessons + lesson_songs** → _human test_ →
**Assignments** → _human test_.

**Mechanism**: default is turn-by-turn `Agent` spawns so the user stays in the loop
between layers. A `Workflow()` pipeline can automate a single slice to its gate — opt-in.

---

## Verification

- **Per step**: `supabase db reset` on the local uwh stack (Docker must be running —
  it was down during analysis), then the step's gate test, then `npm test` + type regen.
- A **manual-test HTML** per the CLAUDE.md gate for each non-trivial migration.
- **End of Phase 1**: full `db reset` clean from empty → app signs in and does basic
  CRUD on all three tables; RLS spot-checked with teacher vs student accounts.

## Housekeeping (confirm at execution)

- Archive the remaining 6 `supabase/migrations/` files (and the already-moved 167 in
  `supabase/migrations_archive/`) — commit the archive, or delete outright since the
  baseline dump is the historical record.
- **No Cloud/prod changes** — this rebuild targets the local stack until a future,
  separate cutover decision.

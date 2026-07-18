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

- [x] **Step 2 — songs (minimal)** &nbsp; `..._songs.sql`
  - `songs`: `id`, `title NOT NULL`, `author`, `level difficulty_level`,
    `key music_key`, `chords`, `short_title`, `ultimate_guitar_link`, `deleted_at`,
    timestamps. Media / tempo / lyrics / AI columns deferred to a later
    "songs: rich metadata" migration.
  - Soft-delete via `deleted_at` (no cascade function yet — added with repertoire).
  - RLS: authenticated read where `deleted_at IS NULL`; insert/update/delete for
    admin/teacher via helpers. _(S13 — index only `title` / `deleted_at` as needed)_
  - **Gate test**: teacher CRUD works; student is read-only; soft-delete hides the row.

- [x] **Step 3 — lessons (minimal)** &nbsp; `..._lessons.sql`
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

- [x] **Step 4 — lesson_songs (join)** &nbsp; `..._lesson_songs.sql`
  - `lesson_songs`: `id`, `lesson_id NOT NULL`, `song_id NOT NULL`,
    `status lesson_song_status DEFAULT 'to_learn'`, timestamps.
    `UNIQUE (lesson_id, song_id)`.
  - RLS via lesson ownership (helper + `(select auth.uid())`).
  - **Gate test**: attach a song to a lesson; status moves through all 6 values incl.
    `slow_tempo` without error; visibility inherits the lesson. _(S3 root)_

- [x] **Step 5 — assignments (minimal)** &nbsp; `..._assignments.sql`
  - `assignments`: `id`, `teacher_id NOT NULL`, `student_id NOT NULL`,
    `lesson_id` (nullable), `song_id` (nullable), `title`, `description`,
    `status assignment_status DEFAULT 'not_started'`, `due_date`, `deleted_at`,
    timestamps.
  - RLS: admin all; teacher own; student own but mutations restricted to `status`
    (policy / column-grant); `WITH CHECK` enforces teacher ownership on write.
  - **Gate test**: teacher creates only for own students; student can change only
    `status`; invalid status transition rejected app-side. _(A3)_

- [x] **Step 6a — live LOCAL cutover + song restore** (done 2026-07-18)
  - Ran `scripts/db/local-cutover.sh` (atomic single transaction) against the local
    uwh stack: dropped the old 73-table public schema, applied all 7 migrations,
    reseeded. `DROP SCHEMA public CASCADE` was pre-checked safe (only casualty outside
    `public` was our own `trigger_handle_new_user`; auth/storage/realtime untouched).
  - **Songs restored losslessly**: the 438-song backup went in via `supabase/seed.sql`.
    To avoid stranding the 409 songs with rich data, the Phase-4 songs columns were
    pulled forward as `20260718090600_songs_rich_metadata.sql` and applied at cutover.
    Data-driven corrections: `category` stays **text** (31 messy free-text genres, not
    an enum); `priority_bucket` **dropped** (NULL on all rows).
  - **Profiles backfilled** for all 53 existing auth users (role flags by email);
    existing logins keep working (auth schema untouched).
  - **Migration history rewritten**: `supabase_migrations.schema_migrations` truncated
    and re-seeded with the 7 new versions.
  - **Verified**: 5 tables, 53 profiles, 438 songs (375 active); RLS proven on the live
    stack (student sees own profile + shared songs, admin sees all, student song-insert
    blocked); PostgREST serves the new schema and returns `PGRST205` for dropped
    `user_roles`. _(M3)_
- [ ] **Step 6b — app reconciliation** (code, pending)
  - Regenerate `types/database.types.generated.ts` (blocked: needs Docker for
    `supabase gen types`, currently down on the Mac — do it on the app-rebuild pass).
  - Reconcile hand-written Zod enums (`SongStatusEnum`, `AssignmentStatusEnum`). _(A3, A4)_
  - Ownership checks compare `profile.id`.
  - **App is intentionally broken** until per-phase UI is rebuilt — the existing code
    queries the old full schema (see Housekeeping: deployment freeze).

---

## Section 3 — Full phase catalog (all subsystems, column-level)

Every phase after the core spine, specified at column level, applying all improvement
findings. Each phase is one or more migrations + a `supabase/tests/phaseNN.sql` gate file;
phases are dependency-ordered but independently shippable and reprioritisable.

**RLS shorthand**: **self** = owner `= current_profile_id()`; **participant** = admin OR
owning teacher OR the student; **staff-write** = `is_admin_or_teacher()`; **admin-only** =
`is_admin()`.

### Phase overview

| Ph   | Subsystem                 | Tables (new/rebuilt)                                                                                       | Depends | App feature                                 |
| ---- | ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| 1 ✅ | Core spine                | profiles·songs·lessons·lesson_songs·assignments (minimal)                                                  | —       | auth + CRUD                                 |
| 2    | Identity completion       | profiles(+cols)·auth_event_types·auth_events·auth_rate_limits                                              | 1       | shadow students, parents, lockout, deletion |
| 3    | Repertoire & practice     | student_repertoire·song_status_history·practice_sessions                                                   | 1       | repertoire, practice, progress              |
| 4    | Songs rich + song-centric | songs(+cols)·song_sections·song_of_the_week·song_requests                                                  | 1       | song editor, SOTW, requests                 |
| 5    | Notifications             | notification_types·notification_log·notification_queue·notification_preferences·in_app_notifications       | 2       | reminders, digests, feed                    |
| 6    | Settings & integrations   | user_preferences·user_settings·api_keys·user_integrations·webhook_subscriptions·sync_conflicts·drive_files | 2,3     | settings, API keys, Calendar/Drive          |
| 7    | Skills & practice tools   | chords·chord_srs·chord_quiz_attempts·skills·student_skills·cohorts·cohort_members                          | 1       | fretboard, skills, cohorts                  |
| 8    | Content & media           | song_videos·spotify_matches·content_posts·content_post_metrics·hashtag_sets·apple_shortcut_song_import_log | 4       | video pipeline, posting                     |
| 9    | Theory courses            | theoretical_courses·theoretical_lessons·theoretical_course_access                                          | 2       | theory LMS                                  |
| 10   | AI assistant              | ai_conversations·ai_messages·ai_generations·ai_prompt_templates·ai_usage_stats·agent_execution_logs        | 1       | AI chat + generation                        |
| 11   | Audit, history & logs     | change_history·system_logs + track_* triggers                                                              | all     | audit trail, admin logs                     |
| 12   | Analytics                 | materialized + security_invoker views                                                                      | all     | dashboards, stats                           |

**Dropped (not rebuilt)**: `user_roles`, `student_song_progress`, partitioned `audit_log`

- 13 partitions + 4 unused `tr_audit_*` fns, `pending_students`.
  **Fresh tables** (no baseline equivalent): `chords`, `skills`, `student_skills`, `cohorts`,
  `cohort_members`, `content_post_hashtag_sets`, `notification_types`, `auth_event_types`,
  unified `change_history`.

### Phase 2 — Identity completion

Unlocks shadow students, parents, lockout, soft-deletion/GDPR, auth audit.

- **profiles — add columns** (one `ALTER ... ADD COLUMN IF NOT EXISTS`): shadow (`is_shadow
bool default false`, `invite_email citext`); parent (`parent_id uuid → profiles(id) set
null`, `is_parent bool default false`, CHECK `no_self_parent (parent_id <> id)`); lockout
  (`failed_login_attempts int default 0`, `locked_until timestamptz`, `last_sign_in_at`,
  `sign_in_count int default 0`); soft-delete (`deletion_requested_at`,
  `deletion_scheduled_for`, `deleted_at`); lifecycle (`status_changed_at default now()`,
  `lead_source text`, `onboarding_completed bool default false`, `student_status` enum
  active/archived **default active** (S12), `confirmed_active_at`, `spotify_playlist_url`).
  Extend `handle_new_user` to **link an existing shadow profile by `invite_email = new.email`**
  (set user_id, clear shadow) — the clean single transfer path (S2). Add a parent-reads-children RLS policy.
  **Constraint**: add a **partial unique index on `invite_email where is_shadow`** (the old schema
  needed exactly this — `20260518000001_unique_invite_email` — after duplicate invites); on link,
  update the placeholder email to the real one or the `email citext UNIQUE` collides.
- **auth_event_types** (lookup, replaces 20-value enum, S7): `code text pk`, `description text`.
- **auth_events**: `id`, `event_type text → auth_event_types(code)`, `occurred_at default now()`,
  `user_email text`, `user_id uuid`, `actor_id uuid` (both FK-less), `ip_address text`,
  `success bool not null`, `error_message text`, `email_status` (enum auth_email_status:
  not_applicable/sent/failed/skipped), `email_error text`, `metadata jsonb`. Admin read; SD-logger write.
- **auth_rate_limits**: `id`, `identifier text`, `operation text`, `attempted_at default now()`;
  index `(identifier, operation, attempted_at)`; written by atomic `check_rate_limit()` SD fn; service-role only.
- **Gate (phase2.sql)**: shadow → signup links same profile.id with FKs intact; parent sees children;
  `event_type` FK rejects unknown. **Findings**: S2, S7, S12.

### Phase 3 — Repertoire & practice

Unlocks `dashboard/repertoire`, `dashboard/practice`.

- **student_repertoire** (single progress table; `student_song_progress` dropped): `id`;
  `student_id uuid not null → profiles cascade`; `song_id uuid not null → songs cascade`;
  UNIQUE `(student_id, song_id)`; `current_status lesson_song_status not null default 'to_learn'`
  (**unified enum**, S3); `preferred_key music_key`, `capo_fret smallint 0..20`,
  `custom_strumming varchar(255)`, `student_notes`, `teacher_notes`, `started_at`, `mastered_at`,
  `difficulty_rating smallint 1..5`, `self_rating smallint 1..5`, `self_rating_updated_at`,
  `total_practice_minutes int default 0`, `practice_session_count int default 0`,
  `last_practiced_at`, `assigned_by uuid → profiles set null`, `sort_order int default 0`,
  `is_active bool default true`, `priority` (**enum** repertoire_priority high/normal/low/archived),
  timestamps. RLS participant. Triggers: `set_updated_at`; `record_progress_history`.
- **song_status_history** (typed, single FK — S15, S18): `id`; `student_id uuid not null →
profiles cascade` (single FK); `song_id uuid not null → songs cascade`;
  `previous_status lesson_song_status`, `new_status lesson_song_status not null` (**enum**);
  `changed_at default now()`, `notes text`. Participant read; trigger-inserted only.
- **practice_sessions** (S10, S17): `id` `gen_random_uuid()`; `student_id uuid not null →
profiles cascade` (**NOT NULL**), `song_id uuid → songs set null`; `duration_minutes int
not null 1..480`, `bpm_practiced smallint 20..300`, `notes`, timestamps. Triggers apply/reverse
  to repertoire counters. Student writes own; teacher/admin read.
- **Sync trigger** `lesson_songs → student_repertoire` (both use `lesson_song_status` → no
  cross-cast, `slow_tempo` bug impossible). **Gate (phase3.sql)**: attach→repertoire appears;
  `slow_tempo` flows; one history row; practice counters increment/reverse; cross-student isolation.
  **Findings**: S3, S10, S15, S17, S18.

### Phase 4 — Songs rich metadata + song-centric features

Unlocks full song editor, SOTW, requests.

- **songs — add columns** (ALTER) — **already applied at cutover** via
  `20260718090600_songs_rich_metadata.sql`: `capo_fret int 0..20`, `strumming_pattern`,
  `tempo int 20..300`, `time_signature int 1..16`, `duration_ms int >0`, `release_year int
1900..2100`, `category` (**text** — 31 messy free-text genres in the real data; an enum
  would be permanent churn), `youtube_url`, `spotify_link_url`, `cover_image_url`,
  `tiktok_short_url`, `lyrics_with_chords`, `gallery_images text[]`, `audio_files jsonb default
'{}'`, `is_draft bool default false`, `recording_queued_at`, `recorded_at`, `search_vector
tsvector GENERATED ... STORED` + GIN. **`priority_bucket` NOT rebuilt** (NULL on all 438
  rows; dated planning artifact). Remaining Phase-4 tables (below) still pending.
- **song_sections**: `id`; `song_id → songs cascade`; `section_type` (**enum** intro/verse/
  pre_chorus/chorus/bridge/solo/interlude/outro); `section_number int default 1`, `order_position
int not null`, `chords text[] default '{}'`, `lyrics`, `tab_notation`, `notes`, `created_at`.
  Read authenticated; write staff.
- **song_of_the_week**: `id`; `song_id → songs cascade`; `selected_by uuid not null → profiles
on delete restrict` (fixes NOT-NULL+SET NULL); `teacher_message`, `active_from date default
current_date`, `active_until date`, `is_active bool default true`, timestamps. Read auth; write staff.
- **song_requests**: `id`; `student_id → profiles cascade`; `title text not null`, `artist`,
  `notes`, `url`; `status` (**enum** pending/approved/rejected); `reviewed_by uuid → profiles set
null`, `review_notes`; `song_id uuid → songs set null`; timestamps. Student own; staff review.
- **Gate (phase4.sql)**: new-column CRUD; search_vector match; section_type enum; request isolation
  - staff approval; SOTW read-all/write-staff. **Findings**: enum-ification (S7 family), FK conflicts.

### Phase 5 — Notifications

Unlocks `dashboard/notifications`, email, in-app feed, `/unsubscribe`.

- **notification_types** (lookup, replaces 17-value enum, S7): `code text pk`, `description`,
  `default_channel text`, `is_active bool default true`.
- Shared: **`entity_id uuid` in all four** (fix in_app text divergence, S6); recipient FK → profiles.
- **notification_log**: `id`; `notification_type text → notification_types(code)`; `recipient_id
uuid not null → profiles cascade`, `recipient_email text not null`; `status` (enum
  notification_status pending/sent/failed/bounced/skipped/cancelled); `subject text not null`,
  `template_data jsonb`, `sent_at`, `error_message`, `retry_count int default 0`, `max_retries int
default 5`, `entity_type text`, `entity_id uuid`, timestamps.
- **notification_queue**: as log but `template_data jsonb not null`, `scheduled_for default now()`,
  `processed_at`, `priority int default 5`; partial index `status='pending'`.
- **notification_preferences**: `id`; `user_id → profiles cascade`; `notification_type text →
notification_types(code)`; `enabled bool default true`; UNIQUE `(user_id, notification_type)`;
  seeded per user by AFTER INSERT trigger on profiles.
- **in_app_notifications**: `id`; `user_id → profiles cascade`; `notification_type text →
notification_types(code)`; `title`, `body`, `icon`, `variant default 'default'`, `is_read bool
default false`, `read_at`, `action_url`, `action_label`, `entity_type text`, `entity_id uuid`
  (S6), `priority int default 5`, `expires_at default now()+'30 days'`, timestamps.
- RLS: user reads/updates own feed + prefs; log/queue admin-read/service-write. **Gate (phase5.sql)**:
  FK rejects unknown type; profile insert seeds prefs; enqueue→in_app; own-feed isolation; uuid entity_id.
  **Findings**: S6, S7.

### Phase 6 — Settings & integrations

Unlocks `dashboard/settings`, `dashboard/profile`, API keys, Google Calendar/Drive.

- **user_preferences**: `id`; `user_id → profiles cascade` UNIQUE; `goals text[]`, `skill_level`
  (enum difficulty_level), `learning_style text[]`, `instrument_preference text[]`, timestamps. Self.
- **user_settings**: `id`; `user_id → profiles cascade` UNIQUE; `theme` (enum light/dark/system),
  `language` (enum app_language en/pl/es/de/fr), `timezone text default 'UTC'`, `profile_visibility`
  (enum public/private/contacts), `show_email bool default false`, `show_last_seen bool default true`,
  `font_scheme text default 'geist'`, timestamps. Self.
- **api_keys**: `id`; `owner_id uuid not null → profiles cascade` (**normalized**, was auth.users);
  `name text not null`, `key_hash text not null unique`, `last_used_at`, `expires_at`, `is_active bool
default true`, timestamps. Self.
- **user_integrations**: composite PK `(user_id, provider)`; `user_id → profiles cascade`;
  `access_token`, `refresh_token`, `expires_at bigint` (epoch ms), timestamps. Self; token columns not
  client-selectable.
- **webhook_subscriptions**: `id`; `user_id → profiles cascade`; `provider`, `channel_id text unique`,
  `resource_id`, `expiration bigint`, timestamps. Self/admin.
- **sync_conflicts**: `id`; `lesson_id → lessons cascade`; `google_event_id varchar(255)`,
  `conflict_data jsonb not null`, `status` (enum pending/resolved/ignored), `resolution` (enum
  use_local/use_remote, nullable), `resolved_at`, timestamps. Via `can_manage_lesson`.
- **drive_files** (polymorphic kept, S14): `id`; `uploaded_by uuid → profiles set null` (normalized);
  `entity_type` (enum song/lesson/assignment/profile), `entity_id uuid` (**FK-less**);
  `google_drive_file_id text unique`, `google_drive_folder_id`, `file_type` (enum audio/pdf/video/
  document/image), `filename text not null`, `title`, `description`, `mime_type text not null`,
  `file_size_bytes bigint`, `metadata jsonb default '{}'`, `visibility` (enum private/students/public),
  `display_order int default 0`, `deleted_at`, timestamps. Uploader/staff; visibility gates students.
- **Gate (phase6.sql)**: self-only settings; api_key hash unique + owner isolation; tokens not
  cross-readable; sync_conflict via lesson ownership; drive_file enum + visibility. **Findings**: S7, S14, FK normalization.

### Phase 7 — Skills, chords & cohorts (fresh designs)

Unlocks `dashboard/fretboard`, `dashboard/skills`, `dashboard/cohorts`.

- **chords** (NEW catalog, fixes free-text chord_id): `id text pk` ('Am'), `display_name text not
null`, `difficulty` (enum difficulty_level), `fingering jsonb`, `category text`, `sort_order int`.
- **chord_srs**: `id`; `student_id → profiles cascade`; `chord_id text not null → chords(id)`;
  `repetitions smallint default 0`, `interval_days real default 1`, `ease_factor real default 2.5`,
  `next_review_at default now()`, `last_reviewed_at`; UNIQUE `(student_id, chord_id)`, timestamps. Self.
- **chord_quiz_attempts**: `id`; `student_id → profiles cascade`; `chord_id text not null → chords(id)`;
  `selected_answer text not null`, `is_correct bool not null`, `response_time_ms int >=0`, `created_at`.
  Self write, teacher read.
- **skills** (NEW): `id`; `name text not null`, `category`, `description`, `difficulty difficulty_level`,
  `sort_order int default 0`, `is_active bool default true`, timestamps.
- **student_skills** (NEW): `id`; `student_id → profiles cascade`; `skill_id → skills cascade`;
  `status` (enum not_started/in_progress/achieved), `assessed_by uuid → profiles set null`,
  `assessed_at`, `notes`; UNIQUE `(student_id, skill_id)`, timestamps. Participant.
- **cohorts** (NEW): `id`; `teacher_id → profiles cascade`; `name text not null`, `description`,
  `is_active bool default true`, timestamps. **cohort_members**: `(cohort_id → cohorts cascade,
student_id → profiles cascade)` PK, `added_at default now()`. Owning teacher/admin; student sees own.
- **Gate (phase7.sql)**: chord_id FK rejects unknown; SRS unique; teacher-only skill assessment; cohort visibility.

### Phase 8 — Content & media pipeline

Unlocks video/production, social posting, Spotify enrichment, Apple Shortcut import.

- **song_videos**: `id`; `song_id → songs cascade`; `uploaded_by uuid → profiles set null` (nullable,
  fixes conflict); `google_drive_file_id text not null unique`, `google_drive_folder_id`, `title text
not null default ''`, `filename text not null`, `mime_type text not null`, `file_size_bytes bigint`,
  `duration_seconds numeric(8,2)`, `thumbnail_url`, `display_order int default 0`; publish flags
  `published_to_instagram/tiktok/youtube_shorts bool default false` + `*_media_id text`; quality
  booleans; `mic_type` (enum iphone/external), `match_confidence int 0..100`, `match_source` (enum
  auto/manual/spotify), `production_status` (enum idea/recording/edited/ready), timestamps. Read
  students (assigned/all — minimal); write staff.
- **spotify_matches**: `id`; `song_id → songs cascade`; spotify_* columns; `confidence_score int
0..100`, `search_query text not null`, `match_reason`, `ai_reasoning`; `status` (enum pending/
  approved/rejected/auto_applied); `reviewed_by uuid → profiles set null`, `reviewed_at`, `review_notes`;
  UNIQUE `(song_id, spotify_track_id, status)` deferrable, timestamps. Staff.
- **content_posts**: `id`; `song_id → songs cascade`; `song_video_id uuid → song_videos set null`;
  `platform` (enum tiktok/instagram/youtube_shorts); `status` (enum planned/scheduled/published/
  archived/failed); `scheduled_at`, `published_at`, `hook`, `caption`, `extra_hashtags text[]`;
  **hashtags via join table** (below); `stories jsonb default '{}'`, `external_url`, `external_post_id`,
  metric counts + `engagement_rate numeric(5,2)`, `metrics_updated_at`; UNIQUE `(song_id, platform,
scheduled_at)`, timestamps. Publish-flag sync trigger.
- **content_post_hashtag_sets** (NEW join, replaces `uuid[]`): `(post_id → content_posts cascade,
hashtag_set_id → hashtag_sets cascade)` PK both.
- **content_post_metrics**: `id`; `post_id → content_posts cascade`; `captured_at default now()`;
  metric counts; `notes`; `created_at`.
- **hashtag_sets**: `id`; `name text not null unique`, `description`, `hashtags text[]`, `is_active bool
default true`, timestamps.
- **apple_shortcut_song_import_log**: `id`; `user_id uuid → profiles set null`; spotify/song text cols;
  `song_id uuid → songs set null`; `status` (enum success/duplicate/error), `error_message`,
  `http_status int`, `source` (enum shortcut/api/debug_page), `created_at`. Admin.
- **Gate (phase8.sql)**: production_status flow; publish sync; post↔hashtag join integrity; spotify unique;
  import enums. **Findings**: enum-ification, array→join, FK conflicts.

### Phase 9 — Theory courses

Unlocks `dashboard/theory`.

- **theoretical_courses**: `id`; `title varchar(255) not null`, `description`, `cover_image_url`,
  `level` (enum difficulty_level) default beginner; `created_by uuid not null → profiles cascade`,
  `is_published bool default false`, `published_at`, `sort_order int default 0`, `deleted_at`, timestamps
  (+ `set_updated_at` trigger — old lacked it). Staff manage; students read published/granted.
- **theoretical_lessons**: `id`; `course_id → theoretical_courses cascade`; `title varchar(255) not
null`, `content text not null default ''`, `excerpt`, `is_published bool default false`, `published_at`,
  `sort_order int default 0`, `deleted_at`, timestamps. Inherits course access.
- **theoretical_course_access**: `id`; `course_id → theoretical_courses cascade`; `user_id → profiles
cascade`; `granted_by uuid not null → profiles cascade`; `granted_at default now()`; **UNIQUE
  `(course_id, user_id)`** (fixes duplicate grants). Staff grant; student sees own.
- **Gate (phase9.sql)**: published visibility; grant uniqueness; student reads only granted/published.

### Phase 10 — AI assistant

Unlocks `dashboard/ai`, `app/ai`. Enums `ai_context_type`(6)/`ai_generation_type`(7)/`ai_message_role`(3)/`ai_prompt_category`(7) kept.

- **ai_conversations**: `id`; `user_id → profiles cascade`; `title`, `model_id text not null`,
  `context_type ai_context_type default general`, `context_id uuid`, `is_archived bool default false`,
  timestamps. Self.
- **ai_messages**: `id`; `conversation_id → ai_conversations cascade`; `role ai_message_role not null`,
  `content text not null`, `model_id`, `tokens_used int`, `latency_ms int`, `is_helpful bool`, `created_at`.
  Via conversation ownership.
- **ai_generations**: `id`; `user_id → profiles cascade`; `generation_type ai_generation_type not null`,
  `agent_id/model_id/provider varchar`, `input_params jsonb not null`, `output_content text not null`,
  `is_successful bool default true`, `error_message`, `context_entity_type varchar(50)`,
  `context_entity_id uuid` (FK-less), `is_starred bool default false`, timestamps. Self.
- **ai_prompt_templates**: `id`; `name text not null`, `description`, `category ai_prompt_category default
custom`, `prompt_template text not null`, `variables jsonb`, `is_system bool default false`, `is_active
bool default true`, `created_by uuid → profiles set null`, timestamps. Read staff; write admin.
- **ai_usage_stats**: `id`; `user_id → profiles cascade`; `date default current_date`, `model_id text not
null`, `request_count/total_tokens/total_latency_ms/error_count int default 0`; UNIQUE `(user_id, date,
model_id)`, timestamps. Self read; service write.
- **agent_execution_logs**: `id`; `agent_id text not null`, `request_id text not null`, `user_id uuid →
profiles cascade`, `successful bool not null`, `execution_time int not null`, `input_hash text not null`,
  `error_code`, `occurred_at default now()`, `created_at`. Admin.
- **Gate (phase10.sql)**: conversation/message isolation; usage unique; system templates admin-only.

### Phase 11 — Audit, history & logging

Unlocks admin audit, `dashboard/logs`, `dashboard/health`.

- **change_history** (single unified table — replaces the three `*_history`; **no** partitioned
  `audit_log`, S4): `id`; `entity_type` (enum change_entity profile/lesson/assignment/song/song_progress);
  `entity_id uuid not null` (**FK-less** — outlives subject); `changed_by uuid → profiles set null`
  (**single** FK, S18); `change_type` (enum created/updated/deleted/status_changed/rescheduled/cancelled/
  completed/role_changed); `previous_data jsonb`, `new_data jsonb`, `changed_at default now()`, `notes`.
  Written by `track_*` SD triggers on profiles/lessons/assignments/lesson_songs. Admin read.
- **system_logs**: `id`; `occurred_at default now()`, `level` (enum debug/info/warn/error), `prefix text
not null`, `message text not null`, `request_id`, `user_id uuid → profiles set null`, `context jsonb`,
  `error jsonb`, `created_at`. Admin read; service write.
- **Gate (phase11.sql)**: update writes one change_history row w/ right entity/change type; survives subject
  deletion; admin-only read. **Findings**: S4, S18.

### Phase 12 — Analytics & reporting

Unlocks `dashboard` home, `dashboard/stats`.

- Materialized views `mv_song_popularity`, `mv_song_engagement`, `mv_dashboard_stats`,
  `mv_teacher_performance` (+ unique index each for `REFRESH ... CONCURRENTLY` + refresh fn).
- Regular views `teacher_students`, lesson-count views, `user_overview` — **all `WITH (security_invoker
= true)`** (bake in the old late fix). MVs admin/teacher-only via wrapping view or grants.
- **Gate (phase12.sql)**: teacher sees only own students via `teacher_students`; MV refresh runs; stats
  match base rows. **Findings**: security_invoker views.

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

## Housekeeping & standing constraints

- **Deployment freeze on the rebuild branch**: `main` → preview and `production` → prod
  both run the current app against prod's _old_ schema. The rebuild branch **must not
  merge to `main`** until either UI parity is reached or a deliberate prod cutover. Prod
  keeps running untouched meanwhile — accept the dual-maintenance freeze.
- **Storage phase (not yet in the catalog)**: the old prod schema has `storage.objects`
  policies (avatars, song-images buckets). The local stack has no `storage` schema running,
  so it's a prod-cutover concern, not a local blocker — fold bucket/policy setup into Phase 6
  so it isn't forgotten.
- **Prod ETL constraint (record now)**: an eventual lossless prod migration requires
  **preserving profile ids** — old prod `profiles.id` = the auth user id, and the new schema
  accepts `id = old value, user_id = same value`. Never generate fresh ids at prod cutover or
  every lesson/repertoire FK is severed.
- **No Cloud/prod changes** — this rebuild targets the local stack until a separate cutover decision.
- Archive already committed: 173 old migrations live in `supabase/migrations_archive/`.

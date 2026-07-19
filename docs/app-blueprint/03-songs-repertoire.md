---
created: 2026-07-18
updated: 2026-07-18
domain: Songs & Repertoire
tables:
  [
    songs,
    song_sections,
    student_repertoire,
    student_song_progress,
    song_status_history,
    song_requests,
    song_of_the_week,
    apple_shortcut_song_import_log,
    spotify_matches,
  ]
maturity: built
---

# Songs & Repertoire

## Purpose

The song catalog is the teacher-curated spine of the core loop: the teacher maintains a library of
songs (metadata, chords, media links), attaches them to lessons, and each attachment materializes
into the student's **repertoire** — the per-student, per-song record of what they are learning and
how far along they are. Around the catalog sit enrichment (Spotify matching), engagement features
(song of the week, student song requests — both currently surface-less), and analytics
infrastructure (matviews — currently reader-less).

## Data model

All DDL: `supabase/baseline/cloud_schema_2026-06-22.sql`. Behavioral summaries only.

| Table                            | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                       | State                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `songs`                          | Catalog. Scalars (level/key/capo/tempo/time-signature/duration/year/category), `chords` text, `lyrics_with_chords`, media links (YouTube/UG/Spotify/TikTok/cover/gallery/`audio_files` jsonb), generated `search_vector` (title weight A, author B), soft delete via `deleted_at`, `is_draft`. Content-pipeline columns (`recording_queued_at`, `recorded_at`, `priority_bucket`) belong to doc 09.                                                        | **mounted**                                               |
| `song_sections`                  | Structured per-section chords/lyrics/tab (`section_type` check: intro…outro, ordered). Full RLS exists; **no write path or UI anywhere** — the song edit form persists scalars only.                                                                                                                                                                                                                                                                       | **dormant**                                               |
| `student_repertoire`             | **SSOT for per-student song progress.** Unique (student_id, song_id). `current_status` (`song_progress_status`), per-student overrides (preferred_key, capo, custom strumming), student+teacher notes, denormalized practice metrics (`total_practice_minutes`, `practice_session_count`, `last_practiced_at`), `difficulty_rating` (1–5), `self_rating` (1–5 confidence), `priority` (high/normal/low/archived), `is_active`, `started_at`/`mastered_at`. | **nav-hidden** (`repertoire` in `CORE_LOOP_HIDDEN_ITEMS`) |
| `student_song_progress`          | **DEPRECATED** — superseded by `student_repertoire` (data migrated `20260222000000`, triggers dropped `20260322000001`). Uses the older `lesson_song_status` enum. Zero app readers (only generated types reference it). One live liability: the baseline's practice-undo trigger still targets it with a wrong column name — see 04-practice-progress PRA-1.                                                                                              | **dormant**                                               |
| `song_status_history`            | Append-only audit of every status transition, written by two triggers (below). Read by `app/api/student/song-status-history/route.ts`.                                                                                                                                                                                                                                                                                                                     | supporting                                                |
| `song_requests`                  | Student asks for a song: title/artist/notes/url, `status` pending/approved/rejected, reviewer + `song_id` link once created. RLS: student inserts/reads own; teacher reads/updates all. Actions in `app/actions/song-requests.ts`; **no UI imports them**.                                                                                                                                                                                                 | **built-unmounted** (actions only)                        |
| `song_of_the_week`               | Single active teacher pick with `teacher_message` and active_from/until window. RLS: any authenticated reads; admin mutates. Actions in `app/actions/song-of-the-week.ts` (setting a SOTW also adds it to repertoires via `addSongToRepertoireAction`); **no UI imports them**.                                                                                                                                                                            | **built-unmounted** (actions only)                        |
| `apple_shortcut_song_import_log` | Audit trail for the iOS-Shortcut Spotify→Strummy import (status success/duplicate/error, source shortcut/api/debug-page). The current endpoint `app/api/spotify/send-to-strummy/route.ts` inserts into `songs` but **no code writes this log table anymore**.                                                                                                                                                                                              | **dormant**                                               |
| `spotify_matches`                | AI-scored candidate matches (track metadata, `confidence_score` 0–100, `ai_reasoning`, status pending/approved/rejected/auto_applied, reviewer fields). Written by `app/api/spotify/sync/*`; reviewed via `app/api/spotify/matches/*` routes; **no UI consumes the review routes**.                                                                                                                                                                        | **unbuilt UI** (API-only)                                 |

**Matviews** (no app readers found — dormant analytics infra): `mv_song_engagement` (per-song
learner counts, mastery, avg practice minutes/difficulty, lesson appearances) and
`mv_song_popularity` (assignment counts, mastery rate). Refreshed by `refresh_song_engagement()`
(both, CONCURRENTLY); live prod also has post-baseline `refresh_song_matviews` (00-overview
§Schema truth).

**Enums**

- `song_progress_status` (repertoire): `to_learn → started → remembered → with_author → mastered`.
  Commented "linear, no backwards movement" — but see Two-path model below.
- `lesson_song_status` (lesson_songs + deprecated table): same five **plus `slow_tempo`**, a dead
  branch never mapped into `song_progress_status` (`CONTEXT.md`).
- `music_key`: 31 values (majors incl. enharmonics + minors). `difficulty_level`:
  beginner/intermediate/advanced.

## Behavior & rules

### The two-path Song Progress model (CONTEXT.md — do not add a third write path)

1. **Via-lesson cascade** — trigger `fn_sync_lesson_song_to_repertoire` (BEFORE INSERT and
   BEFORE UPDATE OF status on `lesson_songs`): resolves the lesson's student, auto-creates the
   `student_repertoire` row if missing, backfills `lesson_songs.repertoire_id`, and advances
   `current_status` **forward-only** (array-position comparison; sets `started_at` on first
   advance, `mastered_at` on reaching mastered). `slow_tempo` casts would fail —
   the enum value is unreachable from this path in practice.
2. **Direct teacher override** — `updateRepertoireEntryAction` (`app/actions/repertoire.ts`)
   writes any field including `current_status`; **regression is allowed** here (the correction
   path). For student callers the action whitelists `student_notes` + `difficulty_rating`
   (RLS `sr_update_own_notes` does not column-restrict, so the action is the guard). Self-rating
   has its own action (`app/actions/self-rating.ts`).

### History, notifications, deletion

- `song_status_history` is written by **both** paths: `track_song_status_changes` (INSERT/UPDATE
  on `lesson_songs`) and `fn_record_progress_history` (UPDATE OF current_status on
  `student_repertoire`). Append-only; never mutated by app code.
- `tr_notify_song_mastery` (AFTER UPDATE on `lesson_songs`): reaching `mastered` queues a
  `song_mastery_achievement` notification with running mastered-count (doc 07).
- **Soft delete**: `soft_delete_song_with_cascade(song_uuid, user_uuid)` refuses if
  `has_active_lesson_assignments` (song on a SCHEDULED/IN_PROGRESS lesson), else sets
  `deleted_at` and hard-deletes `lesson_songs` junction rows. Migration `20260715120000`
  extends the cascade to repertoire rows. `deleted_at IS NULL` filters everywhere.
- `find_similar_songs(title, threshold, max)`: trigram similarity, used for CSV-import dedupe
  (`app/actions/import-csv-songs.ts`).

### Access (RLS is the boundary — ADR-0001)

- `songs`: admin/teacher see all non-deleted; a student sees a song only when a
  `lesson_songs → lessons` row ties it to them. The list read path uses an RLS-respecting client
  (`lib/services/songs-list-queries.ts` — the admin-client bypass flagged in spec 01 was fixed).
- `student_repertoire`: `sr_select_own` / `sr_select_admin_teacher`; student updates own
  notes/difficulty; staff update all. Parents: select via `is_child_of_parent` (parent UX unbuilt).
- `spotify_matches`: staff-only, all verbs. `song_requests`: student own, teacher all.

### Spotify enrichment flow

`app/api/spotify/sync/route.ts` (+ `/stream`) walks non-deleted songs, searches Spotify, scores
candidates; confidence routing: **≥ 85** auto-applies onto `songs` (spotify_link_url, cover,
duration), **20–84** inserts a `pending` row in `spotify_matches` for review via the
`/api/spotify/matches/{approve,reject,action,count}` routes, **< 20** is skipped. OAuth + debug
surfaces live at `app/dashboard/admin/spotify-{connect,import}` (URL-only).

The client (`lib/spotify.ts`) is hardened: 30s per-request timeout, exponential backoff
1s→32s (up to 3 attempts on 5xx), 429 honors `Retry-After`, 401 invalidates the in-memory
token cache and retries once, and a circuit breaker opens after 5 consecutive failures
(auto-resets after 60s). Helpers: `resetCircuitBreaker()`, `clearTokenCache()`.

## UI surfaces

| Surface                                                           | Route                                                                                | State                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Songs list (filters, search, sort)                                | `/dashboard/songs` → `components/songs/editorial/SongsListEditorial`                 | **mounted** (teacher nav "Songs", student nav "My Songs" — RLS scopes rows)         |
| Song detail (hero, chords, usage/learners/related sidebar)        | `/dashboard/songs/[id]` → `SongDetailEditorial`                                      | **mounted** — but left column includes static `ComingSoonCard` (see Open questions) |
| Song create / edit (scalar fields)                                | `/dashboard/songs/new`, `/dashboard/songs/[id]/edit`                                 | **mounted**, staff-gated                                                            |
| Student repertoire (read + own notes/difficulty/self-rating edit) | `/dashboard/repertoire` → `components/repertoire/editorial/`                         | **nav-hidden**                                                                      |
| Teacher per-student repertoire management                         | student profile surface (add/remove/status override)                                 | **mounted** via student detail                                                      |
| Songs analytics / chord analysis                                  | `/dashboard/songs/analytics` (stub "Coming soon"), `/dashboard/songs/chord-analysis` | stub / URL-only (admin stats: doc 10)                                               |
| Spotify admin (connect, import debug)                             | `/dashboard/admin/spotify-*`                                                         | URL-only                                                                            |
| Song requests, Song of the Week                                   | —                                                                                    | **unbuilt** (actions exist, nothing mounts them)                                    |

## Gaps & planned work

Scope frame (grill 2026-07-18): **no v1 gaps in this domain** — the trust pass's only v1 gap in
docs 03–05 is PRA-1 (doc 04). Everything below is **v1.1 — do not build before real usage data
exists**.

### SNG-1 · Song requests surface (v1.1)

Concept: student "request a song" form + teacher review queue (journey B3.4). Schema and action
layer (`app/actions/song-requests.ts`) are complete and RLS-tested at the policy level; the whole
gap is UI (entry point on the student songs list, review list for the teacher, approve→create-song
handoff filling `song_id`). Open design questions: does approval auto-create the song and add it
to the requester's repertoire, or just acknowledge? Notification on decision (doc 07 type exists?).

### SNG-2 · Song of the Week resurfacing (v1.1)

Concept: teacher picks one song/week with a message; students see it on their dashboard. Actions
(`app/actions/song-of-the-week.ts`) already deactivate the previous pick and push the song into
active students' repertoires; the dashboard card that consumed them died in the July 2026
dead-component purge. Gap is a single dashboard card + a teacher picker. Open question: SOTW vs
assignments overlap — is this a lightweight broadcast assignment, and should it write one?

### SNG-3 · Spotify match review UI (v1.1)

Concept: admin queue over `spotify_matches` (pending rows, confidence + AI reasoning,
approve/reject). API routes are complete (`app/api/spotify/matches/*`); gap is a page consuming
them. Until built, the sync's auto-apply path is the only effective outcome; pending rows just
accumulate. Open question: is manual review worth a surface at 1-teacher scale, or should the
auto-apply threshold simply be lowered and this table retired?

### SNG-4 · Song sections write path (v1.1)

Concept: structured sections (chords/lyrics/tab per verse/chorus…) replacing the freeform
`chords` + `lyrics_with_chords` columns; today advertised only by the static `ComingSoonCard`.
Schema is ready (`song_sections` + RLS). Open design questions: authoring UX (form vs
markdown-ish DSL), migration of existing freeform data, whether the student view needs sections
at all before real demand exists.

### SNG-5 · Drop `student_song_progress` (v1.1 housekeeping)

The table is deprecated, reader-less, and its data was migrated in `20260222000000`. Blocked
until PRA-1 (doc 04) removes the last dangling reference (the broken undo trigger). Then: one
migration dropping the table + its enum-coupled triggers; regenerate `types/database.types*`.

## Test plan

Journey catalog: `reference/E2E_JOURNEYS.md` §A3 (teacher songs), §B3 (student songs read-only),
§B7 (repertoire).

- **E2E (exist)**: `tests/e2e/teacher/` songs CRUD (A3.1); `tests/e2e/student/songs-read.spec.ts`
  (B3.1–B3.3: no create/edit controls, search + resource links);
  `tests/e2e/student/repertoire.spec.ts` (B7.1 view own, B7.2 self-rating edit, B7.3 no
  add/remove controls); `tests/e2e/cross-role/rls-data-isolation.spec.ts` (students can't read
  each other's repertoire).
- **E2E (missing, tied to gaps)**: B3.4 song request (SNG-1), A3.3 Spotify import (SNG-3),
  A6.4/A6.5 teacher repertoire management journeys.
- **Unit/integration**: chord parser + `upperCaseChordRoots` normalization; import-csv dedupe via
  `find_similar_songs`; RLS suites for `songs` / `student_repertoire` policies; status-cascade
  integration (lesson_songs insert → repertoire row + history row; forward-only guard; teacher
  override regression writes history).

## Open questions

- **Code↔schema mismatch (broken routes)**: `app/api/song/favorites` and
  `app/api/song/admin-favorites` query a `user_favorites` table that does not exist in the
  62-table baseline — the routes fail at runtime. Create a migration or delete the feature.
- **Search bypasses `search_vector`**: `lib/services/songs-list-queries.ts` filters with
  ILIKE; the generated tsvector column has no reader. Switch to
  `textSearch('search_vector', …)` or accept ILIKE at this catalog size.
- **ComingSoonCard honesty**: the student-visible song detail advertises Tablature / Sections /
  "Assign as homework" as coming. The trust pass forbids placeholder features on student surfaces
  — remove the card, or reword to teacher-only? (Cheap; decide at cutover review.)
- `songs.priority_bucket` check constraint hardcodes `'may'`/`'june'` buckets — content-pipeline
  smell (doc 09); rename to neutral values when that domain is touched.
- `slow_tempo` in `lesson_song_status` is unreachable and unmapped — retire with SNG-5 or keep as
  historical data value?
- Matviews have no readers: wire them into admin stats (doc 10) or drop them from the baseline?

## References

- DDL: `supabase/baseline/cloud_schema_2026-06-22.sql` (tables above; functions
  `fn_sync_lesson_song_to_repertoire`, `fn_record_progress_history`, `track_song_status_changes`,
  `soft_delete_song_with_cascade`, `find_similar_songs`, `refresh_song_engagement`)
- Actions: `app/actions/{songs,song-edit,song-form,repertoire,self-rating,song-requests,song-of-the-week,import-csv-songs}.ts`
- API: `app/api/song/`, `app/api/spotify/`, `app/api/student/song-status-history/`
- UI: `components/songs/editorial/`, `components/repertoire/editorial/`
- Superseded: `docs/specs/01-songs.md` (deleted 2026-07-18; git history), `docs/specs/05-repertoire-practice.md` (deleted 2026-07-18; git history) (repertoire half)
- Domain language: `CONTEXT.md` (Song Progress two-path model) · RLS: `docs/app-blueprint/reference/ARCHITECTURE.md`

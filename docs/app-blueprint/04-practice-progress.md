---
created: 2026-07-18
updated: 2026-07-18
domain: Practice & Progress
tables: [practice_sessions]
maturity: partial
---

# Practice & Progress

## Purpose

The student-centric time series of the core loop: a student logs practice sessions (duration,
optional song, optional BPM, notes), sees their history, and may undo a session **only on the day
it was logged** (decision D-08: sessions are otherwise immutable — no edit, delete + re-log). The
sessions feed denormalized aggregates on `student_repertoire` (doc 03) and the student dashboard's
weekly activity chart. Stats pages and gamification are v1.1 territory.

> **Verification note (2026-07-18)**: superseded spec 05 claimed "practice log read + same-day
> undo UI is entirely unbuilt". That is **stale** — the route, actions
> (`getPracticeSessions` / `deletePracticeSession`), same-day RLS policy, and E2E coverage all
> shipped after 2026-06-16. The surviving v1 gap is on the **database side** (PRA-1 below).

## Data model

One table. DDL: `supabase/baseline/cloud_schema_2026-06-22.sql`.

- `practice_sessions`: `student_id`, optional `song_id`, `duration_minutes` (CHECK 1–480),
  optional `bpm_practiced` (smallint, CHECK 20–300 — the tempo-ladder hook, added
  `20260619200000`), `notes`, `created_at`/`updated_at`. No `logged_at` column — the same-day
  boundary keys off `created_at::date` in server time.
- Denormalized mirrors on `student_repertoire`: `total_practice_minutes`,
  `practice_session_count`, `last_practiced_at` (doc 03). These are **write-through aggregates**,
  not computed views — keeping them honest is exactly what PRA-1 repairs.

## Behavior & rules

### Logging

`logPracticeSession` (`app/actions/practice.ts`): test-account guard → auth → Zod
(`schemas/PracticeSessionSchema.ts`) → insert as `auth.uid()`. RLS
`practice_sessions_insert_own` is the boundary. `song_id = NULL` (general technique practice) is
valid and renders without a song label. BPM input appears in the form only when a song is
selected.

### Reading

`getPracticeSessions(studentId?)`: students read their own rows
(`practice_sessions_select_own`); staff may pass a `studentId`
(`Admins can view all practice sessions` + staff select policy); parents via
`practice_sessions_select_parent` (parent UX unbuilt). Each row carries
`canUndo = logged today` (app-computed, display-only — RLS is the authority). Latest 50, newest
first.

### Same-day undo (D-08)

`deletePracticeSession(id)` issues a plain delete; RLS `practice_sessions_delete_own_today`
(`student_id = auth.uid() AND created_at::date = CURRENT_DATE`) is the sole authority. A next-day
attempt matches 0 rows and the action returns "Sessions can only be undone the same day" — not a 500. A session logged 23:59 becomes immutable at 00:00 server time. No update path is exposed in
the app (but see Open questions: a permissive `update_own` RLS policy exists in the baseline).

### Aggregate maintenance — broken in the baseline (PRA-1)

Intended design (archived migration `20260322000000`): AFTER INSERT trigger
`tr_practice_sessions_aggregate` increments the matching `student_repertoire` row; AFTER DELETE
trigger reverses it. Reality in the baseline (the recreation authority, verified vs live prod):

1. **The AFTER INSERT aggregation trigger is absent.** Logging practice never updates
   `student_repertoire.total_practice_minutes` / `practice_session_count` / `last_practiced_at`.
2. **The AFTER DELETE trigger is present but broken**: `reverse_song_progress_from_practice`
   targets the **deprecated** `student_song_progress` table using column
   `total_practice_minutes`, which does not exist there (it is `total_practice_time_minutes`) —
   so undoing any **song-linked** session raises `42703` and the delete fails. Existing E2E
   passes only because its test sessions have `song_id = NULL`, which skips the trigger body.

### Downstream reader

`app/actions/student/dashboard.ts` computes the student dashboard's weekly practice-minutes
chart directly from `practice_sessions` (Mon–Sun) — unaffected by the broken aggregates.

## UI surfaces

| Surface                                                                                              | Route                                                                                                                    | State                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Practice page: history list + log form (duration presets, song picker, BPM, notes) + same-day Remove | `/dashboard/practice` → `components/practice/editorial/` (`PracticeEditorial`, `PracticeHistoryList`, `PracticeLogForm`) | routed, **no nav entry anywhere** (not in `menuConfig.ts` at all, not linked from the student dashboard) — URL-only |
| Student stats ("My Stats")                                                                           | `/dashboard/stats`                                                                                                       | **stub** ("Coming soon"); nav-hidden (`my-stats` in `CORE_LOOP_HIDDEN_ITEMS`)                                       |
| Weekly practice chart                                                                                | student dashboard (`components/dashboard/editorial/student/`)                                                            | **mounted**                                                                                                         |
| Teacher view of a student's sessions                                                                 | — (`getPracticeSessions(studentId)` supports it)                                                                         | **unbuilt** (journey A7.1)                                                                                          |

## Gaps & planned work

### PRA-1 · Repair the practice→repertoire metric triggers — **HARD LAUNCH GATE** (runbook gate 9, grill 2026-07-18)

**Problem** (verified against the baseline, see Behavior above): logging never increments the
repertoire aggregates, and same-day undo of a song-linked session fails outright with a trigger
error against the deprecated table.

**Agent brief** (self-contained):

- **Reproduce**: on a baseline-restored DB, insert a `practice_sessions` row with a `song_id` in
  the student's repertoire → repertoire row unchanged. Delete that row same-day →
  `column "total_practice_minutes" of relation "student_song_progress" does not exist`.
- **Files**: new migration `supabase/migrations/<ts>_fix_practice_metric_triggers.sql`; no app
  code changes (`app/actions/practice.ts` already assumes the triggers work).
- **Approach**:
  1. Recreate `fn_aggregate_practice_to_repertoire()` + `tr_practice_sessions_aggregate`
     (AFTER INSERT) exactly as archived migration `20260322000000` — increments
     `total_practice_minutes`/`practice_session_count`, GREATEST-bumps `last_practiced_at`,
     skips `song_id IS NULL`.
  2. `CREATE OR REPLACE reverse_song_progress_from_practice()` to target **`student_repertoire`**
     with correct column names; keep the recompute-`last_practiced_at`-from-remaining-rows
     semantics of `20260616010000`.
  3. Backfill: one UPDATE recomputing the three aggregate columns on `student_repertoire` from
     existing `practice_sessions` (they have drifted for as long as the insert trigger was
     missing).
  4. Apply to StrummyProd out-of-band per the launch runbook, and fold into the baseline on the
     next re-dump.
- **Acceptance tests**: integration (real Supabase) — log-with-song increments all three
  aggregates; same-day undo decrements and recomputes `last_practiced_at` (NULL when none
  remain); next-day delete rejected by RLS, aggregates untouched. Extend
  `tests/e2e/student/practice.spec.ts` B6.2 to undo a **song-linked** session (the current
  song-less variant masks the bug). Update the stale B6 rows in `reference/E2E_JOURNEYS.md`.

### PRA-2 · Tempo ladder (v1.1 — do not build before real usage data exists)

Concept: per-song BPM progression view — plot `bpm_practiced` over sessions against the song's
target `songs.tempo`, so a student sees themselves climbing toward full speed. Schema readiness:
complete (`bpm_practiced` logged with UI since `20260619200000`; target tempo on `songs`). Open
design questions: where it lives (song detail vs practice page), minimum sessions before showing
a trend, whether the teacher sets a per-student target distinct from `songs.tempo`.

### PRA-3 · Teacher practice review surface (v1.1)

Concept: read-only list of a student's sessions on the teacher's student profile (journey A7.1).
Action support already exists (`getPracticeSessions(studentId)` + staff RLS); gap is a mount
point. Short build once real students generate data worth reviewing.

### Gamification: streaks & achievements (aspirational — no schema, v1.1)

No tables exist and none should be designed yet. The student dashboard's former Streak/Activity
cards were placeholders and were deleted in the dead-component purge. Open design questions to
resolve **before** any schema work:

- **Streak definition**: consecutive calendar days with ≥1 session? ≥N minutes? Or lesson-week
  based (did you practice between lessons), which fits a weekly-lesson studio better than
  Duolingo-style daily streaks?
- **Timezone**: `created_at` is server-time; a student practicing at 23:30 local may land on the
  "wrong" day. Same problem as the undo boundary — decide once, apply to both.
- **Achievement taxonomy**: minutes milestones, songs mastered (already notified via
  `song_mastery_achievement`, doc 07), streak lengths? What's motivating vs noise for a 5-student
  studio?
- **Retro-award**: computed from history at read time (no table needed) vs persisted grants.

## Test plan

Journey catalog: `reference/E2E_JOURNEYS.md` §B6 (practice), §A7.1 (teacher read) — note the B6 rows
there still say ❌ and predate the shipped specs below; PRA-1's brief includes correcting them.

- **E2E (exist)**: `tests/e2e/student/practice.spec.ts` — B6.1 log, B6.2 same-day undo, B6.3 past
  sessions have no Remove, B6.4 page loads; `tests/e2e/student/practice-bpm.spec.ts` — BPM input
  hidden without song, appears with song, badge renders in history, admin page loads. (The bpm
  spec reuses "B7.x" test IDs, colliding with repertoire's B7 journey numbering — cosmetic,
  worth renaming in passing.)
- **E2E (missing)**: song-linked undo (added by PRA-1); B6.4-as-catalogued cross-student RLS read
  (covered today by `tests/e2e/cross-role/rls-data-isolation.spec.ts`).
- **Integration**: PRA-1 aggregate/undo suite (above); same-day RLS boundary
  (`practice_sessions_delete_own_today`) under the RLS jest config.
- **Unit**: `PracticeSessionSchema` validation bounds (duration 1–480, bpm 20–300);
  `isLoggedToday` day-boundary behavior.

## Open questions

- **Permissive UPDATE policy**: baseline carries `Students can update own practice sessions`
  (unconditional own-row UPDATE) though D-08 forbids edits and no app path updates sessions.
  Drop the policy (defense in depth) or leave it dormant?
- **Practice page discoverability**: the route has no nav entry and no dashboard link — students
  can only reach it by URL. Intentional until PRA-1 makes the loop trustworthy, but the unhide
  decision (nav item vs dashboard card CTA) is unrecorded.
- **Day-boundary timezone** for undo + future streaks: server date vs student-local date (one
  decision, two consumers — see PRA-2/gamification).

## References

- DDL: `supabase/baseline/cloud_schema_2026-06-22.sql` (`practice_sessions`,
  `reverse_song_progress_from_practice`); migrations `20260616010000_practice_delete_same_day`,
  `20260619200000_practice_sessions_bpm`, archived `20260322000000_practice_to_repertoire_trigger`
- Actions: `app/actions/practice.ts` · Schema: `schemas/PracticeSessionSchema.ts`
- UI: `app/dashboard/practice/page.tsx`, `components/practice/editorial/`,
  `app/actions/student/dashboard.ts` (weekly chart)
- Superseded: `docs/specs/05-repertoire-practice.md` (deleted 2026-07-18; git history) (practice half)
- Related: doc 03 (`student_repertoire` aggregates, deprecated `student_song_progress`), doc 07
  (mastery notification), `reference/E2E_JOURNEYS.md`

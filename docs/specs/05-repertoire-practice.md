---
created: 2026-06-16
updated: 2026-06-16
feature: Repertoire & Practice
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/03-songs-repertoire.md and 04-practice-progress.md.

# Spec 05 — Repertoire & Practice

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md) (esp. Song Progress two-path model). Depends on [Phase 0](./00-phase-0-restore-truth.md).

## Goal

Wire `/dashboard/repertoire` to real actions and build the net-new `/dashboard/practice` page, both rendering via editorial. A student sees their Repertoire (status/notes/practice stats), edits **own notes + difficulty only**, logs Practice sessions, and can **undo a session logged today** — never edit, never delete an older one. A teacher sees a student's Repertoire and edits **all fields**. RLS is the boundary; the action layer mirrors it. No third Song-Progress write path is introduced (`CONTEXT.md`).

## User stories (by role)

| Role    | Story                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Student | I see my Repertoire with current status, my notes, difficulty, and practice stats (`total_practice_minutes`, `last_practiced_at`).         |
| Student | I edit my own `student_notes` and `difficulty_rating` only — status and teacher fields are read-only for me.                               |
| Student | I log a Practice session (duration, optional song, notes) and see it in my history immediately.                                            |
| Student | I can undo (delete) a session **I logged today**; sessions from prior days are immutable and have no delete/edit affordance.               |
| Teacher | I open a student's Repertoire and edit any field, including a direct `current_status` override (the correction path — regression allowed). |

## Current state (verified 2026-06-16)

- `app/dashboard/repertoire/page.tsx` — **"Coming soon" stub**, not wired to any action.
- `app/dashboard/practice/` — **absent** (confirmed: directory does not exist). Net-new per MASTER_SPEC §2.5.
- `app/actions/repertoire.ts` — exists with: `getStudentRepertoireAction(studentId)`, `addSongToRepertoireAction`, `updateRepertoireEntryAction(repertoireId, input)`, `removeFromRepertoireAction`, `addSongToNextLessonAction`, `searchSongsForRepertoireAction`, `getStudentSongProgressAction`. (Names differ from MASTER_SPEC's `getRepertoire`/`updateRepertoireEntry` — reuse the `*Action` names; do not add aliases.)
- `app/actions/practice.ts` — exists with **only** `logPracticeSession(input)` (insert) and `getStudentRepertoireSongs()` (dropdown source). **No read of session history. No delete.**
- `student_repertoire` RLS (migration `20260222000000`): `sr_update_own_notes` (student, `student_id = auth.uid()`, no column restriction at the policy level — the action must constrain the payload to notes+difficulty) and `sr_update_admin_teacher` (`is_admin_or_teacher()`, all fields). Both exist.
- `practice_sessions` RLS (migration `022_rls_policies.sql`): select-own, insert-own, update-own, select-staff. **No DELETE policy exists** — same-day undo needs a new one.
- Schema (migration `012`): `practice_sessions` has `created_at` / `updated_at` only — **no `logged_at` or `date` column**. The same-day boundary keys off `created_at::date = current_date`.
- Trigger `tr_practice_sessions_update_progress` (`020_triggers.sql`) is **AFTER INSERT only** → `update_song_progress_from_practice` _increments_ `total_practice_minutes` / `practice_session_count` and bumps `last_practiced_at`. **No matching decrement on delete** — undo must reverse metrics (action-side or a new AFTER DELETE trigger).
- Cascade trigger `fn_sync_lesson_song_to_repertoire` (`20260222000001`) is forward-only (`v_new_idx > v_cur_idx`); the direct override path via `updateRepertoireEntryAction` permits regression. Both write `current_status` only via these two seams (CONTEXT.md).

## Editorial UI — current implementation (verified 2026-06-16)

There is **no `components/repertoire/editorial` or `components/practice/editorial` directory** and **no dedicated editorial repertoire page** — `/dashboard/repertoire` is still the "Coming soon" stub. Repertoire/practice surface in editorial today only as **read-only summaries** inside two unrelated editorial surfaces; nothing edits, logs, or undoes.

| Component                                                                                                        | Lines | Shows                                                                                                                                                                            | Data source                                                                                                                         | State                                       |
| ---------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `components/dashboard/editorial/student/StudentDashboardEditorial.tsx` (mounted at `app/dashboard/page.tsx:127`) | 263   | "Repertoire" card: top songs with `current_status` label + `totalPracticeMinutes` (per row). Practice "Streak"/"Activity" cards are **`ComingSoonBody` placeholders** (no data). | `getStudentTopSongs(studentId)` → `student_repertoire` (`current_status`, `total_practice_minutes`, ordered by `last_practiced_at`) | read-only; links to `/dashboard/songs/<id>` |
| `components/songs/editorial/SongSidebarEditorial.tsx` (used by `SongDetailEditorial.tsx`)                        | 192   | `LearnersCard`: per-learner `current_status` (StageStepper) + `totalPracticeMinutes`. `UsageCard`: `assignedTo` / `avgMastery` aggregates derived from repertoire statuses       | `getSongLearners(songId)` / usage stats → `student_repertoire` (`current_status`, `total_practice_minutes`, `last_practiced_at`)    | read-only; no edit affordance               |

The only non-v2 repertoire components are `components/repertoire/AssessmentComparison.tsx` and `components/repertoire/SelfRatingStars.tsx` — leaf display widgets, **not wired into any editorial page**.

**What's built**

- Two read-only editorial views of repertoire-derived data (student dashboard top-songs list; song-detail learners/usage), both sourced directly from `student_repertoire` via `lib/services/*-queries.ts` — no actions, no mutation.

**What's missing**

- **No editorial repertoire page** — `/dashboard/repertoire` is a stub; nothing mounts a repertoire editor or wires `getStudentRepertoireAction` / `updateRepertoireEntryAction`.
- **No practice page or route at all** — `app/dashboard/practice/` is absent (net-new); practice metrics appear only as `ComingSoonBody` placeholders on the student dashboard.
- **No log / undo / history UI in editorial** — `getPracticeSessions` and `deletePracticeSession` don't exist yet, so no surface reads session history or offers same-day undo.
- **v2 trees are still the only full UI**: `components/v2/repertoire/*` (`RepertoirePageClient`, `RepertoireList`, `RepertoireCard`, `AddSongSheet`, `SelfRating`) and `components/v2/practice/*` (`PracticeLogButton`, `PracticeLogForm`, `PracticeLogSheet`, `DurationPicker`, `SongPicker`) — these remain the only interactive repertoire/practice UI and are the trees to delete per DoD point 5.

**Gap to this spec's target behavior**

- **Role-scoped repertoire edit** is entirely unbuilt in editorial — today's editorial repertoire surfaces are read-only display; there is no student notes/difficulty edit, no teacher all-fields edit, no `updateRepertoireEntryAction` whitelist guard.
- **Practice log read + same-day undo** is entirely unbuilt — no practice route, no history read, no `canUndo` affordance; the same-day-undo / immutable-older-session model (D-08) has no UI and no `deletePracticeSession` action backing it.

## Data contract

### Repertoire

| Action                                             | Payload                                                                        | RLS enforced                                                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getStudentRepertoireAction(studentId)`            | → `{ data: StudentRepertoireWithSong[] }`                                      | `sr_select_own` (student → self) / `sr_select_admin_teacher` (staff → all). No app-side `WHERE`.                                                                                          |
| `updateRepertoireEntryAction(repertoireId, input)` | teacher: any field; student: `{ student_notes?, difficulty_rating? }` **only** | `sr_update_admin_teacher` vs `sr_update_own_notes`. Action must reject non-allowed keys for students _before_ the write (pre-write 403), since the policy alone does not column-restrict. |

Status override (`current_status`) flows **only** through `updateRepertoireEntryAction` (correction/regression path) or the cascade trigger (forward-only). Do **not** add a third write path.

### Practice

| Action                                      | Payload                                                                                                                                   | Policy                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getPracticeSessions(studentId?)` **(NEW)** | → `{ sessions: PracticeSessionWithSong[] }` (id, song, duration_minutes, notes, created_at, `canUndo: created_at::date === current_date`) | `practice_sessions_select_own` / `_select_staff`. Default `studentId` = caller for students.                                                                                                                                                                                                                                                       |
| `logPracticeSession(input)` (exists)        | `{ song_id?, duration_minutes, notes? }`                                                                                                  | `practice_sessions_insert_own`. Unchanged.                                                                                                                                                                                                                                                                                                         |
| `deletePracticeSession(id)` **(NEW)**       | → `{ success }` \| `{ error }`                                                                                                            | New RLS `practice_sessions_delete_own_today`: `USING (student_id = auth.uid() AND created_at::date = current_date)`. **Immutable + same-day undo (D-08)** — no update/edit path is exposed. Action also reverses the practice metrics (decrement minutes/count, recompute `last_practiced_at`) since the insert trigger has no delete counterpart. |

## Behavior & edge cases / failure modes

- **Student edits status?** Blocked. `updateRepertoireEntryAction` must whitelist `student_notes`+`difficulty_rating` for a student caller and 403 on any other key — `sr_update_own_notes` does not column-restrict, so the action is the guard.
- **Same-day boundary at day rollover.** Undo eligibility is `created_at::date = current_date` in the DB (server tz), not app-clock. A session logged at 23:59 is un-undoable at 00:00. The RLS clause is the authority; the action returns a clear "Sessions can only be undone the same day" on a next-day attempt (post-rollover delete returns 0 rows / RLS reject, not a 500).
- **Status override regression allowed vs trigger forward-only.** Teacher direct override may regress (`mastered → started`); the via-lesson cascade never regresses. Both recorded in `song_status_history` by the `AFTER UPDATE OF current_status` trigger. Spec must not "fix" the asymmetry — it is intentional (CONTEXT.md).
- **Delete metrics drift.** Deleting a session without reversing `total_practice_minutes` / `practice_session_count` / `last_practiced_at` corrupts stats. Undo must decrement and recompute `last_practiced_at` from the remaining sessions (or NULL if none).
- **Logging into a void today.** Pre-Phase-0 this logged with no visible history; now `getPracticeSessions` surfaces it. A session with `song_id = NULL` (general technique) is valid and must render without a song label.
- **No edit affordance.** UI shows undo only when `canUndo`; never an edit button (D-08: delete + re-log).

## Files to touch

- `app/dashboard/repertoire/page.tsx` — replace stub; mount editorial repertoire, wire `getStudentRepertoireAction` + `updateRepertoireEntryAction`.
- `app/dashboard/practice/page.tsx` — **net-new**; mount editorial practice list + log form + undo.
- `app/actions/practice.ts` — add `getPracticeSessions(studentId?)` and `deletePracticeSession(id)` (with metrics reversal).
- `app/actions/repertoire.ts` — add student-field whitelist guard inside `updateRepertoireEntryAction`.
- `supabase/migrations/<new>_practice_delete_same_day.sql` — `practice_sessions_delete_own_today` RLS + (optional) AFTER DELETE metrics-decrement trigger.
- `schemas/PracticeSessionSchema.ts` — add a delete-input / session-read type if needed.
- Render via `components/v2/practice/*` + `components/v2/repertoire/*` (promote to editorial).

## Acceptance criteria (test names)

- `repertoire.rls.test` — student edits own `student_notes`/`difficulty_rating` only; teacher edits all fields; non-allowed key from a student is rejected.
- `repertoire.status-override.test` — teacher direct override regresses (`mastered → started`) and writes `song_status_history`; via-lesson cascade never regresses.
- `practice-undo.same-day-pass.test` — session logged today → `deletePracticeSession` succeeds; metrics decremented; `last_practiced_at` recomputed.
- `practice-undo.next-day-reject.test` — session with `created_at::date < current_date` → delete rejected by RLS; metrics untouched; no edit path exposed.
- `practice-history.read.test` — `getPracticeSessions` returns own sessions with correct `canUndo`; null-song session renders.

## Definition of Done (5-point)

1. **Behavior** — repertoire wired + practice page live; student edits notes/difficulty, teacher edits all, log + same-day undo work end-to-end.
2. **No silent failure** — practice no longer logs into a void; `getPracticeSessions` reads live; delete metrics reversed.
3. **RLS-tested** — `student_repertoire` + `practice_sessions` (incl. the new `_delete_own_today` policy) under `jest.config.rls.ts`.
4. **Renders via editorial** — both routes mount `components/<domain>/editorial/*`; no `ui-version` cookie branch.
5. **v1/v2/v3 deleted** — remove `components/v2/repertoire/*` + `components/v2/practice/*` (+ any v1) once editorial soaks in preview (stage deletion, per §6 risk 1).

## Dependencies & out of scope

- **Depends on** Phase 0 (schema/migration truth, CI signal). RLS tests need a real Supabase instance.
- **Out of scope:** Song Progress write-path changes beyond the two existing seams; dropping the deprecated `student_song_progress` table (§3.5); the `slow_tempo` dead enum branch (CONTEXT.md); practice-session **edit** (explicitly excluded by D-08).

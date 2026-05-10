# Strummy — Unbreakable Core (P0/P1 must-pass scenarios)

_The contract from the 2026-05-10 grill. These scenarios must stay green. The
doc is the source of truth; `scripts/testing/check-unbreakable.cjs` walks it
and reports drift._

**Scope** (in priority order, accepted during the grill):

1. Teacher's lesson + student loop — the heartbeat.
2. Auth — the door.
3. Authorization, with shadow users + password creation as the spotlight.

Out of scope by explicit user direction:

- Student practice loop (C)
- Sync surface (D — Calendar / Spotify / Drive)
- AI features (E)

Status legend: ✅ covered (green test exists) · ⚠️ partial (some coverage,
gap noted in **Notes**) · ❌ missing (no test today).

---

## Section 1 — Authorization: shadow users + password creation

| ID                                       | Scenario                                                                                                          | Status | Test                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `authz:set-passwords-bearer-only`        | `/api/admin/set-passwords` rejects every non-Bearer caller and never echoes the plain password.                   | ✅     | `app/api/admin/set-passwords/route.unit.test.ts`                                                                   |
| `authz:link-shadow-role-gate`            | `/api/admin/link-shadow-user` returns 401 anon, 403 student, 200 teacher/admin.                                   | ✅     | `app/api/admin/link-shadow-user/route.unit.test.ts`                                                                |
| `authz:create-student-role-gate`         | `createStudentProfile` action: only teachers/admins succeed; students/anonymous get Unauthorized.                 | ✅     | `app/actions/__tests__/student-management.test.ts`                                                                 |
| `authz:fk-transfer-atomicity`            | `transfer_shadow_profile_references` either moves _all_ FK references or none.                                    | ❌     | _TODO: Supabase integration test_                                                                                  |
| `authz:link-idempotency`                 | A second call to link an already-linked or already-deleted shadow returns a clean 404, never 500 or partial data. | ⚠️     | `app/api/admin/link-shadow-user/route.unit.test.ts` (404 path covers it implicitly)                                |
| `authz:shadow-cannot-authenticate`       | A shadow placeholder email cannot complete sign-in (no `auth.users` row).                                         | ⚠️     | Postgres contract; no Strummy code path beyond signIn returning Invalid credentials                                |
| `authz:invite-email-auto-link-on-signup` | Sign-up with an email matching a shadow's `invite_email` auto-links to the existing profile.                      | ❌     | _TODO_                                                                                                             |
| `authz:shadow-email-never-leaks`         | No API ever returns a literal `shadow_<uuid>@placeholder.com` value; mask via `maskShadowEmail`.                  | ✅     | `app/api/users/route.unit.test.ts`, `app/api/profiles/route.unit.test.ts`, `app/api/users/[id]/route.unit.test.ts` |
| `authz:invite-email-uniqueness`          | Two shadows with the same `invite_email` are rejected at create time (or schema).                                 | ❌     | _TODO_                                                                                                             |

---

## Section 2 — Lesson notes (data-loss perimeter)

| ID                                | Scenario                                                                                                                                                           | Status | Test                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------- |
| `notes:no-silent-save-failure`    | The save action returns `{ error }` on every DB-error path; UI never reports success when the server failed.                                                       | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`         |
| `notes:no-optimistic-lie`         | Client-side: a failed save rolls the UI back to the last persisted state.                                                                                          | ❌     | _TODO (UI/Playwright)_                                        |
| `notes:long-text-accepted`        | A 5 000-character notes payload saves without truncation or 413/422.                                                                                               | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`         |
| `notes:auto-save-no-double-write` | Re-saving identical content is a no-op (no duplicate history rows, no extra writes).                                                                               | ❌     | _TODO_                                                        |
| `notes:partial-update-preserves`  | Updating songs on a lesson does not blank the notes column.                                                                                                        | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`         |
| `notes:no-cross-role-leak`        | A student fetching a lesson never sees teacher-private notes (if/when that distinction is added). Today: notes are visible to both — confirm via integration test. | ⚠️     | `app/api/__tests__/multi-role-visibility.integration.test.ts` |
| `notes:empty-is-valid`            | Saving empty notes succeeds and persists `''`/`null` cleanly.                                                                                                      | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`         |
| `notes:past-immutable-by-student` | A student calling the lesson-update action gets 403, even on their own past lesson.                                                                                | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`         |

---

## Section 3 — Repertoire (which songs each student is learning)

| ID                                                   | Scenario                                                                                                                                                               | Status | Test                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `repertoire:authz-split`                             | Teacher/admin can add/remove songs for any of their students; student can update only their own `self_rating` and `student_notes`; cross-student reads/writes blocked. | ⚠️     | student-self path covered by `app/actions/__tests__/self-rating.test.ts`; broader writes _TODO_               |
| `repertoire:no-silent-failure`                       | Add/remove/update returns `{ error }` on DB failure; UI never claims success.                                                                                          | ⚠️     | _partial via existing action tests_                                                                           |
| `repertoire:partial-update-preserves`                | Updating `priority` does not blank `capo_fret`, `preferred_key`, `custom_strumming`, `student_notes`, `teacher_notes`.                                                 | ✅     | `app/actions/__tests__/repertoire-partial-update.integration.test.ts`                                         |
| `repertoire:status-change-writes-history-atomically` | A status transition writes a `song_status_history` row in the same transaction as the update; history insert failure rolls the update back.                            | ❌     | _TODO (integration)_                                                                                          |
| `repertoire:no-duplicate-student-song`               | A second add of the same `(student_id, song_id)` either upserts or rejects — never creates a phantom row.                                                              | ✅     | `app/actions/__tests__/repertoire.integration.test.ts` ("returns friendly message on duplicate (code 23505)") |
| `repertoire:remove-preserves-history`                | Removing is soft (archive); past status transitions and practice sessions remain queryable.                                                                            | ❌     | _TODO_                                                                                                        |
| `repertoire:practice-counters-atomic`                | `total_practice_minutes`, `practice_session_count`, `last_practiced_at` move together when a session is logged.                                                        | ⚠️     | `app/actions/__tests__/practice.test.ts` (atomicity claim not explicitly asserted)                            |
| `repertoire:sort-order-persists`                     | Reordering does not drop or duplicate rows.                                                                                                                            | ❌     | _TODO_                                                                                                        |
| `repertoire:self-rating-owner-only`                  | Only the student themselves can write their `self_rating`.                                                                                                             | ✅     | `app/actions/__tests__/self-rating.test.ts`                                                                   |

---

## Section 4 — Lesson creation

| ID                                            | Scenario                                                                                                                               | Status | Test                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-lesson:authz`                         | Anonymous → 401; student → 403; teacher/admin → 200.                                                                                   | ✅     | `app/api/lessons/__tests__/route.integration.test.ts` (T1, T5)                                                                                |
| `create-lesson:zod-validates-required-fields` | `student_id` UUID, `scheduled_at` ISO datetime, `title` non-empty/defaulted; missing or malformed → 400.                               | ✅     | `schemas/__tests__/LessonSchema.unit.test.ts` (shape) + `app/api/lessons/__tests__/route.integration.test.ts` (T2, T3, T4 — route-level 400s) |
| `create-lesson:timezone-integrity`            | A lesson created at `2026-05-14 14:00 Europe/Warsaw` reads back as the same wall-clock time regardless of viewer browser TZ.           | ❌     | _TODO_                                                                                                                                        |
| `create-lesson:atomic-with-songs`             | Lesson + linked songs are created together or not at all. No phantom lesson with zero songs.                                           | ❌     | _TODO (integration)_                                                                                                                          |
| `create-lesson:idempotent-double-click`       | Submitting the same create twice doesn't yield two rows (mutation guard, dedupe key, or accepted with cleanup — pick one and lock it). | ❌     | _TODO_                                                                                                                                        |
| `create-lesson:update-doesnt-reattach-songs`  | A follow-up update (e.g. adding notes) does not re-run the song-attach logic and duplicate `lesson_songs` rows.                        | ✅     | `app/api/lessons/__tests__/notes.integration.test.ts`                                                                                         |
| `create-lesson:past-date-policy`              | Either backfilling is allowed and clearly flagged, or rejected with a clear error. The chosen behaviour is locked by a test.           | ❌     | _TODO (decide policy first)_                                                                                                                  |
| `create-lesson:gcal-dedup`                    | A manually-created lesson + a GCal-imported lesson at the same `scheduled_at` for the same student are deduplicated; manual wins.      | ⚠️     | `lib/services/__tests__/sync-conflict-resolver` family covers conflicts; explicit dedupe-on-create _TODO_                                     |
| `create-lesson:no-silent-repertoire-mutation` | Attaching a song to a lesson does not also add it to repertoire unless that's an explicit, tested feature.                             | ❌     | _TODO_                                                                                                                                        |
| `create-lesson:visible-to-assigned-student`   | The student sees the new lesson on next page-load — no stale role-cache, no stale RLS view.                                            | ❌     | _TODO (E2E)_                                                                                                                                  |

---

## Section 5 — Auth flow

| ID                                        | Scenario                                                                                                                | Status | Test                                                                                                                                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth:signin-generic-error`               | Wrong password / non-existent email / locked / rate-limited / disposable all return generic errors with no enumeration. | ✅     | `app/auth/__tests__/actions.test.ts` ("Invalid email or password" — no enumeration on wrong-password vs no-such-user)                                                                                |
| `auth:signup-atomic`                      | `auth.users` + `profiles` row created together; partial creation rolls back.                                            | ❌     | _TODO (integration)_                                                                                                                                                                                 |
| `auth:account-lockout`                    | After N failed attempts the account is locked; further sign-ins return the locked error.                                | ✅     | `lib/auth/__tests__/account-lockout.test.ts`                                                                                                                                                         |
| `auth:rate-limiting`                      | Per-(email × IP) rate-limit short-circuits before any password check.                                                   | ✅     | `lib/auth/__tests__/rate-limiter.test.ts`                                                                                                                                                            |
| `auth:password-reset-flow`                | Reset request always returns success (no enumeration); link is single-use; new password works.                          | ⚠️     | action tested in `app/auth/__tests__/actions.test.ts`; single-use + sign-in-after Playwright _TODO_                                                                                                  |
| `auth:mfa-bypass-impossible`              | A pre-MFA session calling a protected action gets 401.                                                                  | ⚠️     | `app/actions/__tests__/mfa.test.ts` covers enrollment; bypass-attempt path _TODO_                                                                                                                    |
| `auth:signout-invalidates-session`        | A protected action after sign-out returns 401 with the same browser cookie.                                             | ❌     | _TODO_                                                                                                                                                                                               |
| `auth:oauth-state-validation`             | OAuth callback rejects requests with missing, mismatched, or tampered `state`.                                          | ✅     | `app/auth/__tests__/callback.test.ts` — `state` is delegated to Supabase PKCE inside `exchangeCodeForSession`; the application-layer "missing code" + external-redirect prevention paths are covered |
| `auth:session-refresh-no-role-escalation` | Refreshing a student session never returns admin/teacher claims.                                                        | ❌     | _TODO_                                                                                                                                                                                               |

---

## Roll-up

- **45 P0/P1 scenarios** across the three sections.
- **Today: ~10 ✅ · ~9 ⚠️ · ~26 ❌.**
- The ⚠️ rows are the cheapest wins next — each needs a single-line assertion added to an existing test file.
- The ❌ rows fall into three buckets: schema/integration tests (FK transfer atomicity, signup atomicity, status-history atomicity), unit tests against existing actions (notes, partial-update preservation), and Playwright (visibility, password-reset-after-link, signout invalidation).

Run `node scripts/testing/check-unbreakable.cjs` for a current status print-out. The script is report-only by design — it surfaces drift but does not block CI until the ❌ count is materially lower.

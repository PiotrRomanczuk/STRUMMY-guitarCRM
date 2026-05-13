# Strummy

Student-management context for guitar teachers: profiles, lessons, songs, assignments. One bounded context, one repo.

## Language

**Profile**:
The application-level user record on the `profiles` table. Extends a Supabase auth user with role flags, contact info, and onboarding state. Every authenticated user has exactly one Profile; the absence of a Profile for an authed user is a 403, not a 404.
_Avoid_: User (ambiguous with `auth.users`), Account.

**Role**:
A category of _what someone is in the product_. Exactly three: **Admin**, **Teacher**, **Student**. Stored as boolean columns (`is_admin`, `is_teacher`, `is_student`) on Profile, surfaced as a `roles` bag (`isAdmin | isTeacher | isStudent`) by the auth loader. A Profile may have more than one Role (a Teacher is often also an Admin).
_Avoid_: "permission," "user type."

**Flag**:
A boolean property on Profile that is **not** a Role. Currently: `isParent`, `isDevelopment`. Flags do not gate route access via `requiredRole`; they modify behavior (e.g. test-account guards skip mutations when `isDevelopment` is true). Kept separate from Role to avoid pretending all five booleans are interchangeable.
_Avoid_: treating Flags as Roles.

**Teaches**:
A Teacher _teaches_ a Student iff at least one non-deleted **Lesson** exists between them. This is the canonical definition of teacher-student membership and is materialized by the `teacher_students` Postgres view. Consequences (intentional, see ADR-0001 context):

- A Profile that has been created but never had a Lesson is not yet anyone's Student.
- A Student who has changed teachers retains historical Teaches relationships with prior Teachers.
  _Avoid_: defining membership through any other column or table.

**Visible Students**:
The set of Students a given Profile may see. Computed from Roles + Teaches:

- Admin → all Students
- Teacher → Students they Teach
- Student → just themselves
  This is what `StudentAccess.visibleStudentIds()` returns. Database queries do **not** apply this set as a `WHERE` clause — RLS does. The set exists to populate UI selectors and to produce pre-write 403s.

**StudentAccess**:
The single module that answers "who may this Profile see?" Two operations: `visibleStudentIds()` and `canView(studentId)`. There is no `scope(query)` operation — RLS does that (see ADR-0001).

**Repertoire**:
The set of songs a Student has ever worked on, stored in the `student_repertoire` table. Each row is a (student, song) pair and carries the student's lifetime-best **Progress Status** for that song, practice metrics, and self-rating. A Repertoire entry is created automatically by the cascade trigger the first time a song appears in a Lesson for that Student.
_Avoid_: "song list," "playlist," conflating Repertoire with a lesson's song list (`lesson_songs`).

**Progress Status**:
The ordered enum that describes how well a Student knows a song: `to_learn → started → remembered → with_author → mastered`. Defined once as the `song_progress_status` Postgres enum. The same type is used in both `lesson_songs.status` (lesson-scoped) and `student_repertoire.current_status` (lifetime best).
_Avoid_: "level," "difficulty" (a separate 1–5 numeric field), duplicating the enum as string literals in application code.

**Song Progress**:
The lifecycle of a Student's relationship with a single song. Two write paths exist deliberately:

- **Via Lesson** (normal path): Teacher sets `lesson_songs.status` → the cascade trigger `fn_sync_lesson_song_to_repertoire` advances `student_repertoire.current_status` forward-only, never regressing. This path absorbs accidental regressions in lesson context.
- **Direct override** (correction path): Teacher edits `student_repertoire.current_status` via `updateRepertoireEntryAction`. Regression is allowed here — music learning is non-linear and this is a deliberate correction mechanism.

Both paths are recorded in **Progress History** via the `AFTER UPDATE OF current_status` trigger on `student_repertoire`.
_Avoid_: a third write path; writing `student_repertoire.current_status` from API routes or cron jobs.

**Progress History**:
The append-only audit trail of Progress Status transitions for a Student × Song pair. Stored in `song_status_history` as `{ student_id, song_id, previous_status, new_status, changed_at }`. Written by an `AFTER UPDATE OF current_status` trigger on `student_repertoire` (SECURITY DEFINER), so it captures both the Via Lesson and Direct Override paths automatically. Read via `app/api/student/song-status-history/route.ts`.
_Avoid_: writing to `song_status_history` from application code (the trigger owns it); expecting `lesson_id` in history rows (A1 schema — to be extended to A2 later).

## Relationships

- A **Profile** has one or more **Roles** and zero or more **Flags**.
- A **Lesson** links exactly one Teacher Profile to exactly one Student Profile.
- A **Teaches** relationship between two Profiles is _derived_ from their non-deleted Lessons; it is not stored directly.
- **StudentAccess** is the only consumer that resolves Roles + Teaches into **Visible Students**.
- A **Repertoire** entry (Student × Song) is created automatically when a song first appears in a Lesson for that Student.
- **Song Progress** flows through two paths (Via Lesson and Direct Override) into a single `student_repertoire.current_status` column.
- **Progress History** is owned entirely by the database trigger layer — application code only reads it.

## Flagged ambiguities

- "User" is used in code to mean both the Supabase `auth.users` row and the **Profile**. Resolved here: when in doubt, the domain term is **Profile**. `User` only refers to the Supabase auth row (returned by `auth.getUser()`).
- "Role" was previously stretched to cover `is_parent` and `is_development`. Resolved: those are **Flags**, not Roles.
- `getTeacherStudentIds` was implemented twice (`lib/queries/teacher-students.ts` against the view, `app/api/lessons/handlers.ts` against the `lessons` table). Resolved: the view is canonical; the second copy is being removed as part of `StudentAccess` extraction.
- `slow_tempo` exists in the `song_progress_status` DB enum (migration `20260327170000`) but is absent from all Zod schemas and TypeScript types. Resolved: dead branch — to be removed in the next Song Progress migration.
- `song_status_history` was previously written by the deprecated `app/api/student/song-status/route.ts`. Resolved: that route is deleted; history is now owned exclusively by the `AFTER UPDATE OF current_status` trigger on `student_repertoire`.

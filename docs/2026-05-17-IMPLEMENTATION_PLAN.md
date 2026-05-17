# Strummy Dashboard Rebuild — Implementation Plan

**Date**: 2026-05-17
**Author**: Claude
**Scope**: Atomic, card-by-card rebuild of the dashboard stripped on 2026-05-17. Each step lands in one PR and is verified against all 3 roles before the next starts.
**Companion doc**: `docs/2026-05-17-REQUIREMENTS.md` — capability inventory & API surface (source of truth for what each step builds against)
**Status**: Living plan — update checkboxes as steps ship; bump `updated:` when reordering

---

## How to use this file

1. **One step = one PR.** Branch `feature/dash-NNN-slug`. No batching unless explicitly noted.
2. **Acceptance criteria are the contract.** If a step's AC can't be met without touching another step, stop and re-scope.
3. **Test gate before merge.** Every step ships with its named Playwright spec. The spec MUST run the 3-role check and pass. Existing `tests/e2e/auth/role-login.spec.ts` MUST stay green throughout.
4. **Re-use the existing backend.** Every step lists the API/server-action it consumes. Do not introduce new backend code unless a step explicitly says "BACKEND".
5. **File-size rules apply.** Components <200 LOC, hooks <150 LOC, functions <50 LOC. No `any`.
6. **Definition of done per step**:
   - Code merged
   - 3-role spec green
   - `npm run lint` clean for touched files
   - `tests/e2e/auth/role-login.spec.ts` still green
   - Checkbox flipped here

### Step template

Each step has this shape:

```
### DASH-NNN — <Title> <(role tag)>
**Phase**: <phase>  ·  **Estimate**: <S/M/L>  ·  **Depends on**: DASH-XXX
**Roles**: admin / teacher / student (✓ visible, ✗ hidden, ✦ partial)

- Builds: <component path>, mounted at <route>
- Reads: <API endpoint(s) or server action(s) from 2026-05-17-REQUIREMENTS.md>
- Writes: <if any>
- External deps: <Supabase / Google / Spotify / AI / none>

**Acceptance**
- AC1 ...
- AC2 ...

**Test** — `tests/e2e/dashboard/<slug>.spec.ts`
- admin: ...
- teacher: ...
- student: ...
```

Size tags: **S** = ≤150 LOC, **M** = 150-400 LOC, **L** = 400+ LOC (split if you can).

---

## Phase 0 — Foundation (mostly done)

### DASH-001 — Welcome card with role indicator ✅ DONE

**Phase**: 0 · **Estimate**: S · **Status**: shipped 2026-05-17

Shipped in the dashboard strip commit. Root `/dashboard` shows email + role line.

**Test** — extend `tests/e2e/auth/role-login.spec.ts` (in place).

- admin: sees "Role: Admin" (or combined chain)
- teacher: sees "Role: Teacher"
- student: sees "Role: Student"

- [x] DASH-001

---

## Phase 1 — Shell & navigation

### DASH-002 — Sidebar shell with role-filtered links

**Phase**: 1 · **Estimate**: M · **Depends on**: DASH-001
**Roles**: admin ✓ · teacher ✓ · student ✓ (different link sets)

- Builds: `components/dashboard/Sidebar/*`, used by `app/dashboard/layout.tsx`
- Reads: `getUserWithRolesSSR()` for flags
- Writes: nothing
- External deps: none

**Acceptance**

- AC1 Sidebar mounts on every `/dashboard/*` route via layout
- AC2 Links filter by role: admin sees all; teacher sees students/lessons/songs/assignments/settings; student sees lessons/songs/practice/assignments/settings
- AC3 Active link highlighted on current path
- AC4 Collapsible on desktop, sheet on mobile (Tailwind `md:` breakpoint)

**Test** — `tests/e2e/dashboard/sidebar.spec.ts`

- admin: sees Users, Songs, Lessons, Students, AI, Health, Settings nav items
- teacher: sees Students, Lessons, Songs, Assignments, Settings (no Users, no Health)
- student: sees Lessons, Songs, Practice, Assignments, Settings (no Students)

- [x] DASH-002

### DASH-003 — Top bar (user menu, role switcher, sign-out)

**Phase**: 1 · **Estimate**: S · **Depends on**: DASH-002
**Roles**: admin ✓ · teacher ✓ · student ✓

- Builds: `components/dashboard/Topbar/*`
- Reads: `getUserWithRolesSSR()`; reuses existing `components/dashboard/RoleSwitcher`
- Writes: sign-out invalidates session

**Acceptance**

- AC1 Avatar + display name; menu items: Profile, Sign out
- AC2 RoleSwitcher visible only when `hasMultipleRoles`
- AC3 Sign out clears Supabase session and redirects to `/sign-in`

**Test** — `tests/e2e/dashboard/topbar.spec.ts`

- admin (also teacher in dev): RoleSwitcher visible, can flip between views
- teacher (single role): no RoleSwitcher
- student (single role): no RoleSwitcher, sign-out works

- [x] DASH-003

### DASH-004 — Loading, empty, and error boundary primitives

**Phase**: 1 · **Estimate**: S · **Depends on**: —
**Roles**: shared infra (all roles benefit)

- Builds: `components/dashboard/states/{Loading,Empty,ErrorState}.tsx`; `app/dashboard/error.tsx` + `loading.tsx` reuse them
- Reads: nothing
- Writes: nothing

**Acceptance**

- AC1 Loading: skeleton card matching Card dimensions
- AC2 Empty: icon + title + optional CTA button slot
- AC3 ErrorState: error message + retry callback
- AC4 All three documented in Storybook-equivalent example file under `components/dashboard/states/examples.tsx` (not required)

**Test** — `tests/e2e/dashboard/states.spec.ts`

- any role: navigate to a route that throws → ErrorState renders, retry button visible
- any role: navigate to a route with no data → Empty state visible

- [x] DASH-004

---

## Phase 2 — Teacher daily workflow (biggest value)

### DASH-005 — Today's lessons card (teacher)

**Phase**: 2 · **Estimate**: S · **Depends on**: DASH-002, DASH-004
**Roles**: admin ✦ (via teacher view) · teacher ✓ · student ✗

- Builds: `components/dashboard/cards/TodayLessons.tsx`, mounted on `/dashboard` for teacher view
- Reads: `GET /api/teacher/lessons` (filter today, status SCHEDULED+IN_PROGRESS)

**Acceptance**

- AC1 Card lists today's lessons, sorted by `scheduled_at`
- AC2 Each row: student name, time, status badge, link to `/dashboard/lessons/[id]`
- AC3 Empty: "No lessons today"
- AC4 Loading: skeleton

**Test** — `tests/e2e/dashboard/today-lessons.spec.ts`

- admin: sees card via teacher view if multi-role; otherwise no card
- teacher: sees card with seeded today's lessons
- student: card not visible on `/dashboard`

- [x] DASH-005

### DASH-006 — Upcoming lessons (next 7 days) card (teacher)

**Phase**: 2 · **Estimate**: S · **Depends on**: DASH-005

- Builds: `components/dashboard/cards/UpcomingLessons.tsx`
- Reads: `GET /api/lessons/schedule?from=tomorrow&to=+7d`

**Acceptance**

- AC1 Group by day; today excluded
- AC2 Each lesson row: same shape as DASH-005
- AC3 Empty: "Nothing scheduled this week"

**Test** — `tests/e2e/dashboard/upcoming-lessons.spec.ts`

- admin: via teacher view
- teacher: 7-day grouping visible
- student: not visible

- [ ] DASH-006

### DASH-007 — Lesson detail page (read-only)

**Phase**: 2 · **Estimate**: M · **Depends on**: DASH-005
**Roles**: admin ✓ · teacher ✓ (own students) · student ✓ (own only)

- Builds: `app/dashboard/lessons/[id]/page.tsx`
- Reads: `GET /api/lessons/:id`, `GET /api/lessons/:id/songs`

**Acceptance**

- AC1 Header: student name, scheduled_at, status, lesson_teacher_number
- AC2 Songs list with `lesson_song_status` badges
- AC3 Notes section (read-only for now)
- AC4 RLS enforced: student sees only own, teacher sees own taught, admin all

**Test** — `tests/e2e/dashboard/lesson-detail.spec.ts`

- admin: opens any lesson detail
- teacher: opens own student's lesson; navigating to another teacher's lesson → 403/404
- student: opens own lesson; other students' lesson → 403/404

- [ ] DASH-007

### DASH-008 — Lesson live mode (in-lesson status updates)

**Phase**: 2 · **Estimate**: M · **Depends on**: DASH-007
**Roles**: admin ✦ · teacher ✓ · student ✗

- Builds: `app/dashboard/lessons/[id]/live/page.tsx`
- Reads/Writes: `app/actions/songs.ts::updateLessonSongStatus`

**Acceptance**

- AC1 Big-button UI for per-song status cycle (to_learn → started → remembered → with_author → mastered)
- AC2 Optimistic update, server reconcile
- AC3 Complete-lesson button transitions lesson to COMPLETED

**Test** — `tests/e2e/dashboard/lesson-live.spec.ts`

- teacher: cycles song status, completes lesson
- admin: same flow works
- student: route returns 403 / redirect

- [ ] DASH-008

### DASH-009 — Create lesson form

**Phase**: 2 · **Estimate**: M · **Depends on**: DASH-007
**Roles**: admin ✓ · teacher ✓ · student ✗

- Builds: `app/dashboard/lessons/new/page.tsx`
- Writes: `POST /api/lessons` (or `app/actions/lessons.ts::createLesson`)

**Acceptance**

- AC1 Form: student picker, datetime, optional songs
- AC2 Zod validation via `schemas/LessonSchema.ts`
- AC3 On success → redirect to lesson detail

**Test** — `tests/e2e/dashboard/lesson-create.spec.ts`

- admin / teacher: create lesson, verify in list
- student: route 403

- [ ] DASH-009

### DASH-010 — Reschedule + cancel lesson

**Phase**: 2 · **Estimate**: S · **Depends on**: DASH-007

- Builds: reschedule dialog + cancel button on lesson detail
- Writes: `app/actions/lessons.ts::{rescheduleLesson, updateLesson}`

**Acceptance**

- AC1 Reschedule writes `audit_log` entry
- AC2 Cancel transitions to CANCELLED with confirmation
- AC3 Both unavailable for student

**Test** — `tests/e2e/dashboard/lesson-reschedule.spec.ts`

- teacher: reschedules + cancels
- admin: same
- student: buttons not rendered

- [ ] DASH-010

### DASH-011 — Lesson notes editor (no AI)

**Phase**: 2 · **Estimate**: M · **Depends on**: DASH-007

- Builds: rich text or markdown editor block on lesson detail
- Writes: `app/actions/lessons.ts::updateLessonNotes`

**Acceptance**

- AC1 Autosave with debounce (2s)
- AC2 Toolbar minimal: bold/italic/list/heading
- AC3 Read-only view for student

**Test** — `tests/e2e/dashboard/lesson-notes.spec.ts`

- teacher: edits + autosaves
- admin: same
- student: notes visible read-only

- [ ] DASH-011

### DASH-012 — AI: lesson-notes assist

**Phase**: 2 · **Estimate**: M · **Depends on**: DASH-011
**External deps**: OpenRouter / Ollama

- Builds: "AI assist" button on notes editor
- Calls: `app/actions/ai.ts::generateLessonNotesStream`

**Acceptance**

- AC1 Streams suggestion into a side panel; teacher accepts/discards
- AC2 Rate-limited per `lib/ai/rate-limiter.ts`
- AC3 Logged to `ai_generations`

**Test** — `tests/e2e/dashboard/ai-lesson-notes.spec.ts`

- teacher: button visible, stream works (mock provider in test env)
- admin: same
- student: button not rendered

- [ ] DASH-012

### DASH-013 — AI: post-lesson summary

**Phase**: 2 · **Estimate**: S · **Depends on**: DASH-012

- Builds: "Generate summary" button on COMPLETED lesson
- Calls: `app/actions/ai.ts::generatePostLessonSummaryStream`

**Acceptance**

- AC1 Output saved as part of lesson notes
- AC2 Available only when status = COMPLETED

**Test** — `tests/e2e/dashboard/ai-post-lesson.spec.ts`

- teacher: visible only after complete, generates
- admin: same
- student: read-only view

- [ ] DASH-013

---

## Phase 3 — Student core

### DASH-014 — Next lesson card (student)

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-004
**Roles**: admin ✦ · teacher ✗ · student ✓

- Builds: `components/dashboard/cards/StudentNextLesson.tsx`
- Reads: `GET /api/student/lessons?next=1`

**Acceptance**

- AC1 Big card with next scheduled lesson date/time + teacher name
- AC2 Countdown ("in 2 days")
- AC3 Empty: "No upcoming lessons"

**Test** — `tests/e2e/dashboard/student-next-lesson.spec.ts`

- student: visible with next lesson
- teacher: card not visible
- admin: visible only via student-view switcher

- [ ] DASH-014

### DASH-015 — Repertoire list (student)

**Phase**: 3 · **Estimate**: M · **Depends on**: DASH-014

- Builds: `app/dashboard/repertoire/page.tsx`
- Reads: `app/actions/repertoire.ts::getStudentRepertoireAction`

**Acceptance**

- AC1 Table: song title, status, self-rating, started_at, last_practiced_at
- AC2 Filter by status, sort by recency
- AC3 Empty: "Add a song to get started"

**Test** — `tests/e2e/dashboard/repertoire-list.spec.ts`

- student: own repertoire
- teacher: route shows their students' repertoire selector (or 403 if dedicated student route)
- admin: full view

- [ ] DASH-015

### DASH-016 — Add to repertoire + remove

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-015

- Builds: "Add song" dialog with song search
- Writes: `app/actions/repertoire.ts::{addSongToRepertoireAction, removeFromRepertoireAction}`

**Acceptance**

- AC1 Search picker uses `searchSongsForRepertoireAction`
- AC2 Remove with confirm
- AC3 Optimistic update

**Test** — `tests/e2e/dashboard/repertoire-mutate.spec.ts`

- student: adds + removes
- teacher: can add on behalf of own student
- admin: same

- [ ] DASH-016

### DASH-017 — Self-rating

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-015

- Builds: 1-5 star rating control inline in repertoire row
- Writes: `app/actions/self-rating.ts::updateSelfRatingAction`

**Acceptance**

- AC1 Student can only rate own repertoire (server enforces)
- AC2 Optimistic

**Test** — `tests/e2e/dashboard/self-rating.spec.ts`

- student: rates own
- teacher: control hidden on own view (still visible reading student's rating)
- admin: read-only

- [ ] DASH-017

### DASH-018 — Practice log entry

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-015

- Builds: "Log practice" dialog: song picker, minutes, note
- Writes: `app/actions/practice.ts::logPracticeSession`

**Acceptance**

- AC1 Song picker pulls only songs in student repertoire
- AC2 Validates minutes > 0
- AC3 DB trigger updates `student_song_progress` totals — verified in spec

**Test** — `tests/e2e/dashboard/practice-log.spec.ts`

- student: logs 15 min, totals update
- teacher: can log on behalf of student (if UI exposes)
- admin: same

- [ ] DASH-018

### DASH-019 — Practice streak + weekly stats card

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-018

- Builds: `components/dashboard/cards/PracticeStreak.tsx`
- Reads: `GET /api/stats/weekly`

**Acceptance**

- AC1 Shows current streak, this-week minutes, sessions
- AC2 Empty: "Log your first session"

**Test** — `tests/e2e/dashboard/practice-streak.spec.ts`

- student: streak visible
- teacher: not in own view (shown in student-detail instead)
- admin: same as teacher

- [ ] DASH-019

### DASH-020 — Assignments list (student)

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-004

- Builds: `app/dashboard/assignments/page.tsx`
- Reads: `GET /api/assignments` (RLS scopes to own for student)

**Acceptance**

- AC1 Tabs: not_started / in_progress / completed / overdue
- AC2 Each row: title, due date, lesson link, status

**Test** — `tests/e2e/dashboard/assignments-list.spec.ts`

- student: sees own only
- teacher: sees all of own students
- admin: all

- [ ] DASH-020

### DASH-021 — Assignment status update (student)

**Phase**: 3 · **Estimate**: S · **Depends on**: DASH-020

- Builds: status dropdown on assignment row
- Writes: `app/actions/assignments.ts::updateAssignmentStatus`

**Acceptance**

- AC1 Student can transition not_started → in_progress → completed only
- AC2 Cannot reopen completed
- AC3 Server enforces transitions

**Test** — `tests/e2e/dashboard/assignment-status.spec.ts`

- student: valid transitions only
- teacher: full transitions including reopen
- admin: full

- [ ] DASH-021

---

## Phase 4 — Songs

### DASH-022 — Song catalog list + search

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-004
**Roles**: admin ✓ · teacher ✓ · student ✓ (read-only)

- Builds: `app/dashboard/songs/page.tsx`
- Reads: `GET /api/song/search?q=…` + `GET /api/song`

**Acceptance**

- AC1 Search debounced 300ms
- AC2 Filter: level, key, category
- AC3 Pagination or virtualized list

**Test** — `tests/e2e/dashboard/songs-list.spec.ts`

- admin / teacher: see Edit + Add buttons
- student: list-only, no mutation controls

- [ ] DASH-022

### DASH-023 — Song detail card

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-022

- Builds: `app/dashboard/songs/[id]/page.tsx`
- Reads: `GET /api/song/:id`, `GET /api/song/:id/videos`, `GET /api/song/:id/lessons`

**Acceptance**

- AC1 Tabs: Overview / Chords / Videos / Lessons-using-this-song
- AC2 Edit button visible to admin/teacher
- AC3 "Add to my repertoire" button for student

**Test** — `tests/e2e/dashboard/song-detail.spec.ts`

- admin: full
- teacher: full (own scope)
- student: read + add-to-repertoire only

- [ ] DASH-023

### DASH-024 — Song create (manual)

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-023

- Builds: `app/dashboard/songs/new/page.tsx`
- Writes: `POST /api/song/create`

**Acceptance**

- AC1 Form fields per `schemas/SongSchema.ts`
- AC2 Duplicate check via `songs.ts::checkSongDuplicate`
- AC3 On success → redirect to detail

**Test** — `tests/e2e/dashboard/song-create.spec.ts`

- admin / teacher: creates
- student: route 403

- [ ] DASH-024

### DASH-025 — Song from Spotify

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-024
**External deps**: Spotify Web API

- Builds: Spotify search + import flow on `/dashboard/songs/new`
- Calls: `GET /api/spotify/search`, `POST /api/song/from-spotify`

**Acceptance**

- AC1 Search Spotify, pick a track, preview metadata
- AC2 Import creates song with spotify_track_id, enrichment via AI normalization agent
- AC3 Handles Spotify 429 / circuit-open gracefully

**Test** — `tests/e2e/dashboard/song-from-spotify.spec.ts`

- admin / teacher: import with mocked Spotify
- student: not rendered

- [ ] DASH-025

### DASH-026 — Song CSV bulk import

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-024

- Builds: `app/dashboard/songs/import/page.tsx`
- Calls: `app/actions/import-csv-songs.ts::{importCsvSongs}` with validateOnly preview

**Acceptance**

- AC1 Upload CSV, preview detected rows with conflicts
- AC2 Confirm to write; conflicts logged to `sync_conflicts`
- AC3 Admin/teacher only

**Test** — `tests/e2e/dashboard/song-csv-import.spec.ts`

- admin / teacher: import small CSV
- student: 403

- [ ] DASH-026

### DASH-027 — Song of the Week (admin manage + student view)

**Phase**: 4 · **Estimate**: M · **Depends on**: DASH-023

- Builds: Admin manage UI on `/dashboard/admin/sotw`; student card on `/dashboard`
- Calls: `app/actions/song-of-the-week.ts::*`

**Acceptance**

- AC1 Admin sets/deactivates SOTW
- AC2 Student card shows current SOTW + "Add to my repertoire" → `addSotwToRepertoire`
- AC3 Teacher sees the card but no mutation

**Test** — `tests/e2e/dashboard/sotw.spec.ts`

- admin: sets + deactivates
- student: sees card, adds to repertoire
- teacher: sees card only

- [ ] DASH-027

---

## Phase 5 — Assignments (teacher side)

### DASH-028 — Assignment create from template

**Phase**: 5 · **Estimate**: M · **Depends on**: DASH-020
**Roles**: admin ✓ · teacher ✓ · student ✗

- Builds: `app/dashboard/assignments/new/page.tsx`
- Writes: `POST /api/assignments`, optionally `createAssignmentFromTemplate`

**Acceptance**

- AC1 Pick template OR write from scratch
- AC2 Pick student, due date
- AC3 On success → assignment detail

**Test** — `tests/e2e/dashboard/assignment-create.spec.ts`

- admin / teacher: create
- student: 403

- [ ] DASH-028

### DASH-029 — AI: assignment description generator

**Phase**: 5 · **Estimate**: S · **Depends on**: DASH-028
**External deps**: OpenRouter / Ollama

- Builds: "Generate" button on assignment form
- Calls: `app/actions/ai.ts::generateAssignmentStream`

**Acceptance**

- AC1 Streams description into the form field
- AC2 Rate-limited per agent

**Test** — `tests/e2e/dashboard/ai-assignment.spec.ts`

- admin / teacher: generates
- student: not rendered

- [ ] DASH-029

### DASH-030 — Assignment templates manage

**Phase**: 5 · **Estimate**: M · **Depends on**: DASH-028

- Builds: `app/dashboard/assignments/templates/*`
- Calls: `app/actions/assignment-templates.ts::*`

**Acceptance**

- AC1 CRUD templates
- AC2 Share toggle (own vs admin-published)

**Test** — `tests/e2e/dashboard/assignment-templates.spec.ts`

- admin / teacher: CRUD
- student: 403

- [ ] DASH-030

---

## Phase 6 — Students (teacher view)

### DASH-031 — My students list (teacher)

**Phase**: 6 · **Estimate**: M · **Depends on**: DASH-004
**Roles**: admin ✓ · teacher ✓ · student ✗

- Builds: `app/dashboard/students/page.tsx`
- Reads: `GET /api/teacher/students`

**Acceptance**

- AC1 Columns: name, status, last lesson, weekly minutes, needs-attention flag
- AC2 Sort + filter
- AC3 Click → student detail

**Test** — `tests/e2e/dashboard/students-list.spec.ts`

- admin / teacher: list visible
- student: 403

- [ ] DASH-031

### DASH-032 — Student detail page

**Phase**: 6 · **Estimate**: L · **Depends on**: DASH-031

- Builds: `app/dashboard/students/[id]/page.tsx`
- Reads: `GET /api/users/:id`, repertoire, progress, recent lessons, assignments

**Acceptance**

- AC1 Tabs: Overview / Repertoire / Lessons / Assignments / Practice
- AC2 Each tab uses existing query hooks; no new APIs
- AC3 Admin can see any; teacher only own

**Test** — `tests/e2e/dashboard/student-detail.spec.ts`

- admin: any student
- teacher: own student; another teacher's student → 403
- student: route 403 (or redirect to own dashboard)

- [ ] DASH-032

### DASH-033 — Needs-attention card

**Phase**: 6 · **Estimate**: S · **Depends on**: DASH-031

- Builds: `components/dashboard/cards/NeedsAttention.tsx`
- Reads: `GET /api/students/needs-attention`

**Acceptance**

- AC1 Shows top 5 students flagged (no recent practice, overdue assignments, missed lessons)
- AC2 Each row links to student detail

**Test** — `tests/e2e/dashboard/needs-attention.spec.ts`

- admin / teacher: card visible
- student: not visible

- [ ] DASH-033

### DASH-034 — Student progress export (CSV)

**Phase**: 6 · **Estimate**: S · **Depends on**: DASH-032

- Builds: "Export" button on student detail
- Reads: `GET /api/exports/student/:id` (already exists, 347 LOC)

**Acceptance**

- AC1 Downloads CSV with lessons/progress/practice
- AC2 Admin / teacher / student (own only) can export

**Test** — `tests/e2e/dashboard/student-export.spec.ts`

- admin: any student
- teacher: own students
- student: own only

- [ ] DASH-034

---

## Phase 7 — Admin operations

### DASH-035 — User pipeline (lead → active → churned)

**Phase**: 7 · **Estimate**: M · **Depends on**: DASH-004
**Roles**: admin ✓ only

- Builds: `app/dashboard/admin/pipeline/page.tsx`
- Reads: `GET /api/students/pipeline`

**Acceptance**

- AC1 Funnel view with counts per status
- AC2 Click bucket → list students in that bucket

**Test** — `tests/e2e/dashboard/admin-pipeline.spec.ts`

- admin: full view
- teacher / student: 403

- [ ] DASH-035

### DASH-036 — User management (invite + edit roles)

**Phase**: 7 · **Estimate**: L · **Depends on**: DASH-035

- Builds: `app/dashboard/admin/users/page.tsx` + invite dialog
- Reads/Writes: `GET/POST/PATCH /api/users`, `app/actions/admin/*`

**Acceptance**

- AC1 List all users with filters
- AC2 Invite by email (Gmail SMTP)
- AC3 Toggle role flags, deactivate, link shadow user

**Test** — `tests/e2e/dashboard/admin-users.spec.ts`

- admin: invite + edit roles
- teacher / student: 403

- [ ] DASH-036

### DASH-037 — Admin stats dashboard

**Phase**: 7 · **Estimate**: M · **Depends on**: DASH-004

- Builds: admin overview cards on `/dashboard?view=admin`
- Reads: `GET /api/lessons/stats/advanced`, `GET /api/song/stats/*`, `GET /api/cohorts/analytics`

**Acceptance**

- AC1 KPI tiles: total users, active students, lessons this month, songs added
- AC2 Charts: lessons/week, song engagement

**Test** — `tests/e2e/dashboard/admin-stats.spec.ts`

- admin: KPIs visible
- teacher / student: not visible

- [ ] DASH-037

### DASH-038 — Song requests review (admin)

**Phase**: 7 · **Estimate**: S · **Depends on**: DASH-036

- Builds: review queue on `/dashboard/admin/song-requests`
- Writes: `app/actions/song-requests.ts::reviewSongRequest`

**Acceptance**

- AC1 List pending requests
- AC2 Approve (→ create song) / reject with note

**Test** — `tests/e2e/dashboard/admin-song-requests.spec.ts`

- admin: approve + reject
- teacher: can review own students' (if RLS allows) — assert
- student: see own submitted requests (no review)

- [ ] DASH-038

### DASH-039 — Spotify match approvals (admin)

**Phase**: 7 · **Estimate**: M · **Depends on**: DASH-038
**External deps**: Spotify

- Builds: `app/dashboard/admin/spotify-matches/*`
- Reads/Writes: `GET /api/spotify/matches`, `/approve`, `/reject`, `/action`

**Acceptance**

- AC1 Queue of pending matches with confidence score
- AC2 Approve → updates song; reject → marks ignored
- AC3 Bulk approve high-confidence

**Test** — `tests/e2e/dashboard/admin-spotify-matches.spec.ts`

- admin: approve + reject
- teacher / student: 403

- [ ] DASH-039

### DASH-040 — System health card (admin)

**Phase**: 7 · **Estimate**: S · **Depends on**: DASH-037

- Builds: health panel on admin dashboard
- Reads: `GET /api/health`, `GET /api/database/status`

**Acceptance**

- AC1 Tiles: DB status, queue depth, integration tokens, cron last-run
- AC2 Refresh every 30s

**Test** — `tests/e2e/dashboard/admin-health.spec.ts`

- admin: card visible
- teacher / student: not visible

- [ ] DASH-040

---

## Phase 8 — Integrations

### DASH-041 — Google Calendar sync setup (teacher)

**Phase**: 8 · **Estimate**: M · **Depends on**: DASH-003
**External deps**: Google Calendar API

- Builds: Settings → Integrations → Google Calendar
- Calls: `GET /api/calendar-sync`, `app/actions/calendar-webhook.ts::enableCalendarWebhook`

**Acceptance**

- AC1 Connect button → OAuth flow
- AC2 Toggle real-time sync (webhook registration)
- AC3 Status shows token expiry + last sync

**Test** — `tests/e2e/dashboard/calendar-sync.spec.ts`

- teacher: settings page reachable (OAuth mocked or skipped in test env)
- admin: same
- student: page not reachable (or shows disabled)

- [ ] DASH-041

### DASH-042 — Import lessons from Google Calendar

**Phase**: 8 · **Estimate**: M · **Depends on**: DASH-041

- Builds: "Import" wizard on lessons page
- Calls: `app/actions/import-lessons.ts::{importLessonsFromGoogle, fetchGoogleEvents}`

**Acceptance**

- AC1 Pick date range, preview events
- AC2 Auto-create shadow students for unknown emails
- AC3 Idempotent via `google_event_id` dedupe

**Test** — `tests/e2e/dashboard/calendar-import.spec.ts`

- teacher: import preview + commit (mocked Google response)
- admin: same
- student: 403

- [ ] DASH-042

### DASH-043 — Spotify connect + now-playing

**Phase**: 8 · **Estimate**: S · **Depends on**: DASH-025

- Builds: Settings → Integrations → Spotify; now-playing widget
- Reads: `GET /api/spotify/authorize`, `GET /api/spotify/now-playing`

**Acceptance**

- AC1 Connect button → Spotify OAuth
- AC2 Now-playing widget on songs page when connected
- AC3 Circuit-breaker open → widget shows "temporarily unavailable"

**Test** — `tests/e2e/dashboard/spotify-connect.spec.ts`

- teacher: connect (mocked); now-playing shows
- admin: same
- student: settings hidden

- [ ] DASH-043

### DASH-044 — Google Drive videos

**Phase**: 8 · **Estimate**: M · **Depends on**: DASH-023
**External deps**: Google Drive API

- Builds: video uploader on song detail
- Writes: `POST /api/song/:id/videos/upload-url`, `POST /api/song/:id/videos`

**Acceptance**

- AC1 Upload to Drive via signed URL
- AC2 Attach to song with title + position
- AC3 Stream via `GET /api/song/:id/videos/:videoId/stream`

**Test** — `tests/e2e/dashboard/drive-videos.spec.ts`

- admin / teacher: upload (mocked Drive)
- student: view only

- [ ] DASH-044

---

## Phase 9 — AI & communication

### DASH-045 — AI chat (general)

**Phase**: 9 · **Estimate**: M · **Depends on**: DASH-004
**External deps**: OpenRouter / Ollama

- Builds: `app/dashboard/ai/page.tsx`
- Calls: `app/actions/ai.ts::generateAIResponseStream` (Chat agent)
- Reads: `app/actions/ai-conversations.ts::*`

**Acceptance**

- AC1 Sidebar of past conversations
- AC2 Streaming responses
- AC3 Auto-title on first exchange

**Test** — `tests/e2e/dashboard/ai-chat.spec.ts`

- admin / teacher / student: send a message, receive streamed response (mocked)
- each role: sees only own conversations

- [ ] DASH-045

### DASH-046 — Email draft generator

**Phase**: 9 · **Estimate**: S · **Depends on**: DASH-032

- Builds: "Compose email" dialog with AI button
- Calls: `app/actions/ai.ts::generateEmailDraftStream`

**Acceptance**

- AC1 Pick recipient, prompt → AI drafts; send via Gmail SMTP
- AC2 Teacher/admin only

**Test** — `tests/e2e/dashboard/ai-email.spec.ts`

- teacher / admin: composes and sends (SMTP mocked)
- student: not rendered

- [ ] DASH-046

### DASH-047 — Student progress AI insights

**Phase**: 9 · **Estimate**: S · **Depends on**: DASH-032

- Builds: "Insights" tab on student detail
- Calls: `app/actions/ai.ts::analyzeStudentProgressStream`

**Acceptance**

- AC1 Narrative summary of practice + progress trends
- AC2 Cached per (student, week)

**Test** — `tests/e2e/dashboard/ai-progress.spec.ts`

- teacher / admin: generates
- student: not rendered

- [ ] DASH-047

### DASH-048 — Admin BI insights

**Phase**: 9 · **Estimate**: S · **Depends on**: DASH-037

- Builds: "Insights" card on admin dashboard
- Calls: `app/actions/ai.ts::generateAdminInsightsStream`

**Acceptance**

- AC1 School-level narrative (active cohorts, churn risk)
- AC2 Admin only

**Test** — `tests/e2e/dashboard/ai-admin-bi.spec.ts`

- admin: visible + generates
- teacher / student: not rendered

- [ ] DASH-048

### DASH-049 — AI usage dashboard

**Phase**: 9 · **Estimate**: S · **Depends on**: DASH-045

- Builds: per-user usage tab on Settings
- Reads: `GET /api/ai/debug`, `ai_usage_stats`

**Acceptance**

- AC1 Tokens, calls, latency, errors per agent per day

**Test** — `tests/e2e/dashboard/ai-usage.spec.ts`

- each role: sees own usage
- admin: can switch to system-wide view

- [ ] DASH-049

### DASH-050 — AI prompt templates editor (admin)

**Phase**: 9 · **Estimate**: M · **Depends on**: DASH-049

- Builds: `app/dashboard/admin/ai-prompts/*`
- Reads/Writes: `ai_prompt_templates`

**Acceptance**

- AC1 Versioned templates, preview, rollback
- AC2 Admin only

**Test** — `tests/e2e/dashboard/ai-prompts.spec.ts`

- admin: CRUD
- teacher / student: 403

- [ ] DASH-050

---

## Phase 10 — Settings & secondary

### DASH-051 — Profile + MFA

**Phase**: 10 · **Estimate**: M · **Depends on**: DASH-003

- Builds: `app/dashboard/settings/page.tsx` (profile section)
- Calls: `app/actions/{account, mfa}.ts::*`

**Acceptance**

- AC1 Edit name, avatar, email (with confirmation flow)
- AC2 MFA enroll/verify/unenroll via TOTP
- AC3 Account deletion with grace period

**Test** — `tests/e2e/dashboard/settings-profile.spec.ts`

- each role: edit profile, enroll MFA, verify, unenroll

- [ ] DASH-051

### DASH-052 — API keys management

**Phase**: 10 · **Estimate**: S · **Depends on**: DASH-051

- Builds: Settings → API Keys
- Calls: `app/actions/api-keys.ts::*`

**Acceptance**

- AC1 Generate (show plaintext once), list, revoke

**Test** — `tests/e2e/dashboard/api-keys.spec.ts`

- each role: generate + revoke own

- [ ] DASH-052

### DASH-053 — Notification preferences

**Phase**: 10 · **Estimate**: S · **Depends on**: DASH-051

- Builds: Settings → Notifications
- Calls: `app/actions/notification-preferences.ts::*`

**Acceptance**

- AC1 Per-channel toggles (email, in-app, push)
- AC2 Per-event toggles (lesson reminder, overdue, weekly digest)

**Test** — `tests/e2e/dashboard/notification-prefs.spec.ts`

- each role: toggle + verify persistence

- [ ] DASH-053

### DASH-054 — Theme + UI preferences

**Phase**: 10 · **Estimate**: S · **Depends on**: DASH-051

- Builds: Settings → Appearance
- Calls: `app/actions/settings.ts::saveUserSettings`

**Acceptance**

- AC1 Theme (light/dark/system), language, timezone

**Test** — `tests/e2e/dashboard/theme.spec.ts`

- each role: switch theme, persists across reload

- [ ] DASH-054

### DASH-055 — In-app notifications inbox

**Phase**: 10 · **Estimate**: S · **Depends on**: DASH-003

- Builds: bell icon in topbar → drawer
- Reads/Writes: `app/actions/in-app-notifications.ts::*`

**Acceptance**

- AC1 Unread count badge
- AC2 Mark read / mark all read
- AC3 Click → deep link

**Test** — `tests/e2e/dashboard/notifications-inbox.spec.ts`

- each role: receives notification, marks read

- [ ] DASH-055

### DASH-056 — Chord quiz

**Phase**: 10 · **Estimate**: M · **Depends on**: DASH-015
**Roles**: admin ✦ · teacher ✗ · student ✓

- Builds: `app/dashboard/skills/chord-quiz/page.tsx`
- Writes: `app/actions/chord-quiz.ts::submitChordQuizSession`

**Acceptance**

- AC1 Quiz UI cycles through chord prompts
- AC2 Submits batch results
- AC3 Server enforces `student_id` from session

**Test** — `tests/e2e/dashboard/chord-quiz.spec.ts`

- student: completes quiz
- teacher / admin: can view results, not submit on behalf

- [ ] DASH-056

### DASH-057 — Skill tree

**Phase**: 10 · **Estimate**: M · **Depends on**: DASH-056

- Builds: `app/dashboard/skills/page.tsx`
- Reads: `skills`, `student_skills` (may need new endpoint)
- **BACKEND**: confirm `GET /api/skills` exists; if not, add it (small)

**Acceptance**

- AC1 Visual tree of techniques with student progress
- AC2 Click skill → details + practice suggestions

**Test** — `tests/e2e/dashboard/skill-tree.spec.ts`

- student: own progress
- teacher: per-student
- admin: full

- [ ] DASH-057

### DASH-058 — Theory courses (read)

**Phase**: 10 · **Estimate**: M · **Depends on**: DASH-004

- Builds: `app/dashboard/theory/*` (existing pages stripped)
- Reads: `theoretical_courses`, `theoretical_lessons` via existing data hooks

**Acceptance**

- AC1 Course list + lesson reader
- AC2 Access controlled by `theoretical_course_access`

**Test** — `tests/e2e/dashboard/theory.spec.ts`

- student: only enrolled courses
- teacher / admin: all

- [ ] DASH-058

---

## Phase 11 — Content publishing (lowest priority, admin only)

### DASH-059 — Content posts schedule

**Phase**: 11 · **Estimate**: M · **Depends on**: DASH-004
**Roles**: admin ✓ only

- Builds: `app/dashboard/content/*`
- Reads/Writes: `/api/content/posts`, `/api/content/calendar`

**Acceptance**

- AC1 Calendar view of scheduled posts
- AC2 Create / edit / delete post

**Test** — `tests/e2e/dashboard/content-posts.spec.ts`

- admin: CRUD
- teacher / student: 403

- [ ] DASH-059

### DASH-060 — Hashtag sets

**Phase**: 11 · **Estimate**: S · **Depends on**: DASH-059

- Builds: hashtag manager
- Reads/Writes: `/api/content/hashtag-sets/*`

**Acceptance**

- AC1 CRUD reusable hashtag bundles

**Test** — `tests/e2e/dashboard/hashtag-sets.spec.ts`

- admin: CRUD
- teacher / student: 403

- [ ] DASH-060

---

## Cross-cutting checks (run after every phase)

| Check             | Command                                                     | When              |
| ----------------- | ----------------------------------------------------------- | ----------------- |
| Auth baseline     | `npx playwright test tests/e2e/auth/role-login.spec.ts`     | After every step  |
| Lint              | `npm run lint -- <touched dirs>`                            | Before commit     |
| Unit              | `npm test -- --findRelatedTests <touched files>`            | Before commit     |
| Smoke             | `npx playwright test tests/e2e/smoke/critical-path.spec.ts` | End of each phase |
| Visual regression | `npx playwright test tests/v2-visual`                       | End of each phase |

---

## Test helper additions (one-time)

Before Phase 2 starts, add to `tests/helpers/dashboard.ts`:

- `expectCardVisible(page, testId)` — semantic assertion that a dashboard card is rendered
- `expectCardHidden(page, testId)` — and that it is NOT rendered for other roles
- `expectForbidden(page, route)` — navigates and asserts redirect-to-login or 403 banner
- `seedRoleData(role, scenario)` — convenience around the existing seed scripts

Every spec under `tests/e2e/dashboard/` imports from this helper. Keeps each spec ~30-50 LOC.

---

## Progress

- Phase 0: 1 / 1
- Phase 1: 3 / 3 ✅
- Phase 2: 1 / 9
- Phase 3: 0 / 8
- Phase 4: 0 / 6
- Phase 5: 0 / 3
- Phase 6: 0 / 4
- Phase 7: 0 / 6
- Phase 8: 0 / 4
- Phase 9: 0 / 6
- Phase 10: 0 / 8
- Phase 11: 0 / 2

**Total**: 5 / 60

Update the counters as steps ship. When a phase hits 100%, run the full E2E suite (`npx playwright test`) before opening the next phase.

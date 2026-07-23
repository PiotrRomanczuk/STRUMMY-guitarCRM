---
created: 2026-06-19
updated: 2026-07-23
---

# E2E Journey Catalog — Admin & Student

A complete inventory of the user journeys needed to fully cover Strummy by E2E, for the
two roles: **Admin/Teacher** and **Student**. Each journey names the route/action it
drives, the capability or RLS rule it proves, and its current coverage status — so the
gaps are obvious.

UI journeys (browser-drivable by Playwright) are listed in full. **Backend dataflow
journeys** (calendar sync, shadow→claim, notification pipeline) are listed separately in
[Part D](#part-d--backend-dataflow-journeys-integration-test-candidates) — they need
mocked Google/email and belong in the Jest integration layer, not Playwright.

Derived from the live `app/dashboard/*` routes and the Playwright suite
(`tests/e2e/*`, **58 specs / 281 test cases / 23 skipped** as of 2026-07-23). A flat,
per-spec dump of every case lives in
[`docs/2026-07-23-e2e-tested-journeys.md`](../../2026-07-23-e2e-tested-journeys.md); this
file is the curated role-oriented view with coverage status.

## Conventions

- **Roles**: `Admin` (== Teacher in the current UI — the owner is the sole teacher;
  admin-only surfaces are flagged), `Student`.
- **Coverage legend**: ✅ covered · 🟡 partial · ❌ gap · ⏸ stub / "coming soon"
  (smoke-only, don't deep-test) · 🚫 out of scope (owner: not necessary).
- **Test accounts** (dev Supabase `StudentDevelopment` :55321, non-demo → **not**
  mutation-guarded). Defaults resolved by `playwright.config.ts`; override via
  `TEST_{ROLE}_EMAIL`/`_PASSWORD`:
  - Admin: `admin@dev.local` / `test123_admin`
  - Teacher: `teacher@dev.local` / `test123_teacher`
  - Student: `student@dev.local` / `test123_student`
  - Demo accounts (`Demo2024!`) are `is_development:true` → mutations blocked by
    `guardTestAccountMutation`; reserved for the demo-guard suite.
- **Helpers to reuse**:
  - `tests/fixtures/auth.fixture.ts` (re-exported from `tests/fixtures/`) — session-cached
    `loginAs(role)`
  - `tests/helpers/seed-ids.ts` — `adminClient()` (service-role) + `getStudentId/TeacherId/AdminId`
  - `tests/helpers/cleanup.ts` — pattern-based teardown (`E2E Lesson/Assignment/Song N`,
    artist `E2E Test Artist`, student name `/^E2E/` / email `/^e2e\./`)

## Coverage summary

- **Total journeys catalogued**: ~80 (Admin ~46, Student ~26, Cross-role ~6, Dataflow ~6).
- **Covered (✅)**: ~60 — auth baseline + sign-out + sign-up, song/lesson/assignment CRUD
  (incl. duration/format, daily-target/submission-type, cover, templates, history, recurring,
  song-status), student read-only + status + checklist + practice + BPM + repertoire + chord-SRS,
  users management + edit + student-intake + at-risk, notifications inbox + prefs, API keys,
  avatar validation, calendar status + conflict resolve, fretboard, AI generation/playground,
  dashboard cards/sidebar/topbar, demo guards, mobile/responsive, cross-role isolation + RLS,
  integration workflows.
- **Partial (🟡)**: ~8 — inline shadow create, lesson list filter/sort, student-detail aggregates,
  shadow invite, admin practice read, Google disconnect, onboarding wizard (skipped), assignment
  round-trip.
- **Remaining gaps (❌) worth an E2E** (built + browser-drivable): **A3.2** song external links ·
  **A9.3** AI-generation history · **A10.5** settings persistence.
- **Gaps deliberately not E2E'd**: A1.3 password reset / A1.4 lockout-trigger (email/rate-limit),
  A3.3 Spotify import (external API → integration+mock), A4.5 bulk / A4.6 calendar import /
  A8.3 disconnect (backend/OAuth), A6.5 repertoire-mgmt · A6.7 role-assign · B3.4 song-request
  (**no built UI**), A3.4 favorites · A3.5 Song-of-the-Week (owner: not necessary → 🚫).

---

## PART A — Admin / Teacher journeys

### A1. Auth & session

| ID   | Journey                                                | Key assertion                             | Cover            |
| ---- | ------------------------------------------------------ | ----------------------------------------- | ---------------- |
| A1.1 | Sign in → land on `/dashboard`                         | role-correct dashboard renders            | ✅ role-login    |
| A1.2 | Sign out from topbar user menu                         | redirected to sign-in, session cleared    | ✅ auth/sign-out |
| A1.3 | Forgot password → reset password flow                  | reset email requested, new password works | ❌ (email-dep)   |
| A1.4 | Account lockout after failed logins                    | "too many attempts" lockout shown         | ❌ (rate-limit)  |
| A1.5 | Protected route while signed out → redirect to sign-in | `/dashboard` redirects                    | ✅ smoke         |

### A2. Dashboard

| ID   | Journey                                                                | Key assertion                   | Cover                       |
| ---- | ---------------------------------------------------------------------- | ------------------------------- | --------------------------- |
| A2.1 | Admin dashboard: platform metrics + role switcher                      | admin cards + switcher visible  | ✅ topbar/states            |
| A2.2 | Teacher dashboard: today's/upcoming lessons, roster                    | cards render populated-or-empty | ✅ teacher-journey          |
| A2.3 | Sidebar shows scoped nav groups                                        | role-correct nav present        | ✅ sidebar                  |
| A2.4 | "Needs attention" at-risk-student card appears then clears on practice | at-risk badge + profile link    | ✅ teacher/backfill-at-risk |

### A3. Songs (full CRUD)

| ID   | Journey                                                | Key assertion                  | Cover                       |
| ---- | ------------------------------------------------------ | ------------------------------ | --------------------------- |
| A3.1 | Song lifecycle: create → view → edit → search → delete | row persists then soft-deletes | ✅ teacher/songs-crud       |
| A3.2 | Create song with external links (YouTube/UG/PDF/Drive) | links saved + shown on detail  | ❌ **← next to build**      |
| A3.3 | Spotify import / accelerator auto-fill                 | fields auto-fill from match    | ❌ (external → integration) |
| A3.4 | Toggle favorite on a song                              | favorite state persists        | 🚫 not necessary            |
| A3.5 | Song of the Week curate                                | SOTW shows on dashboard        | 🚫 not necessary            |
| A3.6 | Create song with a cover image URL                     | `cover_image_url` persists     | ✅ teacher/song-cover       |

### A4. Lessons (full CRUD + recurring + calendar)

| ID   | Journey                                                | Key assertion                          | Cover                             |
| ---- | ------------------------------------------------------ | -------------------------------------- | --------------------------------- |
| A4.1 | Lesson lifecycle: create → view → edit → delete        | row persists then soft-deletes         | ✅ teacher/lessons-crud           |
| A4.2 | Create lesson with inline shadow-student (new email)   | shadow profile created + linked        | 🟡 integration (shadow create)    |
| A4.3 | Lesson detail: assigned song appears + set song status | song in Repertoire, status reflects    | ✅ teacher/lesson-song-status     |
| A4.4 | Filter lessons by status + sort + paginate             | filtered list correct                  | 🟡 teacher-journey                |
| A4.5 | Bulk create/update/delete lessons (≤100)               | bulk endpoint applies all rows         | ❌ (API, not a UI journey)        |
| A4.6 | Import lessons from Google Calendar (UI)               | event preview → import creates lessons | ❌ (backend-dependent)            |
| A4.7 | Create lesson with duration + in-person/video format   | "30 min" + "Video call" on detail      | ✅ teacher/lesson-duration-format |
| A4.8 | Repeat-weekly toggle creates N lessons 7 days apart    | N lessons created, list returns        | ✅ teacher/lesson-repeat-weekly   |

### A5. Assignments (full CRUD + templates + AI)

| ID   | Journey                                                   | Key assertion                              | Cover                                   |
| ---- | --------------------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| A5.1 | Assignment lifecycle: create → view → edit → delete       | row persists then deletes                  | ✅ teacher/assignments-crud             |
| A5.2 | Create assignment linked to student + song + due date     | links saved                                | 🟡 integration                          |
| A5.3 | Assignment templates: list → create → start-from-template | template inherits title+checklist          | ✅ teacher/assignment-templates         |
| A5.4 | AI-generate assignment description                        | generated text fills description           | ✅ ai/assignment-ai                     |
| A5.5 | Create assignment with daily-target + submission-type     | "10 min/day" + "Audio recording" on detail | ✅ teacher/assignment-target-submission |
| A5.6 | Assignment detail history timeline                        | created + 2 status changes shown           | ✅ teacher/assignment-history           |

### A6. Users / student management (admin-only)

| ID   | Journey                                                              | Key assertion                          | Cover                                     |
| ---- | -------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| A6.1 | Users list: search + role filter + paginate                          | filtered roster correct                | ✅ teacher/users-management               |
| A6.2 | Student detail: profile + lessons/assignments/repertoire/stats       | profile renders; aggregates partial    | 🟡 users-management + student-preferences |
| A6.3 | Create shadow student → set invite email → send invite               | "Invite →" appears, `invite_email` set | 🟡 teacher/student-onboarding             |
| A6.4 | Edit student profile name → save → revert                            | change persists                        | ✅ teacher/users-management               |
| A6.5 | Manage student repertoire (add/remove song)                          | repertoire entries persist             | ❌ (no teacher-side UI)                   |
| A6.6 | View locked accounts → unlock                                        | counters cleared, account active       | ✅ admin/lockout-widget                   |
| A6.7 | Assign/revoke role (Admin/Teacher/Student)                           | role change persists                   | ❌ (no built UI)                          |
| A6.8 | Add student via full intake form (identity/contact/schedule/billing) | fields persist to profile              | ✅ teacher/student-intake (admin)         |

### A7. Practice (admin read)

| ID   | Journey                                          | Key assertion | Cover                          |
| ---- | ------------------------------------------------ | ------------- | ------------------------------ |
| A7.1 | Admin practice page loads (read across students) | page renders  | 🟡 student/practice-bpm (B7.5) |

### A8. Calendar integration (admin-only, backend-dependent)

| ID   | Journey                                                 | Key assertion                   | Cover                              |
| ---- | ------------------------------------------------------- | ------------------------------- | ---------------------------------- |
| A8.1 | Calendar page: connected/disconnected status            | status indicator correct        | ✅ teacher/calendar-conflicts      |
| A8.2 | Resolve a seeded sync conflict (use_local)              | conflict resolved, list shrinks | ✅ teacher/calendar-conflicts      |
| A8.3 | Disconnect Google (revoke + stop webhook + delete rows) | integration rows gone           | 🟡 settings/integrations (UI only) |

### A9. AI assistant (admin-only)

| ID   | Journey                                           | Key assertion                 | Cover                  |
| ---- | ------------------------------------------------- | ----------------------------- | ---------------------- |
| A9.1 | AI playground: send message, reset conversation   | response renders, reset works | ✅ ai/ai-playground    |
| A9.2 | Generate lesson notes via AI (student+song+title) | notes stream into field       | ✅ ai/lesson-notes-\*  |
| A9.3 | AI history: list, filter, star a generation       | history persists              | ❌ **← next to build** |

### A10. Notifications & settings (admin)

| ID    | Journey                                                 | Key assertion            | Cover                     |
| ----- | ------------------------------------------------------- | ------------------------ | ------------------------- |
| A10.1 | Notifications inbox: mark read / mark all               | unread count updates     | ✅ notifications/inbox    |
| A10.2 | Notification preferences: toggle per-type opt-in/out    | prefs persist            | ✅ notifications/prefs    |
| A10.3 | API keys: create → see in table → delete                | key created then revoked | ✅ settings/api-keys      |
| A10.4 | Request email change / account deletion (30-day grace)  | request recorded         | ❌ (verify built)         |
| A10.5 | User settings: theme/language/timezone persist          | settings saved           | ❌ **← next to build**    |
| A10.6 | Avatar upload validation (reject non-image / oversized) | visible error, no upload | ✅ settings/avatar-upload |

### A11. Tools / analytics

| ID    | Journey                                            | Key assertion           | Cover                |
| ----- | -------------------------------------------------- | ----------------------- | -------------------- |
| A11.1 | Fretboard explorer: scale/key/chord/interval + URL | fretboard renders notes | ✅ teacher/fretboard |
| A11.2 | Stats / health / logs / cohorts pages load         | page renders (smoke)    | ✅ admin/* + smoke   |

---

## PART B — Student journeys

### B1. Auth & onboarding

| ID   | Journey                                         | Key assertion                           | Cover                             |
| ---- | ----------------------------------------------- | --------------------------------------- | --------------------------------- |
| B1.1 | Student sign in → `/dashboard`                  | student dashboard renders               | ✅ role-login                     |
| B1.2 | Sign up → email verify → onboarding → dashboard | onboarding persists, lands on dashboard | 🟡 sign-up ✅ · onboarding 🚫skip |
| B1.3 | Accept invitation link → claim account          | role assigned on claim                  | ❌ (see Part D / D3)              |

### B2. Dashboard & navigation (scoped)

| ID   | Journey                                                   | Key assertion                | Cover                                 |
| ---- | --------------------------------------------------------- | ---------------------------- | ------------------------------------- |
| B2.1 | Student dashboard: next lesson + my songs, no admin cards | only student cards/nav shown | ✅ sidebar + student-learning-journey |
| B2.2 | Sidebar shows only Learning + Progress groups             | admin nav hidden             | ✅ sidebar                            |

### B3. Songs (read-only + request)

| ID   | Journey                                    | Key assertion            | Cover                 |
| ---- | ------------------------------------------ | ------------------------ | --------------------- |
| B3.1 | Browse songs, no "New Song" button         | create control absent    | ✅ student/songs-read |
| B3.2 | View song detail — no edit/delete controls | mutation controls absent | ✅ student/songs-read |
| B3.3 | Search songs + see resource links          | results + links render   | ✅ student/songs-read |
| B3.4 | Request a song be added                    | request created (own)    | ❌ (SNG-1, no UI yet) |

### B4. Lessons (read-only, own-only)

| ID   | Journey                                                  | Key assertion                  | Cover                                   |
| ---- | -------------------------------------------------------- | ------------------------------ | --------------------------------------- |
| B4.1 | Lessons list, no Create button                           | create control absent          | ✅ student/lessons-read                 |
| B4.2 | View lesson detail — no edit/delete, songs section shown | read-only render               | ✅ student/lessons-read                 |
| B4.3 | Only own lessons visible (RLS)                           | other students' lessons absent | ✅ student/lessons-read + rls-isolation |

### B5. Assignments (read + status + checklist)

| ID   | Journey                                          | Key assertion               | Cover                           |
| ---- | ------------------------------------------------ | --------------------------- | ------------------------------- |
| B5.1 | Assignments list, no Create button               | create control absent       | ✅ student/assignments-interact |
| B5.2 | Advance status not_started→in_progress→completed | status persists             | ✅ student/assignments-interact |
| B5.3 | No edit control for assignment content           | content read-only           | ✅ student/assignments-interact |
| B5.4 | Filter assignments by status                     | filtered list correct       | ✅ student/assignments-interact |
| B5.5 | Tick a checklist item → progress % persists      | progress persists on reload | ✅ student/assignments-interact |

### B6. Practice (self-service, immutable)

| ID   | Journey                                                 | Key assertion         | Cover                            |
| ---- | ------------------------------------------------------- | --------------------- | -------------------------------- |
| B6.1 | Log a practice session (song, minutes, date)            | session recorded      | ✅ student/practice              |
| B6.2 | Delete same-day entry (undo), incl. song-linked (PRA-1) | entry removed         | ✅ student/practice              |
| B6.3 | Past sessions have no edit/delete control               | immutability enforced | ✅ student/practice              |
| B6.4 | Cannot see other students' sessions (RLS)               | only own sessions     | ✅ cross-role/rls-data-isolation |
| B6.5 | BPM tracking: input appears w/ song, badge in history   | BPM persists          | ✅ student/practice-bpm          |

### B7. Repertoire (self-rating only)

| ID   | Journey                                   | Key assertion          | Cover                 |
| ---- | ----------------------------------------- | ---------------------- | --------------------- |
| B7.1 | View own repertoire (teacher-managed set) | list renders own rows  | ✅ student/repertoire |
| B7.2 | Update own self-rating/difficulty         | rating persists        | ✅ student/repertoire |
| B7.3 | No add/remove repertoire controls         | set is teacher-managed | ✅ student/repertoire |

### B8. Profile, settings & notifications (own only)

| ID   | Journey                                                 | Key assertion          | Cover                                 |
| ---- | ------------------------------------------------------- | ---------------------- | ------------------------------------- |
| B8.1 | Edit own profile (first name) → save → revert           | change persists        | ✅ student-full-journey               |
| B8.2 | Notification preferences opt-in/out (own)               | prefs persist          | ✅ notifications/prefs                |
| B8.3 | API keys create/delete (own)                            | key lifecycle works    | ✅ settings/api-keys                  |
| B8.4 | Notifications inbox: mark read/dismiss (own)            | unread updates         | 🟡 notifications/inbox (admin-tested) |
| B8.5 | Chord quiz: take quiz, SRS review, attempt logged (own) | attempt saved          | ✅ student/chord-quiz-srs             |
| B8.6 | Theory: read a granted course                           | granted course visible | ⏸ stub                                |

---

## PART C — Cross-role / access-control journeys

| ID  | Journey                                                                    | Key assertion                  | Cover                            |
| --- | -------------------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| C1  | Student blocked from `/dashboard/users`, `/ai`, `/calendar`, `/logs`       | redirect/403                   | ✅ cross-role/access-control     |
| C2  | Data isolation: student cannot read another student's rows                 | RLS denies cross-student       | ✅ cross-role/rls-data-isolation |
| C3  | Teacher creates lesson → same student sees it read-only → teacher deletes  | lifecycle visible across roles | ✅ integration/workflows         |
| C4  | Teacher creates assignment → student advances status → teacher sees update | round-trip status              | 🟡 integration                   |
| C5  | Demo accounts blocked from all mutations (403)                             | guard enforced                 | ✅ demo/mutation-guards          |
| C6  | Mobile/responsive: key pages on iPhone/iPad, bottom-nav, 44px targets      | no overflow, nav usable        | ✅ mobile                        |

---

## PART D — Backend dataflow journeys (integration-test candidates)

> These need mocked Google OAuth/Calendar and an email sink, so they belong in the Jest
> integration layer (`npm run test:integration` / `npm run test:rls`), **not** Playwright.
> Listed here so "whole application" coverage is honest about what UI E2E can't reach.
> Full traces live in the blueprint domain docs (02 calendar sync, 01 shadow claim,
> 07 notification pipeline).

| ID  | Flow                                                                                      | What to assert                                              | Layer                                                             |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| D1  | Outbound: lesson CRUD → Google event (non-blocking)                                       | `google_event_id` stored; Google-down still persists lesson | integration (mock `lib/google.ts`)                                |
| D2  | Inbound: Google event → `isGuitarLesson` filter → dedupe → shadow student → lesson INSERT | recurring series → N lessons, not 1                         | integration                                                       |
| D3  | Shadow → invite → claim → reference transfer                                              | all FKs migrate; shadow row removed                         | integration/RLS (⚠️ under rebuild — see DATABASE_REBUILD Phase 2) |
| D4  | Calendar reconcile: `reconcileCalendarForStudent` swaps future-event attendee             | per-event isolation; failures dead-letter to `system_logs`  | integration                                                       |
| D5  | Notification chokepoint: skip send for un-invited shadow, log (no bounce)                 | skip logged, no send                                        | integration                                                       |
| D6  | Queue processor: backoff/retry on due rows; preference opt-out gates send                 | retries + opt-out respected                                 | integration                                                       |

---

## Next steps

The suite is now broadly covered. The **three remaining browser-drivable gaps** worth an
E2E, each a focused spec:

1. **A3.2** — song external links: create with YouTube/UG/PDF/Drive links → shown on detail.
2. **A9.3** — AI-generation history: `/dashboard/ai/history` list + filter + star.
3. **A10.5** — settings persistence: theme/language/timezone save → survive reload.

Everything else marked ❌ is deliberately out of Playwright's reach (email/OAuth/rate-limit →
Part D integration) or has no built UI yet (A6.5/A6.7/B3.4), or is owner-flagged not-necessary
(A3.4/A3.5 🚫). New specs reuse the helpers + `@dev.local` accounts above and the
pattern-based cleanup; see each blueprint domain doc's **Behavior & rules** for the per-entity
CRUD rules a journey asserts.

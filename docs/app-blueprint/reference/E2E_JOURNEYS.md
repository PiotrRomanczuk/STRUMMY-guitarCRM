---
created: 2026-06-19
updated: 2026-06-19
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

Derived from the live `app/dashboard/*` routes, the existing Playwright suite
(`tests/e2e/*`, ~19 specs / ~150 tests), and the per-role CRUD rules + dataflow traces now
folded into the blueprint domain docs ([`../00-overview.md`](../00-overview.md),
[`../01-identity-access.md`](../01-identity-access.md),
[`../02-lessons-calendar.md`](../02-lessons-calendar.md),
[`../07-notifications-email.md`](../07-notifications-email.md)).

## Conventions

- **Roles**: `Admin` (== Teacher in the current UI — the owner is the sole teacher;
  admin-only surfaces are flagged), `Student`.
- **Coverage legend**: ✅ covered · 🟡 partial · ❌ gap · ⏸ stub / "coming soon"
  (smoke-only, don't deep-test).
- **Test accounts** (local Supabase, non-demo → **not** mutation-guarded):
  - Admin: `p.romanczuk@gmail.com` / `test123_admin`
  - Teacher: `teacher@example.com` / `test123_teacher`
  - Student: `student1@example.com` / `test123_student`
  - Demo accounts (`sarah@`/`emma@`, `Demo2024!`) are `is_development:true` → mutations
    blocked by `guardTestAccountMutation`; reserved for the demo-guard suite.
- **Helpers to reuse**:
  - `tests/helpers/auth.ts` — `loginAsAdmin` / `loginAsTeacher` / `loginAsStudent`
  - `tests/fixtures/auth.fixture.ts` — session-cached `loginAs(role)`
  - `tests/helpers/form.ts` — `fillLessonForm`, `fillFormField`, `verifyToast`
  - `tests/helpers/dashboard.ts` — `expectNavItemVisible` / `expectNavItemHidden`
  - `tests/helpers/cleanup.ts` — E2E-prefixed teardown

## Coverage summary

- **Total journeys catalogued**: ~70 (Admin ~38, Student ~24, Cross-role ~6, Dataflow ~6).
- **Already covered (✅)**: ~22 — auth baseline, song/lesson/assignment CRUD (teacher),
  student read-only enforcement + status transitions, AI generation, dashboard cards/sidebar,
  demo mutation guards, mobile/responsive, core integration workflows.
- **Partial (🟡)**: ~8 — sign-out, inline shadow create, list filters, notification prefs,
  cross-role isolation.
- **Top gaps (❌) worth filling first**: Practice (B6), Repertoire (B7), Notifications inbox
  (A10.1 / B8.4), Settings & API keys (A10.3 / B8.3), Lesson song-status transitions (A4.3),
  Assignment templates (A5.3), Account lockout & password reset (A1.3 / A1.4), User edit +
  repertoire management (A6.4 / A6.5).

---

## PART A — Admin / Teacher journeys

### A1. Auth & session

| ID   | Journey                                                | Key assertion                             | Cover         |
| ---- | ------------------------------------------------------ | ----------------------------------------- | ------------- |
| A1.1 | Sign in → land on `/dashboard`                         | role-correct dashboard renders            | ✅ role-login |
| A1.2 | Sign out from topbar user menu                         | redirected to sign-in, session cleared    | 🟡 topbar     |
| A1.3 | Forgot password → reset password flow                  | reset email requested, new password works | ❌            |
| A1.4 | Account lockout after 5 failed logins / 30 min         | "too many attempts" lockout shown         | ❌            |
| A1.5 | Protected route while signed out → redirect to sign-in | `/dashboard` redirects                    | ✅ smoke      |

### A2. Dashboard

| ID   | Journey                                                                 | Key assertion                   | Cover                     |
| ---- | ----------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| A2.1 | Admin dashboard: platform metrics + pending invites + role switcher     | admin cards + switcher visible  | ✅ topbar/states          |
| A2.2 | Teacher dashboard: today's + upcoming lessons, at-risk students, roster | cards render populated-or-empty | ✅ today/upcoming-lessons |
| A2.3 | Sidebar shows all Teaching/Students/Analytics/Tools groups              | admin-only nav present          | ✅ sidebar                |

### A3. Songs (full CRUD)

| ID   | Journey                                                   | Key assertion                    | Cover                 |
| ---- | --------------------------------------------------------- | -------------------------------- | --------------------- |
| A3.1 | Song lifecycle: create → view → edit → search → delete    | row persists then soft-deletes   | ✅ teacher/songs-crud |
| A3.2 | Create song with attachments (YouTube/UG/PDF/Drive links) | links saved + shown on detail    | ❌                    |
| A3.3 | Spotify import of a song                                  | imported song appears in library | ❌                    |
| A3.4 | Toggle favorite on a song                                 | favorite state persists          | ❌                    |
| A3.5 | Song of the Week curate                                   | SOTW shows on dashboard          | ❌                    |

### A4. Lessons (full CRUD + bulk + calendar)

| ID   | Journey                                                        | Key assertion                              | Cover                          |
| ---- | -------------------------------------------------------------- | ------------------------------------------ | ------------------------------ |
| A4.1 | Lesson lifecycle: create → view → edit → delete                | row persists then soft-deletes             | ✅ teacher/lessons-crud        |
| A4.2 | Create lesson with inline shadow-student (new email)           | shadow profile created + linked            | 🟡 integration (shadow create) |
| A4.3 | Lesson detail: assign songs (`lesson_songs`) + set song status | status lifecycle advances, history written | ❌                             |
| A4.4 | Filter lessons by status + sort + paginate                     | filtered list correct                      | 🟡 teacher-journey             |
| A4.5 | Bulk create/update/delete lessons (≤100)                       | bulk endpoint applies all rows             | ❌                             |
| A4.6 | Import lessons from Google Calendar (UI)                       | event preview → import creates lessons     | ❌ (backend-dependent)         |

### A5. Assignments (full CRUD + templates + AI)

| ID   | Journey                                               | Key assertion                    | Cover                       |
| ---- | ----------------------------------------------------- | -------------------------------- | --------------------------- |
| A5.1 | Assignment lifecycle: create → view → edit → delete   | row persists then deletes        | ✅ teacher/assignments-crud |
| A5.2 | Create assignment linked to student + song + due date | links saved                      | 🟡 integration              |
| A5.3 | Assignment templates: create → use → delete           | template reusable in form        | ❌                          |
| A5.4 | AI-generate assignment description                    | generated text fills description | ✅ ai/assignment-ai         |

### A6. Users / student management (admin-only)

| ID   | Journey                                                          | Key assertion                         | Cover                        |
| ---- | ---------------------------------------------------------------- | ------------------------------------- | ---------------------------- |
| A6.1 | Users list: search + filter (active/inactive/invited) + paginate | filtered roster correct               | 🟡 teacher-journey           |
| A6.2 | Student detail: view lessons/assignments/repertoire/stats        | profile aggregates render             | 🟡 teacher-journey           |
| A6.3 | Create shadow student → set invite email → send invite           | invite dispatched, `invite_email` set | 🟡 integration (create only) |
| A6.4 | Edit student profile (name/email/phone/avatar)                   | changes persist                       | ❌                           |
| A6.5 | Manage student repertoire (add/remove song, priority, notes)     | repertoire entries persist            | ❌                           |
| A6.6 | View locked accounts → unlock                                    | counters cleared, account active      | ❌                           |
| A6.7 | Assign/revoke role (Admin/Teacher/Student)                       | role change persists                  | ❌                           |

### A7. Practice (admin read)

| ID   | Journey                                          | Key assertion                  | Cover |
| ---- | ------------------------------------------------ | ------------------------------ | ----- |
| A7.1 | View all students' practice sessions (read-only) | sessions list renders, no edit | ❌    |

### A8. Calendar integration (admin-only, backend-dependent)

| ID   | Journey                                                       | Key assertion                   | Cover                      |
| ---- | ------------------------------------------------------------- | ------------------------------- | -------------------------- |
| A8.1 | Calendar page: connected/disconnected status + connect button | status indicator correct        | ❌                         |
| A8.2 | Resolve a sync conflict (use_local / use_remote)              | conflict resolved, list shrinks | ❌ (needs seeded conflict) |
| A8.3 | Disconnect Google (revoke + stop webhook + delete rows)       | integration rows gone           | ❌ (needs OAuth)           |

### A9. AI assistant (admin-only)

| ID   | Journey                                                       | Key assertion                 | Cover                 |
| ---- | ------------------------------------------------------------- | ----------------------------- | --------------------- |
| A9.1 | AI playground: send message, switch model, clear conversation | response renders, reset works | ✅ ai/ai-playground   |
| A9.2 | Generate lesson notes via AI (student+song+title)             | notes stream into field       | ✅ ai/lesson-notes-\* |
| A9.3 | AI history: list, filter, star a generation                   | history persists              | ❌                    |

### A10. Notifications & settings (admin)

| ID    | Journey                                                | Key assertion            | Cover |
| ----- | ------------------------------------------------------ | ------------------------ | ----- |
| A10.1 | Notifications inbox: mark read / dismiss / clear all   | unread count updates     | ❌    |
| A10.2 | Notification preferences: toggle per-type opt-in/out   | prefs persist            | ❌    |
| A10.3 | API keys: create `gcrm_` key → copy → delete           | key created then revoked | ❌    |
| A10.4 | Request email change / account deletion (30-day grace) | request recorded         | ❌    |
| A10.5 | User settings: theme/language/timezone persist         | settings saved           | ❌    |

### A11. Tools / analytics (mostly stubs)

| ID    | Journey                                             | Key assertion           | Cover  |
| ----- | --------------------------------------------------- | ----------------------- | ------ |
| A11.1 | Fretboard trainer: select chord/scale, transpose    | fretboard renders notes | ❌     |
| A11.2 | Stats / health / logs / cohorts / skills pages load | page renders (smoke)    | ⏸ stub |

---

## PART B — Student journeys

### B1. Auth & onboarding

| ID   | Journey                                                           | Key assertion                           | Cover                   |
| ---- | ----------------------------------------------------------------- | --------------------------------------- | ----------------------- |
| B1.1 | Student sign in → `/dashboard`                                    | student dashboard renders               | ✅ role-login           |
| B1.2 | Sign up → email verify → onboarding (role/goal/skill) → dashboard | onboarding persists, lands on dashboard | ✅ sign-up + onboarding |
| B1.3 | Accept invitation link → claim account                            | role assigned on claim                  | ❌ (see Part D)         |

### B2. Dashboard & navigation (scoped)

| ID   | Journey                                                   | Key assertion                | Cover                     |
| ---- | --------------------------------------------------------- | ---------------------------- | ------------------------- |
| B2.1 | Student dashboard: next lesson + my songs, no admin cards | only student cards/nav shown | ✅ sidebar/today/upcoming |
| B2.2 | Sidebar shows only Learning + Progress groups             | admin nav hidden             | ✅ sidebar                |

### B3. Songs (read-only + request)

| ID   | Journey                                              | Key assertion            | Cover                 |
| ---- | ---------------------------------------------------- | ------------------------ | --------------------- |
| B3.1 | Browse songs, no "New Song" button                   | create control absent    | ✅ student/songs-read |
| B3.2 | View song detail — no edit/delete controls           | mutation controls absent | ✅ student/songs-read |
| B3.3 | Search songs + see resource links (YouTube/tabs/PDF) | results + links render   | ✅ student/songs-read |
| B3.4 | Request a song be added                              | request created (own)    | ❌                    |

### B4. Lessons (read-only, own-only)

| ID   | Journey                                                  | Key assertion                  | Cover                   |
| ---- | -------------------------------------------------------- | ------------------------------ | ----------------------- |
| B4.1 | Lessons list, no Create button                           | create control absent          | ✅ student/lessons-read |
| B4.2 | View lesson detail — no edit/delete, songs section shown | read-only render               | ✅ student/lessons-read |
| B4.3 | Only own lessons visible (RLS)                           | other students' lessons absent | ✅ student/lessons-read |

### B5. Assignments (read + status only)

| ID   | Journey                                          | Key assertion         | Cover                           |
| ---- | ------------------------------------------------ | --------------------- | ------------------------------- |
| B5.1 | Assignments list, no Create button               | create control absent | ✅ student/assignments-interact |
| B5.2 | Advance status not_started→in_progress→completed | status persists       | ✅ student/assignments-interact |
| B5.3 | No edit control for assignment content/due-date  | content read-only     | ✅ student/assignments-interact |
| B5.4 | Filter assignments by status                     | filtered list correct | ✅ student/assignments-interact |

### B6. Practice (self-service, immutable)

| ID   | Journey                                      | Key assertion         | Cover                                                |
| ---- | -------------------------------------------- | --------------------- | ---------------------------------------------------- |
| B6.1 | Log a practice session (song, minutes, date) | session recorded      | ✅ student/practice                                  |
| B6.2 | Delete same-day entry (undo) succeeds        | entry removed         | ✅ student/practice (incl. song-linked, PRA-1)       |
| B6.3 | Past sessions have no edit/delete control    | immutability enforced | ✅ student/practice                                  |
| B6.4 | Cannot see other students' sessions (RLS)    | only own sessions     | ✅ cross-role/rls-data-isolation (practice_sessions) |

### B7. Repertoire (self-rating only)

| ID   | Journey                                   | Key assertion          | Cover |
| ---- | ----------------------------------------- | ---------------------- | ----- |
| B7.1 | View own repertoire (teacher-managed set) | list renders own rows  | ❌    |
| B7.2 | Update own self-rating/difficulty         | rating persists        | ❌    |
| B7.3 | No add/remove repertoire controls         | set is teacher-managed | ❌    |

### B8. Profile, settings & notifications (own only)

| ID   | Journey                                                 | Key assertion          | Cover                   |
| ---- | ------------------------------------------------------- | ---------------------- | ----------------------- |
| B8.1 | Edit own profile (first name) → save → revert           | change persists        | ✅ student-full-journey |
| B8.2 | Notification preferences opt-in/out (own)               | prefs persist          | 🟡 student-journey      |
| B8.3 | API keys create/delete (own)                            | key lifecycle works    | ❌                      |
| B8.4 | Notifications inbox: mark read/dismiss (own)            | unread updates         | ❌                      |
| B8.5 | Fretboard / chord quiz: take quiz, attempt logged (own) | attempt saved          | ❌                      |
| B8.6 | Theory: read a granted course                           | granted course visible | ⏸ stub                  |

---

## PART C — Cross-role / access-control journeys

| ID  | Journey                                                                    | Key assertion                  | Cover                     |
| --- | -------------------------------------------------------------------------- | ------------------------------ | ------------------------- |
| C1  | Student blocked from `/dashboard/users`, `/ai`, `/calendar`, `/logs`       | redirect/403                   | 🟡 integration + journeys |
| C2  | Data isolation: student cannot read another student's rows                 | RLS denies cross-student       | 🟡 integration            |
| C3  | Teacher creates lesson → same student sees it read-only → teacher deletes  | lifecycle visible across roles | ✅ integration/workflows  |
| C4  | Teacher creates assignment → student advances status → teacher sees update | round-trip status              | 🟡 integration            |
| C5  | Demo accounts blocked from all mutations (403)                             | guard enforced                 | ✅ demo/mutation-guards   |
| C6  | Mobile/responsive: key pages on iPhone/iPad, bottom-nav, 44px targets      | no overflow, nav usable        | ✅ mobile                 |

---

## PART D — Backend dataflow journeys (integration-test candidates)

> These need mocked Google OAuth/Calendar and an email sink, so they belong in the Jest
> integration layer (`npm run test:integration` / `npm run test:rls`), **not** Playwright.
> Listed here so "whole application" coverage is honest about what UI E2E can't reach.
> Full traces live in the blueprint domain docs (02 calendar sync, 01 shadow claim,
> 07 notification pipeline).

| ID  | Flow                                                                                                                        | What to assert                                                                | Layer                              |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| D1  | Outbound: lesson CRUD → Google event (non-blocking)                                                                         | `google_event_id` stored; Google-down still persists lesson                   | integration (mock `lib/google.ts`) |
| D2  | Inbound: Google event → `isGuitarLesson` filter → dedupe by `google_event_id` → shadow student → lesson INSERT              | recurring series → N lessons, not 1                                           | integration                        |
| D3  | Shadow → invite → claim → `transfer_shadow_profile_references`                                                              | all FKs (lessons/assignments/repertoire/practice) migrate; shadow row removed | integration/RLS                    |
| D4  | Calendar reconcile: `reconcileCalendarForStudent` swaps future-event attendee                                               | per-event isolation; failures dead-letter to `system_logs`                    | integration                        |
| D5  | Notification chokepoint: `getDeliverableEmail` returns `null` for un-invited shadow → skip + `notification_log` (no bounce) | skip logged, no send                                                          | integration                        |
| D6  | Queue processor: backoff/retry on due rows; preference opt-out gates send                                                   | retries + opt-out respected                                                   | integration                        |

---

## Next steps

Implementing the ❌ gaps is follow-up work, best sliced per domain into separate PRs
(Practice, Repertoire, Notifications/Settings, Lesson song-status, Templates, Auth
recovery). Each new spec should reuse the helpers above and the non-demo test accounts,
and respect the login rate-limiter (reuse `tests/.auth/*.json` sessions; don't clear
between runs). See the CRUD rule of thumb in
[`../00-overview.md`](../00-overview.md) §Roles and each blueprint domain doc's
Behavior & rules for the per-entity CRUD rules each journey asserts.

---
created: 2026-07-22
updated: 2026-07-23
---

# Design Mockup Audit

Cross-reference of the "Strummy" Claude Design project (all screens explored there) against what
is actually mounted in this codebase today — and, for every mounted/reachable surface, whether it
has real test coverage. Not a domain doc — a one-time inventory + comparison, kept living so it
can be re-run cheaply if the design project grows.

## Source

Claude Design project: `https://claude.ai/design/p/40c432dc-2ce4-454c-9951-85656d2b4cff` — 45
pages (44 HTML view files + 1 combined-source rollup, `Strummy.html`, produced by the design tool
itself and not a distinct screen). Local copies live in `claude design - mockups/` (repo root —
not yet relocated under `docs/`; consider moving to `docs/app-blueprint/design-mockups/` if these
should be kept in-repo long-term, or `.gitignore` if they're meant to stay local-only), added
incrementally rather than all 44 at once.

**First local batch (2026-07-23)**, 9 "Standalone" single-file exports: `Lesson List`, `Lesson
Detail`, `Song Form A`, `Song Form B`, `Assignments Teacher`, `Assignments Student` re-export
screens already covered below (same implementation targets, no new gap — see the rows above);
`Lesson Form`, `Student Form`, and a dedicated full-page `Assignment Form` are **three screens not
in the original 44-file list** — see [Dedicated forms](#dedicated-forms-2026-07-23-standalone-batch)
below. Each ".html" in this batch is a self-contained compressed bundle (base64+gzip virtual
filesystem embedding React/ReactDOM/Babel-standalone plus the mockup's own JSX source) rather than
plain static markup — extract with a small script (decode each `{"mime","compressed","data"}`
entry, base64-decode, gunzip) to read the actual JSX/fields without a browser.

Each mockup is a standalone static HTML file (Tailwind + React-via-CDN, editorial "ivory/gold"
styling) — a visual direction, not implemented code. Several files share one implemented route
(desktop/mobile pairs; role-variant dashboards); a few are superseded drafts from earlier in the
same design session, kept for completeness per the "include everything" scope of this audit
rather than silently dropped.

## Status legend

**Implementation** reuses the app's own
[maturity legend](00-overview.md#maturity-legend-used-in-every-domain-doc) (**mounted** ·
**nav-hidden** · **dormant stub** · **unbuilt** · **aspirational**), plus two audit-only tags:
**superseded draft** (an earlier direction inside the same design session, replaced by a later
mockup in the same set — not evidence of a product gap) and **n/a** (a design-tool artifact, not
a screen).

**E2E** / **Unit** columns (methodology below):

| Symbol | Meaning                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| ✓      | a Playwright spec (E2E) or Jest test file (Unit) exists that directly exercises this surface                                |
| ~      | indirect/partial only — a generic smoke test, a sub-component test, or logic-only helper tests, not the full page/component |
| —      | no test found                                                                                                               |
| n/a    | no implementation to test (unbuilt/aspirational/superseded/n/a rows)                                                        |

## Marketing & auth

| Mockup                              | Represents                   | Implementation                                                                                                             | Status                                       | E2E                                                                                                   | Unit                                                                                                                          |
| ----------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Strummy - Landing Page Desktop.html | Public marketing page        | `/` → `components/landing/LandingPage` (unauthenticated only)                                                              | **mounted**                                  | ~ `smoke/critical-path.spec.ts` (generic: lang/main-landmark/nav-links, not landing-content-specific) | —                                                                                                                             |
| Strummy - Landing Page Mobile.html  | Same, responsive             | same route (responsive, no separate mobile route)                                                                          | **mounted**                                  | — (not in `mobile-responsiveness.spec.ts`'s page set)                                                 | —                                                                                                                             |
| Strummy Landing.html                | Earlier landing draft        | content folded into the current landing page per the design session's own chat log                                         | **superseded draft**                         | n/a                                                                                                   | n/a                                                                                                                           |
| Strummy - Auth Sign In.html         | Sign-in form                 | `app/(auth)/sign-in`                                                                                                       | **mounted**                                  | ✓ `auth/role-login.spec.ts`, `auth/sign-out.spec.ts`, mobile sign-in case                             | ✓ `SignInForm.test.tsx`, `sign-in/page.test.tsx`                                                                              |
| Strummy - Auth Role Select.html     | Dedicated role-choice screen | no such screen — role choice is one step (`StepRole.tsx`) inside the `/onboarding` wizard, not an auth-time screen         | **unbuilt** (concept exists, different flow) | n/a                                                                                                   | n/a                                                                                                                           |
| Strummy - Auth Magic Link Sent.html | Magic-link confirmation      | no magic-link flow anywhere — auth is password + Google OAuth only (`app/(auth)/*`)                                        | **unbuilt**                                  | n/a                                                                                                   | n/a                                                                                                                           |
| Strummy - Onboarding Teacher.html   | Teacher-specific onboarding  | `/onboarding` → `components/v2/onboarding` — one unified wizard (Welcome → Role → Goals → Skill Level), not split per role | **mounted** (as unified flow)                | ✓ `onboarding/complete-flow.spec.ts`, `manual/kuba-onboarding.spec.ts`                                | ~ schema/action only (`OnboardingSchema.unit.test.ts`, `onboarding.test.ts`) — no `StepRole`/`StepGoals`/etc. component tests |
| Strummy - Onboarding Student.html   | Student-specific onboarding  | same unified `/onboarding` wizard                                                                                          | **mounted** (as unified flow)                | ✓ same specs (flow isn't role-split)                                                                  | ~ same                                                                                                                        |

## Dashboards & users (01, 00-overview)

| Mockup                                  | Represents                     | Implementation                                                                                                                                               | Status                                                                                              | E2E                                                                                                               | Unit                                                                                                                                         |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Strummy - Teacher Dashboard.html        | Teacher home                   | `/dashboard` (role=teacher) → `TeacherDashboardEditorial`                                                                                                    | **mounted**                                                                                         | ✓ `dashboard/{sidebar,topbar,states}.spec.ts`, `teacher-full-journey.spec.ts`                                     | — (shell untested; only unrelated admin sub-widgets have tests)                                                                              |
| Strummy - Teacher Dashboard Mobile.html | Same, responsive               | same route, responsive                                                                                                                                       | **mounted**                                                                                         | ~ generic `mobile-responsiveness.spec.ts` dashboard case only                                                     | —                                                                                                                                            |
| Strummy - Teacher Direction A.html      | Early dashboard exploration    | superseded by the shipped Teacher Dashboard mockup in the same design session                                                                                | **superseded draft**                                                                                | n/a                                                                                                               | n/a                                                                                                                                          |
| Strummy - Teacher Direction B.html      | Early dashboard exploration    | superseded by the shipped Teacher Dashboard mockup                                                                                                           | **superseded draft**                                                                                | n/a                                                                                                               | n/a                                                                                                                                          |
| Strummy - Student Dashboard.html        | Student home                   | `/dashboard` (role=student) → `StudentDashboardEditorial`                                                                                                    | **mounted**                                                                                         | ✓ `dashboard/{sidebar,topbar,states}.spec.ts`, `student-full-journey.spec.ts`, `student-learning-journey.spec.ts` | —                                                                                                                                            |
| Strummy - Student Dashboard Mobile.html | Same, responsive               | same route, responsive                                                                                                                                       | **mounted**                                                                                         | ~ generic mobile dashboard case only                                                                              | —                                                                                                                                            |
| Strummy - Admin Dashboard.html          | Admin home                     | `/dashboard` (role=admin) → `AdminDashboardEditorial`                                                                                                        | **mounted**                                                                                         | ✓ `dashboard/{sidebar,topbar,states}.spec.ts`, `admin/{lockout-widget,system-logs,debug-dashboard}.spec.ts`       | ~ sub-widgets only (`AdminDashboardInsights`, `AIAssistantCard`, `EmailDraftGenerator`, `StudentProgressInsights`.test.tsx) — shell untested |
| Strummy - Admin Dashboard Mobile.html   | Same, responsive               | same route, responsive                                                                                                                                       | **mounted**                                                                                         | ~ generic mobile dashboard case only                                                                              | ~ same sub-widgets (viewport-agnostic)                                                                                                       |
| Strummy - Parent Dashboard.html         | Parent home                    | none — parent role is schema-only (`profiles.is_parent`), no parent UI exists (01)                                                                           | **aspirational**                                                                                    | n/a                                                                                                               | n/a                                                                                                                                          |
| Strummy - Student Detail -Healthy-.html | Student profile, healthy state | `/dashboard/users/[id]` → `StudentDetailEditorial` — one generic page, no status theming                                                                     | **mounted** (page exists; the "healthy" visual treatment itself isn't a distinct implemented state) | ✓ `teacher/users-management.spec.ts` (A6.2 renders profile, A6.4 edit/revert)                                     | ~ only the `.Repertoire` sub-tab is tested (`StudentDetailEditorialRepertoire...test`) — main shell untested                                 |
| Strummy - Student Detail -At Risk-.html | Student profile, at-risk state | "at-risk" is real (`getAtRiskStudents`) but surfaces as a **Teacher Dashboard card** (`BackfillCards.tsx`), not as status styling on the Student Detail page | **partial** — signal is mounted, on the wrong page vs. this mockup                                  | — (list/detail covered above; the at-risk card itself isn't asserted by any spec)                                 | ~ the query (`teacher-dashboard-backfill-queries.test.ts`) is unit-tested; the `BackfillCards` render is not                                 |

## Lessons (02)

| Mockup                              | Represents            | Implementation                                                                                                                | Status                                                                                            | E2E                                                                    | Unit                                   |
| ----------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| Strummy - Lesson List.html          | Teacher lesson list   | `/dashboard/lessons` → `LessonsListEditorial`                                                                                 | **mounted**                                                                                       | ✓ `teacher/lessons-crud.spec.ts`, `teacher/lesson-song-status.spec.ts` | —                                      |
| Strummy - Lesson List Mobile.html   | Same, responsive      | same route, responsive                                                                                                        | **mounted**                                                                                       | ✓ `@mobile`-tagged cases in `lessons-crud.spec.ts`                     | —                                      |
| Strummy - Lesson List Student.html  | Student-facing list   | same route, role-aware ("My Lessons")                                                                                         | **mounted**                                                                                       | ✓ `student/lessons-read.spec.ts` (`@mobile`-tagged)                    | —                                      |
| Strummy - Lesson Detail.html        | Lesson detail         | `/dashboard/lessons/[id]` → `LessonDetailEditorial`                                                                           | **mounted**                                                                                       | ✓ `lesson-song-status.spec.ts`, `lessons-crud.spec.ts`                 | —                                      |
| Strummy - Lesson Detail Mobile.html | Same, responsive      | same route, responsive                                                                                                        | **mounted**                                                                                       | ✓ `@mobile`-tagged cases                                               | —                                      |
| Strummy - Tablet Live Lesson.html   | In-lesson tablet view | `/dashboard/lessons/[id]/live` — **route deleted** (roadmap LES-1, Tranche 2, shipped since the domain doc's own last update) | **unbuilt** (was a dormant stub; now removed entirely — 90-roadmap.md confirms Tranche 2 shipped) | ✓ `teacher/deleted-stub-routes.spec.ts` explicitly asserts it 404s     | n/a (route gone, nothing to unit-test) |

## Songs & skills (03, 05)

| Mockup                                   | Represents               | Implementation                                                                                                      | Status                                                                                                                                                                                                                                                                          | E2E                                                                                    | Unit                                                                                                                           |
| ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Strummy - Song Detail.html               | Song detail              | `/dashboard/songs/[id]` → `SongDetailEditorial`                                                                     | **mounted**                                                                                                                                                                                                                                                                     | ✓ `teacher/songs-crud.spec.ts`, `student/songs-read.spec.ts`                           | ~ only `SongHeroEditorial` sub-component tested                                                                                |
| Strummy - Song Form A.html               | Song create/edit, dir. A | `/dashboard/songs/new`, `/dashboard/songs/[id]/edit` → `SongFormEditorial` (create), `SongEditFormEditorial` (edit) | **mounted, redesigned 2026-07-23** (A/B were two design directions; one shipped) — both create and edit now use the same sectioned two-column + live-preview layout as the other dedicated forms, brought in line when that pattern shipped for Lesson/Student/Assignment forms | ✓ `songs-crud.spec.ts` (full create → view → edit → search → delete lifecycle)         | ✓ `SongFormEditorial.test.tsx`, `SongEditFormEditorial.test.tsx` (new 2026-07-23 — 3 cases: pre-fill, live preview, hidden id) |
| Strummy - Song Form B.html               | Song create/edit, dir. B | same routes as Form A                                                                                               | **mounted, redesigned 2026-07-23** (alt direction, same implemented form)                                                                                                                                                                                                       | ✓ same                                                                                 | ✓ same components                                                                                                              |
| Strummy - Song Form Mobile.html          | Mobile step-wizard form  | same route, responsive — implemented as one page, not a step-wizard                                                 | **mounted** (form exists; wizard flow doesn't)                                                                                                                                                                                                                                  | ✓ `@mobile`-tagged create-song case                                                    | ✓ same component (viewport-agnostic)                                                                                           |
| Strummy - Fretboard Explorer.html        | Chord/scale visualizer   | `/dashboard/fretboard` → `components/fretboard/editorial/`                                                          | **nav-hidden** (URL-reachable, hidden under "Tools")                                                                                                                                                                                                                            | ✓ `teacher/fretboard.spec.ts` — 10 cases (key/scale/chord/interval toggles, URL state) | ~ `fretboard.helpers.test.ts` (pure logic only, no component render test)                                                      |
| Strummy - Fretboard Explorer Mobile.html | Same, responsive         | same route, responsive                                                                                              | **nav-hidden**                                                                                                                                                                                                                                                                  | ~ not project-restricted but no mobile-specific assertions                             | ~ same helpers                                                                                                                 |
| Chord Quiz Design.html                   | Chord quiz + SRS review  | `/dashboard/skills/chord-quiz` → `components/skills/ChordQuiz/`                                                     | **nav-hidden** — routed and working; parent "Skills" hub (`/dashboard/skills`) is still a stub (doc 05 **CHT-2**)                                                                                                                                                               | ✓ `student/chord-quiz-srs.spec.ts` — 6 cases (C1.1–C1.6)                               | ~ `chord-quiz.helpers.unit.test.ts` (logic only)                                                                               |

## Assignments (06) & notifications (07)

| Mockup                              | Represents              | Implementation                                          | Status      | E2E                                                        | Unit                                                                                                                                                                        |
| ----------------------------------- | ----------------------- | ------------------------------------------------------- | ----------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strummy - Assignments Teacher.html  | Teacher assign panel    | `/dashboard/assignments`, `/new`, `/[id]`, `/[id]/edit` | **mounted** | ✓ `assignments-crud.spec.ts`, `assignment-history.spec.ts` | ✓ `AssignmentsListEditorial.test.tsx`, `AssignmentDetailEditorial.test.tsx`, `AssignmentCreateEditorial.test.tsx` (updated 2026-07-23 for general fields/validation/submit) |
| Strummy - Assignments Student.html  | Student assignment view | same routes, role-aware ("From your teacher")           | **mounted** | ✓ `assignments-interact.spec.ts` (`@mobile`-tagged)        | ✓ same shells (viewport-agnostic)                                                                                                                                           |
| Strummy - Notifications.html        | Notification inbox      | `/dashboard/notifications`                              | **mounted** | ✓ `notifications/inbox.spec.ts`                            | ✓ `NotificationsEditorial.List.test.tsx`                                                                                                                                    |
| Strummy - Notifications Mobile.html | Same, responsive        | same route, responsive                                  | **mounted** | — (no `@mobile` case for notifications)                    | ✓ same (viewport-agnostic)                                                                                                                                                  |

## Dedicated forms (2026-07-23 Standalone batch)

Three screens added to the design project since the last full pass — not part of the original
44-file list. All three map to full-page create/edit forms that already existed and were routed,
but rendered as a single plain column (no sections, no live preview) — visually unlike the mockup.

**This pass**: (1) closed unit/E2E test gaps, (2) rebuilt the layout of all three — plus the
pre-existing Song Form (create + edit), for visual consistency across every dedicated form — to
match the mockup's numbered-section / two-column / sticky-preview-panel structure. New shared
primitives: `components/_editorial/FormSection.tsx`, `FormPreviewPanel.tsx`, `FormAvatar.tsx`, and
the `.ed-grid-form` CSS utility (`app/editorial-tokens.css`). Every native field kept its exact
`id`/`name` (student/song `<select>`, multi-select repertoire, etc.) — only the surrounding layout
changed — so no existing E2E selector needed to change, verified by running the full Jest suite
(267/267 suites) plus the E2E specs that exercise these routes.

| Mockup                                      | Represents                                 | Implementation                                                                                                                                                            | Status                                                                                                                                                                                                                                                                                                                                  | E2E                                                                                                                                                                                               | Unit                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strummy - Lesson Form (Standalone).html     | Dedicated lesson create/edit form          | `/dashboard/lessons/new`, `/dashboard/lessons/[id]/edit` → `LessonFormEditorial` (split into `LessonForm.Fields.WhoWhen`, `.Fields.SongsNotes`, `.Recurring`, `.Preview`) | **mounted, redesigned 2026-07-23** — two-column sectioned layout + live preview shipped; mockup's separate Date/Time/Duration/Format fields still collapse into one `datetime-local` input (no "format" in-person/video field in the schema)                                                                                            | ✓ `teacher/lesson-repeat-weekly.spec.ts` (create + recurring); ✓ `teacher/lessons-crud.spec.ts` full lifecycle (unskipped 2026-07-23 — routes are built, the "Coming Soon" skip reason was stale) | ✓ `LessonFormEditorial.test.tsx` (new 2026-07-23 — 8 cases: field render, new-student-by-email, recurring toggle create-only, validation, create/edit submit, server error) |
| Strummy - Student Form (Standalone).html    | Dedicated student create/edit form         | `/dashboard/users/new` → `CreateStudentForm` (split into `.Fields`, `.Preview`)                                                                                           | **mounted, redesigned 2026-07-23** — sectioned layout + avatar preview shipped; still an intentionally minimal invite-based form (first/last name + invite email + phone) — mockup's level/avatar-color/parent-contact/billing/recurring-schedule fields aren't implemented and would need new columns + RLS work, out of scope here    | ✓ `teacher/student-onboarding.spec.ts` A7.2 (renders, validates, submits, redirects to profile)                                                                                                   | ✓ `CreateStudentForm.test.tsx` (new 2026-07-23 — 4 cases: field render, required-field validation, submit success + redirect, server error)                                 |
| Strummy - Assignment Form (Standalone).html | Dedicated full-page assignment create/edit | `/dashboard/assignments/new`, `/[id]/edit` → `AssignmentCreateEditorial` (split into `.Fields`, `.Preview`, `useAssignmentFormSubmit`)                                    | **mounted, redesigned 2026-07-23** — sectioned layout + live preview shipped; single-student select kept (vs. mockup's multi-student chips — a true multi-assign would be a behavior change, not just layout, so deliberately out of scope) — no "submission type" selector, but has checklist + chord-drill editors the mockup doesn't | ✓ `teacher/assignments-crud.spec.ts`, `assignment-templates.spec.ts` (pre-existing)                                                                                                               | ✓ `AssignmentCreateEditorial.test.tsx` (broadened 2026-07-23 — was AI-wiring-only; added 5 cases for general fields/validation/submit)                                      |

## Settings (01)

| Mockup                               | Represents               | Implementation                                                                                   | Status                                              | E2E                                                                                                                                         | Unit                                                                   |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Strummy - Settings.html              | Settings home            | `/dashboard/settings` → `SettingsEditorial` — one page, not tabbed                               | **mounted**                                         | ✓ `settings/api-keys.spec.ts`, `settings/avatar-upload.spec.ts`, `notifications/prefs.spec.ts`                                              | ~ `NotificationPreferences.test.tsx` sub-section only — shell untested |
| Strummy - Settings Integrations.html | Integrations tab         | `IntegrationsSection` folded into the same `/dashboard/settings` page (not a separate tab/route) | **mounted** (content exists, not as a separate tab) | ~ indirectly via `teacher/calendar-conflicts.spec.ts` — same component, mounted on `/dashboard/calendar`, not asserted from Settings itself | —                                                                      |
| Strummy - Settings Members.html      | Team-members tab         | no such concept — Strummy has one teacher, not a multi-tenant team                               | **unbuilt** — not part of the current product model | n/a                                                                                                                                         | n/a                                                                    |
| Strummy - Settings Branding.html     | White-label branding tab | no such concept — single-teacher CRM, no tenant branding                                         | **unbuilt** — not part of the current product model | n/a                                                                                                                                         | n/a                                                                    |

## Shared UI states & exploration drafts

| Mockup                       | Represents                                       | Implementation                                                                                                                                                                      | Status                                              | E2E                                                     | Unit                                                                                          |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Strummy - Loading State.html | Generic loading skeleton                         | `components/ui/skeleton*.tsx` — shared pattern reused across list/detail pages, not a standalone screen                                                                             | **mounted** (as a shared component)                 | ✓ `dashboard/states.spec.ts` (DASH-004 smoke, per role) | ✓ `skeleton.test.tsx`                                                                         |
| Strummy - Empty State.html   | Generic empty-list state                         | **two** components exist: `components/shared/EmptyState.tsx` (in the Jest coverage scope, 0% covered) and `components/dashboard/states/EmptyState.tsx` — worth reconciling into one | **mounted** (as a shared component, but duplicated) | ✓ `dashboard/states.spec.ts`                            | — (0% line coverage on `components/shared/EmptyState.tsx`; no dedicated test file for either) |
| Sidebars.html                | 3 nav-sidebar directions (classic/rail/floating) | superseded — the actual nav is `components/dashboard/Sidebar`, none of the 3 explored directions                                                                                    | **superseded draft**                                | (real Sidebar: ✓ `dashboard/sidebar.spec.ts`)           | (real Sidebar: ~ `sidebar.helpers.test.ts`, logic only)                                       |
| Strummy Screens.html         | Whole-project canvas overview                    | a design-tool artifact compiling many screens onto one board (predates the 41 individually-extracted views)                                                                         | **n/a**                                             | n/a                                                     | n/a                                                                                           |
| Strummy.html                 | Combined source rollup                           | design-tool export the individual view files were extracted _from_                                                                                                                  | **n/a**                                             | n/a                                                     | n/a                                                                                           |

## Implementation rollup

| Status                 | Count | Notes                                                                                                                                                                    |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mounted                | 31    | includes desktop/mobile pairs, role-variant dashboards sharing one route, and the 3 dedicated-form screens added 2026-07-23 (Lesson Form, Student Form, Assignment Form) |
| partial                | 1     | at-risk signal exists, on a different screen than mocked                                                                                                                 |
| nav-hidden             | 3     | fretboard (desktop+mobile) + chord quiz — all URL-reachable, no nav entry                                                                                                |
| unbuilt / aspirational | 6     | auth role-select screen, magic-link auth, **tablet live lesson (route deleted since the design session)**, parent dashboard, settings Members, settings Branding         |
| superseded draft       | 4     | earlier directions inside the same design session, not product gaps                                                                                                      |
| n/a (tool artifact)    | 2     | `Strummy.html`, `Strummy Screens.html`                                                                                                                                   |

47 total mockups tracked (44 from the original design-project list + 3 net-new dedicated forms
added 2026-07-23; the other 6 files in the first local "Standalone" batch re-export screens already
counted above under their non-"(Standalone)" names, so they don't add to this count).

(Tablet Live Lesson moved from "dormant stub" to "unbuilt" versus the first pass of this audit —
verified against `tests/e2e/teacher/deleted-stub-routes.spec.ts` and `90-roadmap.md`, which show
the stub route was deleted outright as part of the LES-1 Tranche-2 sweep; `02-lessons-calendar.md`
still describes it as a live "Coming soon" stub and is the stale one here.)

## Test coverage

**Staleness note**: the percentages and per-row counts immediately below predate PRs #534–#536
(2026-07-22/23, "close unit/E2E gaps from the design-mockup audit") and today's 3-row addition —
they undercount current unit coverage significantly (e.g. every dashboard shell, `SongDetailEditorial`,
`SettingsEditorial`, `FretboardEditorial`, `ChordQuiz`, and `StudentDetailEditorial` gained tests in
those PRs, and the three dedicated-form rows above are net-new). Treat this section as a snapshot
of the _original_ pass, not current state; a full recount across all 47 rows is a separate task.

**Methodology**: for every row above with a real implementation (mounted / partial / nav-hidden —
34 rows; the deleted live-lesson route is excluded since there's nothing left to test), checked
whether (a) a Playwright spec under `tests/e2e/` exercises that route/flow, and (b) a Jest test
file exists for the component or its direct sub-parts. This is presence-of-test-file checking, not
line coverage — see the caveat below on why line coverage can't answer this for most of these
surfaces.

**Why not just read `coverage/coverage-summary.json`**: `jest.config.ts`'s `collectCoverageFrom`
deliberately scopes coverage collection to `lib/**`, `hooks/**`, `app/actions/**`,
`components/shared/**`, and `schemas/**` — "focus on business logic" per its own comment. The
page-shell "Editorial" components that back nearly every mockup above (`TeacherDashboardEditorial`,
`SongDetailEditorial`, `LessonsListEditorial`, `AssignmentDetailEditorial`, etc., all living under
`components/<domain>/editorial/`) are **not instrumented at all** — they'd show as 0% or simply
absent from the report even where a real component test exists elsewhere in the tree, and a "no
test" component contributes nothing either way. Presence-of-test-file is the only accurate signal
for these surfaces; coverage % is the right tool for `lib/`/`app/actions/`/`schemas/`, not for this
table.

**E2E** (34 testable rows): **25 have dedicated coverage** (74%), **6 more have partial/indirect**
coverage — a generic smoke test or a spec for the same component mounted elsewhere (18%) — leaving
**3 with none** (9%): Landing Page Mobile, Student Detail "at risk" card specifically, Notifications
Mobile.

**Unit/component** (33 testable rows, excluding the deleted live-lesson route): **7 have a direct
component-level test** (21%) — mostly forms and list sub-parts (`SignInForm`, `SongFormEditorial`,
`NotificationsEditorial.List`, `skeleton`). **12 more have partial coverage** (36%) — either a
helper/logic file is tested but the component render isn't (`fretboard.helpers`,
`chord-quiz.helpers`, `sidebar.helpers`), or only a sub-widget/sub-tab is tested while the page
shell isn't. **14 have no unit test at all** (42%) — notably every top-level dashboard shell
(`TeacherDashboardEditorial`, `StudentDashboardEditorial`, `AdminDashboardEditorial`) and every
Lesson surface.

**Overall Jest run** (fresh, `npm run test:coverage`, 245 suites / 3292 tests passed): **61.6%**
statements/lines, **85.8%** branches, **65.9%** functions — but per the caveat above, this measures
`lib/`, `hooks/`, `app/actions/`, `schemas/`, and `components/shared/` only, not the editorial UI
shown in these mockups. Two files currently miss their locked 100% thresholds:
`app/actions/assignment-edit.ts` (98.17% statements/lines, 95.08% branches) and
`lib/services/lessons-queries.ts` (81.97% statements/lines, 86.2% branches, 85.71% functions) —
pre-existing on this branch, unrelated to this audit, flagged here since `test:coverage`/`test:ci`
currently fails its own gate.

**Reading this table**: E2E is doing most of the verification work here — nearly three-quarters of
real surfaces have a dedicated Playwright spec, consistent with the project's stated pyramid
(component-level unit tests concentrate on forms, AI widgets, and shared primitives; the page shells
that assemble them are proven by browser tests instead of render tests). The gaps worth a second
look: **Landing Page** (no unit test, only a generic smoke E2E — the one page every visitor sees
first has the thinnest coverage of the set) and the **dashboard shells** (`TeacherDashboardEditorial`
/ `StudentDashboardEditorial` / `AdminDashboardEditorial`) — all E2E-covered for role/nav wiring but
none unit-tested directly.

## References

- Design project: `https://claude.ai/design/p/40c432dc-2ce4-454c-9951-85656d2b4cff`
- Local mockup copies: `claude design - mockups/` (repo root)
- Maturity legend: [00-overview.md](00-overview.md#maturity-legend-used-in-every-domain-doc)
- Domain detail: [01-identity-access.md](01-identity-access.md), [02-lessons-calendar.md](02-lessons-calendar.md),
  [03-songs-repertoire.md](03-songs-repertoire.md), [05-chords-theory.md](05-chords-theory.md),
  [06-assignments.md](06-assignments.md), [07-notifications-email.md](07-notifications-email.md)
- Test config: `jest.config.ts` (`collectCoverageFrom`, `coverageThreshold`), `playwright.config.ts`
  (project matrix), `tests/e2e/` (51 specs), [91-testing-strategy.md](91-testing-strategy.md)

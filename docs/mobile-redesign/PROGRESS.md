# Mobile Redesign — Implementation Progress

> **Last updated**: 2026-03-16
> **Base branch**: `main` (all feature specs + design system merged)
> **Implementation**: one branch per wave (see branch names below)

## Required Reading (BEFORE writing any code)

1. **[V2_DESIGN_SYSTEM.md](./V2_DESIGN_SYSTEM.md)** — spacing, tokens, patterns, animations, component structure
2. **Feature spec** (01-19) — routes, components, data contracts, pain points
3. **[`docs/UI_STANDARDS.md`](../UI_STANDARDS.md)** — general UI conventions
4. **[`lib/animations/variants.ts`]** — Framer Motion presets (use these, don't create new ones)

## Protocol

- Before starting a task, mark it `WIP (@agent-name)`
- When done, mark it `[x]`
- If blocked, mark it `BLOCKED (@agent-name) reason: ...`
- Always check this file before picking a task — skip anything marked WIP or BLOCKED

---

## Wave 1: Foundation (Sequential — blocks all other waves)

> **Branch**: `feature/STRUM-v2-foundation`
> **Depends on**: Nothing
> **Blocks**: Waves 2-5

### Step 2: v1/v2 Toggle System
- [x] Add `strummy-ui-version` cookie utility (`lib/ui-version.ts`) — read/write cookie, default `v1`
- [x] Modify `app/layout.tsx` — pass UI version to AppShell (done at root level, covers all pages)
- [x] Modify `components/layout/AppShell.tsx` — conditionally render v1 or v2 shell
- [x] Add `useUIVersion()` hook for client components to check version
- [x] Add server-side `getUIVersion()` helper for RSC pages

### Step 3: v2 Directory Structure
- [x] Create `components/v2/` directory tree mirroring domains
- [x] Create `components/v2/primitives/MobilePageShell.tsx` — page header + scroll + safe area
- [x] Move `components/shared/StepWizardForm.tsx` → `components/v2/primitives/StepWizardForm.tsx` (re-export)
- [x] Create `components/v2/primitives/SwipeableListItem.tsx` — list row with swipe actions
- [x] Create `components/v2/primitives/BottomActionSheet.tsx` — extends existing Drawer
- [x] Create `components/v2/primitives/CollapsibleFilterBar.tsx` — horizontal scroll filter chips
- [x] Create `components/v2/primitives/FloatingActionButton.tsx` — primary creation FAB
- [x] Create `components/v2/primitives/FullScreenSearchPicker.tsx` — mobile search overlay
- [x] Create `components/v2/primitives/index.ts` — barrel exports (all primitives)

### Step 3b: v2 Component Architecture Pattern
- [x] Create `hooks/use-ui-version.ts` — `useUIVersion()` hook
- [x] Create `components/v2/primitives/withLayoutMode.tsx` — mobile/desktop switching HOC/pattern
- [x] Verify `useLayoutMode()` and `useKeyboardViewport()` work with v2 shell
- [x] Add v2 toggle to Settings page (`components/settings/`) — "Try new mobile UI" switch

---

## Wave 2: Navigation + Dashboard + Quick Wins (4 agents parallel)

> **Depends on**: Wave 1 complete
> **Blocks**: Wave 3 (features depend on nav shell)

### Agent 1 — Navigation Shell
> **Branch**: `feature/STRUM-v2-foundation`

- [x] Create `components/v2/navigation/AppShell.tsx` — v2 mobile shell (responsive, lazy-loads desktop)
- [x] Create `components/v2/navigation/AppShell.Desktop.tsx` — v2 desktop sidebar layout
- [x] Create `components/v2/navigation/MobileBottomNav.tsx` — animated bottom nav with active indicator
- [x] Create `components/v2/navigation/MobileMoreMenu.tsx` — grouped drawer using menuConfig
- [x] Create `components/v2/navigation/Header.tsx` — compact v2 header with blur backdrop
- [x] Wire v2 shell into `AppShell.tsx` via cookie toggle
- [x] Test at 390px, 768px, 1440px
- [x] Dark mode verified

### Agent 2 — Teacher Dashboard
> **Branch**: `feature/STRUM-v2-foundation`
> **Spec**: [01-dashboard.md](./01-dashboard.md)

- [x] Create `components/v2/dashboard/TeacherDashboard.tsx` — mobile card stack
- [x] Create `components/v2/dashboard/TeacherDashboard.Desktop.tsx` — desktop grid
- [x] Create `components/v2/dashboard/widgets/AgendaWidget.tsx`
- [x] Create `components/v2/dashboard/widgets/StatsWidget.tsx`
- [x] Create `components/v2/dashboard/widgets/AttentionWidget.tsx`
- [x] Create `components/v2/dashboard/widgets/QuickActions.tsx` — FAB + action sheet
- [x] Wire into dashboard page with cookie check
- [x] Reuse `getTeacherDashboardData()` server action (no backend changes)
- [x] Test Teacher role at 390px, 768px, 1440px

### Agent 3 — Student Dashboard + Song of the Week
> **Branch**: `feature/STRUM-v2-foundation`
> **Specs**: [01-dashboard.md](./01-dashboard.md), [18-song-of-the-week.md](./18-song-of-the-week.md)

- [x] Create `components/v2/dashboard/StudentDashboard.tsx` — mobile card layout
- [x] Create `components/v2/dashboard/StudentDashboard.Desktop.tsx`
- [x] Create `components/v2/song-of-the-week/SOTWCard.tsx` — prominent mobile card (existing SongOfTheWeekCard reused)
- [x] Create `components/v2/song-of-the-week/SOTWPicker.tsx` — full-screen picker (admin)
- [x] Wire into dashboard page with cookie check
- [x] Reuse `getStudentDashboardData()` and `getCurrentSongOfTheWeek()` (no backend changes)
- [x] Test Student role at 390px, 768px, 1440px

### Agent 4 — Onboarding + Settings Toggle
> **Branch**: `feature/STRUM-v2-foundation`
> **Specs**: [19-onboarding.md](./19-onboarding.md), [09-profile-settings.md](./09-profile-settings.md)

- [x] Create `components/v2/onboarding/Onboarding.tsx` — full-screen step wizard
- [x] Create `components/v2/onboarding/StepRole.tsx` — large card role selection
- [x] Create `components/v2/onboarding/StepSkillLevel.tsx` — visual skill picker
- [x] Create `components/v2/onboarding/StepGoals.tsx` — chip-based goals
- [x] Create `components/v2/onboarding/StepWelcome.tsx` — welcome animation
- [x] Create `components/v2/settings/UIVersionToggle.tsx` — v1/v2 switch in settings
- [x] Reuse `completeOnboarding()` server action
- [x] Test at 390px (onboarding redirects completed users — expected; settings toggle verified)

---

## Wave 3: Tier 1 Features (4 agents parallel)

> **Depends on**: Wave 2 (nav shell must be merged)
> **Blocks**: Wave 4

### Agent 1 — Lessons
> **Branch**: `feature/STRUM-v2-lessons`
> **Spec**: [02-lessons.md](./02-lessons.md)

- [x] Create `components/v2/lessons/LessonList.tsx` — card-based list
- [x] Create `components/v2/lessons/LessonList.Desktop.tsx` — table view
- [x] Create `components/v2/lessons/LessonDetail.tsx` — mobile detail
- [x] Create `components/v2/lessons/LessonForm.tsx` — step wizard (Student → Songs → Schedule → Notes)
- [x] Create `components/v2/lessons/LiveLesson.tsx` — mobile live mode
- [x] Create `components/v2/lessons/LiveLesson.Desktop.tsx` — desktop live mode
- [x] Wire into lesson pages with cookie check
- [x] Reuse all existing hooks: `useLessonList`, `useLessonForm`, `useSongs`, `useProfiles`
- [ ] Test CRUD at 390px, 768px, 1440px as Teacher and Student

### Agent 2 — Songs
> **Branch**: `feature/STRUM-v2-songs`
> **Spec**: [03-songs.md](./03-songs.md)

- [x] Create `components/v2/songs/SongList.tsx` — enhanced mobile cards + filter chips
- [x] Create `components/v2/songs/SongList.Desktop.tsx` — desktop table
- [x] Create `components/v2/songs/SongDetail.tsx` — tabbed mobile detail
- [x] Create `components/v2/songs/SongDetail.Desktop.tsx` — side-panel detail
- [x] Create `components/v2/songs/SongForm.tsx` — generalized from MobileSongForm
- [x] Create `components/v2/songs/LyricsViewer.tsx` — mobile chord/lyric display
- [x] Create `components/v2/songs/VideoPlayer.tsx` — responsive video
- [x] Wire into song pages with cookie check
- [x] Reuse all hooks: `useSongList`, `useSongMutation`, `useSongDetail`, etc.
- [ ] Test CRUD at 390px, 768px, 1440px as Teacher and Student

### Agent 3 — Assignments + Repertoire
> **Branch**: `feature/STRUM-v2-assignments-repertoire`
> **Specs**: [04-assignments.md](./04-assignments.md), [05-student-repertoire.md](./05-student-repertoire.md)

- [x] Create `components/v2/assignments/AssignmentList.tsx` — card list with urgency
- [x] Create `components/v2/assignments/AssignmentList.Desktop.tsx`
- [x] Create `components/v2/assignments/AssignmentDetail.tsx` — mobile detail
- [x] Create `components/v2/assignments/AssignmentForm.tsx` — step wizard
- [x] Create `components/v2/assignments/TemplateList.tsx` — template cards
- [x] Create `components/v2/repertoire/RepertoireList.tsx` — priority sections
- [x] Create `components/v2/repertoire/RepertoireCard.tsx` — rich card
- [x] Create `components/v2/repertoire/SelfRating.tsx` — 48px touch stars
- [x] Create `components/v2/repertoire/AddSongSheet.tsx` — bottom sheet
- [x] Wire into pages with cookie check
- [ ] Test CRUD at 390px as Teacher and Student

### Agent 4 — Users/Students
> **Branch**: `feature/STRUM-v2-users`
> **Spec**: [06-users-students.md](./06-users-students.md)

- [x] Create `components/v2/users/UserList.tsx` — card-based student list
- [x] Create `components/v2/users/UserList.Desktop.tsx` — desktop table
- [x] Create `components/v2/users/UserDetail.tsx` — swipeable tab detail
- [x] Create `components/v2/users/UserDetail.Desktop.tsx` — multi-panel
- [x] Create `components/v2/users/UserForm.tsx` — step wizard
- [x] Create `components/v2/users/InviteFlow.tsx` — simplified mobile invite
- [x] Wire into user pages with cookie check
- [x] Reuse `useUsersList`, `useUserFormState` hooks
- [ ] Test CRUD at 390px as Teacher/Admin

---

## Wave 4: Tier 2-3 Features (4 agents parallel)

> **Depends on**: Wave 3 complete

### Agent 1 — Calendar + Notifications
> **Branch**: `feature/STRUM-v2-calendar-notifications`
> **Specs**: [07-calendar.md](./07-calendar.md), [08-notifications.md](./08-notifications.md)

- [x] Create `components/v2/calendar/Calendar.tsx` — agenda default on mobile
- [x] Create `components/v2/calendar/AgendaView.tsx` — list-based agenda
- [x] Create `components/v2/calendar/WeekStrip.tsx` — horizontal week selector
- [x] Create `components/v2/calendar/EventSheet.tsx` — bottom sheet
- [x] Create `components/v2/notifications/NotificationCenter.tsx` — grouped, swipeable
- [x] Create `components/v2/notifications/NotificationItem.tsx` — swipeable row
- [x] Create `components/v2/notifications/NotificationBell.tsx` — enhanced bell
- [x] Test at 390px

### Agent 2 — Profile/Settings + Theory
> **Branch**: `feature/STRUM-v2-settings-theory`
> **Specs**: [09-profile-settings.md](./09-profile-settings.md), [10-theory-courses.md](./10-theory-courses.md)

- [x] Create `components/v2/settings/Settings.tsx` — grouped iOS-style
- [x] Create `components/v2/profile/Profile.tsx` — mobile profile editor
- [x] Create `components/v2/theory/CourseList.tsx` — course cards
- [x] Create `components/v2/theory/ChapterReader.tsx` — mobile reader
- [x] Create `components/v2/theory/CourseForm.tsx` — step wizard
- [x] Test at 390px (lint passes, manual test needed)

### Agent 3 — Statistics + Health + Cohorts
> **Branch**: `feature/STRUM-v2-analytics`
> **Specs**: [14-statistics.md](./14-statistics.md), [13-student-health.md](./13-student-health.md), [12-cohorts.md](./12-cohorts.md)

- [x] Create `components/v2/stats/StatsOverview.tsx` — KPI cards + chart carousel
- [x] Create `components/v2/stats/ChartCarousel.tsx` — swipeable charts
- [x] Create `components/v2/stats/StudentStats.tsx` — progress ring
- [x] Create `components/v2/health/HealthDashboard.tsx` — card-based at-risk list
- [x] Create `components/v2/health/HealthCard.tsx` — student health card
- [x] Create `components/v2/cohorts/CohortDashboard.tsx` — sparkline cards
- [x] Test at 390px

### Agent 4 — Admin Tools + Skills
> **Branch**: `feature/STRUM-v2-admin`
> **Specs**: [15-admin-tools.md](./15-admin-tools.md), [11-skills.md](./11-skills.md)

- [x] Create `components/v2/admin/AdminDashboard.tsx` — status cards
- [x] Create `components/v2/admin/HealthCheck.tsx` — service status
- [x] Create `components/v2/admin/SpotifyQueue.tsx` — swipeable queue
- [x] Create `components/v2/admin/LogViewer.tsx` — mobile log display
- [ ] Create `components/v2/skills/SkillBrowser.tsx` — chip-based browser (DEFERRED — feature not needed yet)
- [x] Test at 390px

---

## Wave 5: Specialized + Cleanup (4 agents parallel)

> **Depends on**: Wave 4 complete

### Agent 1 — Interactive Fretboard
> **Branch**: `feature/STRUM-v2-fretboard`
> **Spec**: [16-fretboard.md](./16-fretboard.md)

- [ ] Create `components/v2/fretboard/Fretboard.tsx` — touch-optimized, pinch-zoom
- [ ] Create `components/v2/fretboard/Controls.tsx` — bottom sheet controls
- [ ] Create `components/v2/fretboard/TrainingMode.tsx` — large touch targets
- [ ] Landscape mode detection and hint
- [ ] Region focus: 5-7 frets visible, swipe to scroll
- [ ] Test on real iOS device (AudioContext)

### Agent 2 — AI Assistant
> **Branch**: `feature/STRUM-v2-ai`
> **Spec**: [17-ai-assistant.md](./17-ai-assistant.md)

- [ ] Create `components/v2/ai/AIChat.tsx` — mobile chat with auto-grow input
- [ ] Create `components/v2/ai/AIHistory.tsx` — card-based history
- [ ] Create `components/v2/ai/StreamingMessage.tsx` — optimized renderer
- [ ] Test streaming on mobile

### Agent 3 — Playwright Regression Tests
> **Branch**: `feature/STRUM-v2-e2e`

- [ ] Add Playwright spec: v2 toggle works (set cookie → see v2 UI)
- [ ] Add Playwright spec: Teacher dashboard at iPhone 12 viewport
- [ ] Add Playwright spec: Student dashboard at iPhone 12 viewport
- [ ] Add Playwright spec: Lesson CRUD at iPhone 12 viewport
- [ ] Add Playwright spec: Song CRUD at iPhone 12 viewport
- [ ] Verify v1 still works when cookie is `v1` or unset

### Agent 4 — v1 Cleanup + Final Polish
> **Branch**: `feature/STRUM-v2-cleanup`

- [ ] Remove v1/v2 toggle — make v2 default
- [ ] Delete deprecated v1 components listed in each spec
- [ ] Rename `components/v2/` → `components/` (or update imports)
- [ ] Update `docs/mobile-redesign/README.md` status column to reflect completion
- [ ] Full responsive audit: 390px, 768px, 1024px, 1920px

---

## Verification Checklist (Per Feature)

Run this checklist before marking any feature as complete:

- [ ] Tested at 390px (iPhone 15 Pro)
- [ ] Tested at 768px (iPad)
- [ ] Tested at 1024px (iPad landscape)
- [ ] Tested at 1920px (desktop)
- [ ] All CRUD operations work
- [ ] Tested as Teacher role
- [ ] Tested as Student role
- [ ] Tested as Admin role (where applicable)
- [ ] Dark mode verified
- [ ] 44px minimum touch targets
- [ ] iOS keyboard doesn't obscure inputs
- [ ] v2 shows same data as v1 (same server actions/hooks)
- [ ] No `any` types introduced
- [ ] All files < 200 LOC

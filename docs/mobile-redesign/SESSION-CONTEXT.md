# Mobile Redesign Session Context

> **Date**: 2026-03-16
> **Branch**: `feature/STRUM-v2-foundation`
> **Figma File**: https://www.figma.com/design/8JI2XXp8q60RLR6CdKpy67 (Strummy v2 — Mobile Redesign)

---

## Session Summary

This session focused on the v2 mobile-first redesign of Strummy. The user had previously launched 4 parallel agents to work on the mobile redesign, but the PC crashed. We restarted the work one-by-one: cleared all WIP markers, audited what the crashed agents completed, fixed issues, and progressed through Wave 1 and Wave 2 Agent 1.

---

## What Was Completed

### Wave 1: Foundation — FULLY COMPLETE (all 18 tasks)

All foundation tasks are done and checked off in PROGRESS.md:

1. **Cookie toggle system** (`lib/ui-version.ts`): Client-side cookie read/write for `strummy-ui-version`
2. **Server helper** (`lib/ui-version.server.ts`): Server-only `getUIVersion()` using `next/headers` cookies
3. **Root layout** (`app/layout.tsx`): Passes `uiVersion` to `<AppShell>`
4. **AppShell** (`components/layout/AppShell.tsx`): Conditionally renders v1 or v2 shell based on cookie
5. **useUIVersion hook** (`hooks/use-ui-version.ts`): Client hook for reading/writing UI version
6. **v2 directory structure** (`components/v2/`): Full directory tree created
7. **8 primitives** in `components/v2/primitives/`:
   - `MobilePageShell.tsx` — page header + scroll + safe area
   - `StepWizardForm.tsx` — re-export of shared wizard
   - `SwipeableListItem.tsx` — swipeable list rows
   - `BottomActionSheet.tsx` — extends Drawer
   - `CollapsibleFilterBar.tsx` — horizontal scroll filter chips
   - `FloatingActionButton.tsx` — primary creation FAB
   - `FullScreenSearchPicker.tsx` — mobile search overlay
   - `withLayoutMode.tsx` — mobile/desktop switching HOC
   - `index.ts` — barrel exports for all primitives
8. **Settings toggle** (`components/settings/UIVersionToggle.tsx`): "Try new mobile UI" switch in Settings page

### Wave 2, Agent 1: Navigation Shell — FULLY COMPLETE (6/8 tasks, 2 remaining are manual testing)

Created 5 new files + wired into existing AppShell:

1. **`components/v2/navigation/MobileBottomNav.tsx`** — Animated bottom nav with active indicator, role-aware tabs (Student sees Stats, Teacher sees Students), uses Framer Motion
2. **`components/v2/navigation/MobileMoreMenu.tsx`** — Grouped drawer menu for overflow items (Settings, Fretboard, Theory, Admin Tools), role-aware sections
3. **`components/v2/navigation/Header.tsx`** — Compact header with blur backdrop, greeting, user avatar, notification bell
4. **`components/v2/navigation/AppShell.tsx`** — Main v2 shell: mobile layout with bottom nav + header
5. **`components/v2/navigation/AppShell.Desktop.tsx`** — Desktop sidebar layout (lazy-loaded)
6. **`components/v2/navigation/index.ts`** — Barrel exports

**Remaining manual testing** (not done):
- [ ] Test at 390px, 768px, 1440px
- [ ] Dark mode verified

### Wave 2, Agent 2: Teacher Dashboard — Created by crashed agents

Files exist but haven't been fully verified/tested:
- `components/v2/dashboard/TeacherDashboard.tsx`
- `components/v2/dashboard/TeacherDashboard.Mobile.tsx` (note: .Mobile suffix, spec says just the main file)
- `components/v2/dashboard/TeacherDashboard.Desktop.tsx`
- `components/v2/dashboard/TeacherDashboard.Skeleton.tsx`
- `components/v2/dashboard/widgets/AgendaWidget.tsx`
- `components/v2/dashboard/widgets/AttentionWidget.tsx`
- `components/v2/dashboard/widgets/QuickActions.tsx`
- `components/v2/dashboard/widgets/StatsWidget.tsx`
- `components/v2/dashboard/widgets/index.ts`
- `components/v2/dashboard/index.ts`

---

## Bugs Fixed During Session

### 1. `lib/ui-version.ts` Server/Client Split (CRITICAL)

**Problem**: The original `lib/ui-version.ts` imported `cookies` from `next/headers` at the top, making the entire file server-only. Client components that needed the type/client functions would crash.

**Fix**: Split into two files:
- `lib/ui-version.ts` — Client-only: types (`UIVersion`), `COOKIE_NAME`, `DEFAULT_VERSION`, `getUIVersionFromCookie()`, `setUIVersionCookie()`
- `lib/ui-version.server.ts` — Server-only: `getUIVersion()` using `next/headers`

Updated imports in `app/layout.tsx` and `app/dashboard/page.tsx` to use `.server` variant.

### 2. `is_draft` Column Missing in Production DB

**Problem**: Songs page showed "Something went wrong" error. The query filtered on `is_draft` column which didn't exist in production.

**Fix**: Applied Supabase migration:
```sql
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT FALSE NOT NULL;
```

Also added `is_draft` to `SONG_LIST_COLUMNS` in `components/songs/list/index.tsx` (it was being filtered but not selected).

### 3. Lint Errors from Crashed Agents

**Fixed 2 lint issues:**
- `hooks/use-ui-version.ts` — setState-in-effect pattern
- `components/v2/primitives/FullScreenSearchPicker.tsx` — similar pattern

### 4. Student Profile `user_id` NULL (ROOT CAUSE of multiple student bugs)

**Problem**: 83 out of 103 profiles had `NULL` in the `user_id` column. The RLS policy `select_own_or_admin_profile` checks `user_id = auth.uid()`, so students couldn't read their own profiles. This caused:
- Dashboard showing "Role: User" instead of "Student"
- 404 error on statistics API
- Assignments showing "Profile not found"
- Songs showing teacher view instead of student view
- Wrong bottom nav tabs
- Repertoire/Stats redirecting incorrectly

**Fix**: Applied SQL update:
```sql
UPDATE profiles SET user_id = id WHERE user_id IS NULL AND id IN (SELECT id FROM auth.users);
```
This fixed 25 profiles that had matching auth.users entries. The remaining 78 are orphaned profiles without auth accounts.

---

## Figma File Contents

**File**: https://www.figma.com/design/8JI2XXp8q60RLR6CdKpy67

### Captured Pages (10 frames total)

| Frame | View | Notes |
|-------|------|-------|
| 1 | Teacher Dashboard (v1 baseline) | Desktop, admin sidebar visible |
| 2 | Teacher Dashboard (v2 nav shell) | Shows new v2 header/layout |
| 3 | Teacher Songs list (v2) | |
| 4 | Teacher Lessons list (v2) | |
| 5 | Student Songs (admin view) | |
| 6 | Student Assignments (admin view) | |
| 7 | Student Repertoire (admin view) | |
| 8 | Student Lessons (admin view) | |
| 9-14 | Admin Dashboard, Lessons, Assignments, Repertoire (recaptured with data) | Recaptured after fixing the `is_draft` bug |

**Note**: All captures are from admin user's perspective, not the student user. Some pages loaded with data, others captured in loading state.

---

## Playwright Screenshots (Student View)

**Location**: `docs/mobile-redesign/screenshots/`

18 screenshots captured (9 pages × 2 viewports: mobile 390px + desktop 1440px):

| Page | Mobile | Desktop |
|------|--------|---------|
| Dashboard | `student-dashboard-mobile.png` | `student-dashboard-desktop.png` |
| Songs | `student-songs-mobile.png` | `student-songs-desktop.png` |
| Lessons | `student-lessons-mobile.png` | `student-lessons-desktop.png` |
| Assignments | `student-assignments-mobile.png` | `student-assignments-desktop.png` |
| Repertoire | `student-repertoire-mobile.png` | `student-repertoire-desktop.png` |
| Stats | `student-stats-mobile.png` | `student-stats-desktop.png` |
| Settings | `student-settings-mobile.png` | `student-settings-desktop.png` |
| Fretboard | `student-fretboard-mobile.png` | `student-fretboard-desktop.png` |
| Theory | `student-theory-mobile.png` | `student-theory-desktop.png` |

**Capture script**: `scripts/capture-student-screens.ts` (uses Playwright, logs in as `student@example.com`)

### Issues Found in Screenshots (Before user_id fix)

| Page | Issues |
|------|--------|
| **Dashboard** | "Error loading statistics — API Error: 404", shows "Role: User" instead of "Student", bottom nav shows "Students" tab (should be "Stats") |
| **Songs** | Shows teacher view "Song Library" + "Create your first song" — student shouldn't see create button |
| **Lessons** | Shows v2 layout with "No lessons yet" — may be correct (test student has no lessons) |
| **Assignments** | "Failed to load assignments: Profile not found" — caused by user_id NULL |
| **Repertoire** | Empty with "Add Your First Song" — may be correct |
| **Stats** | Redirects to sign-in (role detection fails) |
| **Settings** | Works (shows theme, font toggles) |
| **Fretboard** | Works |
| **Theory** | Shows "No courses available" — correct for empty state |

**After user_id fix**: Most of these should be resolved. A fresh screenshot capture is needed to confirm.

---

## Uncommitted Changes (Working Tree)

### Modified files (tracked):
| File | Changes |
|------|---------|
| `app/dashboard/page.tsx` | Added v2 routing: imports `getUIVersion`, renders v2 dashboard if version is 'v2' |
| `app/layout.tsx` | Imports `getUIVersion` from `lib/ui-version.server`, passes to AppShell |
| `components/layout/AppShell.tsx` | Conditionally renders v1 or v2 shell based on `uiVersion` prop |
| `components/settings/SettingsPageClient.tsx` | Added UIVersionToggle import/render |
| `components/settings/SettingsSections.tsx` | Added v2 toggle section |
| `components/songs/list/index.tsx` | Added `is_draft` to SONG_LIST_COLUMNS |
| `docs/mobile-redesign/PROGRESS.md` | Updated all Wave 1 + Wave 2 Agent 1 tasks as complete |

### New untracked files:
| File | Purpose |
|------|---------|
| `.claude/skills/mobile-redesign/` | Skill definition for the mobile redesign workflow |
| `.claude/worktrees/` | Worktree tracking directory |
| `components/settings/UIVersionToggle.tsx` | v1/v2 toggle switch component |
| `components/v2/` | Entire v2 component directory (26 files) |
| `hooks/use-ui-version.ts` | Client-side UI version hook |
| `lib/ui-version.ts` | Client-side cookie utilities |
| `lib/ui-version.server.ts` | Server-side getUIVersion() |
| `scripts/capture-student-screens.ts` | Playwright screenshot capture script |
| `docs/mobile-redesign/screenshots/` | 18 student screenshots |

---

## Key Decisions Made

1. **Design-first approach acknowledged**: User pointed out we were coding without designs. Agreed that the flow should be Stitch (generate mockups) → Figma (polish) → Code. However, Wave 1 foundation code and nav shell were already built.

2. **Student MVP is top priority**: The v2 redesign should focus on completing the student-facing experience first (dashboard, lessons, songs, assignments, repertoire) before teacher/admin views.

3. **One-by-one execution**: After the crash, user decided to run tasks sequentially instead of 4 parallel agents.

4. **Screenshot-first verification**: User suggested using Playwright screenshots first to verify pages work, then capture to Figma for design iteration.

---

## Next Steps

### Immediate (before more v2 work)
1. **Re-run Playwright screenshots** — Verify the `user_id` fix resolved all student bugs
2. **Commit current work** — All changes are uncommitted on `feature/STRUM-v2-foundation`
3. **Decide on design workflow** — Should we design in Stitch/Figma before coding Wave 2 Agents 2-4?

### Wave 2 Remaining (unchecked in PROGRESS.md)
- **Agent 1 (Nav Shell)**: 2 manual testing tasks remaining
- **Agent 2 (Teacher Dashboard)**: 8 tasks — files exist from crashed agents but not verified
- **Agent 3 (Student Dashboard + SOTW)**: 7 tasks — not started
- **Agent 4 (Onboarding + Settings)**: 8 tasks — not started

### Student MVP Focus Areas
1. Fix practice hours (hardcoded to 12, should aggregate from practice_sessions)
2. Fix dashboard chart (fake weekly data)
3. Fix song metadata on dashboard (difficulty, duration mocked)
4. Student songs view — needs student-appropriate UI (hide create button, show assigned songs)
5. Student assignments view — needs to work after user_id fix

---

## File Reference

### Design System Docs
- `docs/mobile-redesign/V2_DESIGN_SYSTEM.md` — Spacing, tokens, patterns, animations
- `docs/mobile-redesign/PROGRESS.md` — Task tracker (source of truth for what's done/remaining)
- `docs/UI_STANDARDS.md` — General UI conventions

### Feature Specs (docs/mobile-redesign/)
- `01-dashboard.md` — Teacher + Student dashboard
- `02-lessons.md` — Lesson management
- `03-songs.md` — Song library
- `04-assignments.md` — Assignments
- `05-student-repertoire.md` — Student repertoire
- `06-users-students.md` — User management
- `07-calendar.md` — Calendar
- `08-notifications.md` — Notifications
- `09-profile-settings.md` — Profile/Settings
- `10-theory-courses.md` — Theory courses
- `11-skills.md` — Skills
- `12-cohorts.md` — Cohorts
- `13-student-health.md` — Student health
- `14-statistics.md` — Statistics
- `15-admin-tools.md` — Admin tools
- `16-fretboard.md` — Interactive fretboard
- `17-ai-assistant.md` — AI assistant
- `18-song-of-the-week.md` — Song of the Week
- `19-onboarding.md` — Onboarding

### Key Implementation Files
- `lib/ui-version.ts` — Client cookie utilities
- `lib/ui-version.server.ts` — Server getUIVersion()
- `hooks/use-ui-version.ts` — useUIVersion() hook
- `hooks/use-is-widescreen.ts` — useLayoutMode() hook (mobile/desktop detection)
- `components/layout/AppShell.tsx` — Main shell with v1/v2 branching
- `components/v2/navigation/` — v2 nav shell (5 files)
- `components/v2/primitives/` — v2 shared primitives (9 files)
- `components/v2/dashboard/` — Teacher dashboard (10 files, from crashed agents)
- `lib/animations/variants.ts` — Framer Motion animation presets

### Dev Credentials
- Admin: `p.romanczuk@gmail.com` / `test123_admin`
- Teacher: `teacher@example.com` / `test123_teacher`
- Student: `student@example.com` / `test123_student`

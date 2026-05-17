# V2 Polish Tracker — Road to 100%

> **Created**: 2026-03-16
> **Goal**: Fix every issue found in the deep analysis, bringing each feature to production-ready quality.
> **Protocol**: Mark tasks `WIP (@agent)` when starting, `[x]` when done.

---

## Feature 1: Foundation + Primitives (100/100)

### Critical
- [x] Fix `SwipeableListItem.tsx:106` — hardcoded `text-white` on action buttons. Use `text-primary-foreground` / `text-destructive-foreground`

### High
- [x] Fix `CollapsibleFilterBar.tsx:75` — chip height `h-9` (36px) below 44px minimum. Change to `h-11 min-h-[44px]`
- [x] Add `prefers-reduced-motion` support — create `useReducedMotion()` hook in `hooks/use-reduced-motion.ts`, wire into `lib/animations/variants.ts` so all animations respect user preference

### Medium
- [x] Fix inconsistent primitive usage — update `AssignmentList.tsx` to use `CollapsibleFilterBar` and `FloatingActionButton` instead of reimplementing inline
- [x] Fix inconsistent primitive usage — update `RepertoireList.tsx` to use `CollapsibleFilterBar` instead of reimplementing inline

---

## Feature 2: Navigation Shell (100/100)

### Medium
- [x] Verify all nav items have `aria-current="page"` on active state (audit `MobileBottomNav.tsx`, `AppShell.Desktop.tsx`)
- [x] Ensure `MobileMoreMenu` closes on route change (test with actual navigation)

---

## Feature 3: Teacher Dashboard (100/100)

### Critical
- [x] Fix `AttentionWidget.tsx:49` — replace client-side `fetch('/api/students/needs-attention')` with server-passed data from `getTeacherDashboardData()`

### High
- [x] Fix `TeacherDashboard.Desktop.tsx` — replace v1 imports (`SongOfTheWeekCard`, `StudentList`, `SongLibrary`, `RecentActivity`, `ProgressChart`) with v2 equivalents or purpose-built desktop widgets

### Medium
- [x] Add swipeable widget navigation to mobile teacher dashboard (spec requirement)

---

## Feature 4: Student Dashboard + SOTW (100/100)

### Critical
- [x] Fix `SOTWPicker.tsx:39-45` — move conditional `setSongs([])` + `searchSongsForSotw()` into `useEffect` to prevent render-loop / race conditions
- [x] Fix `Onboarding.tsx:39-45` — same React anti-pattern: setState during render. Move to `useEffect`

### High
- [x] Fix `SOTWCard.Content.tsx:22-26` — replace hardcoded `DIFFICULTY_STYLES` with design system `STATUS_STYLES` pattern (section 8)
- [x] Fix `SOTWCard.Content.tsx:86-94` — add `dark:` variants to resource link buttons (`bg-red-500`, `bg-green-500`, `bg-yellow-500`)

### Low
- [x] Remove unused `useCallback` import in `Onboarding.tsx:3`

---

## Feature 5: Onboarding (100/100)

### High
- [x] Add error boundary / fallback if v2 onboarding component fails to load (`app/onboarding/page.tsx`)
- [x] Add Suspense boundary with loading state while onboarding action completes
- [x] Make toast error more specific per step (currently generic "Please complete all required fields")

---

## Feature 6: Lessons (100/100)

### Critical
- [x] Fix `LessonList.Mobile.tsx:111-114` — remove `@ts-expect-error` suppressions. Added `scheduled_at` to `LessonSchema`, use null-coalescing fallback
- [x] Fix same pattern in `LessonDetail.tsx:49-52` and `LessonList.Desktop.tsx` — same null-coalescing pattern, also fixed v1 components that had stale `@ts-expect-error`
- [x] Fix `LessonForm.tsx:40-50` — add error toast when `handleSubmit()` returns `success: false`
- [x] Fix `LessonDetail.tsx:145` — use `ls.id` as React key instead of array index `idx`

### High
- [x] Wire `initialData` to form fields in `LessonForm.tsx` — already wired via `useLessonForm` hook which initializes state from `initialData`
- [x] Fix `LiveLesson` data type mismatch — verified page.tsx correctly maps `scheduled_at` to `scheduledAt` (camelCase), component expects camelCase, no mismatch exists
- [x] Add song status update buttons to `LiveLesson.Mobile.tsx` — already provided by `LiveSongCard` with `StatusStepper` component
- [x] Add lesson completion button to live mode — added `updateLessonStatus` server action and "Mark as Completed" button to both mobile and desktop live views

### Medium
- [x] Add loading/error states for student and song pickers in `LessonForm.tsx` — added error state with retry button when profile fetch fails
- [x] Split `LessonForm.tsx` (200 LOC) into `LessonForm.Pickers.tsx` with extracted `StudentPicker` + `SongPicker` (180 LOC main, 87 LOC pickers)
- [x] Add `dark:` variants to all status badge colors in `lesson.helpers.ts:48-61` — added explicit dark border variants for all statuses
- [x] Add stagger animation to song list in `LessonDetail.tsx` — wrapped song list with `staggerContainer` + `listItem` from variants
- [x] Make song items in LessonDetail clickable (navigate to song detail) — changed `div` to `button` with router.push to `/dashboard/songs/{id}`

### Accessibility
- [x] Add `role="tablist"`, `role="tab"`, `aria-selected` to any tab UI in lesson components — no tab UI exists in lesson components (uses filter chips and table), not applicable

---

## Feature 7: Songs (100/100)

### Critical
- [x] Verify `FormFieldText` / `FormFieldSelect` imports in `SongForm.tsx:8-12` exist — replace with shadcn/ui if missing
- [x] Fix `SongForm.tsx:29` — `createFormData(song)` crashes in create mode when `song` is undefined. Add mode check + defaults
- [x] Add `'use client'` directive to `SongDetailPage.tsx` (uses `useParams`)

### High
- [x] Add error component to `SongDetail.tsx` — currently shows skeleton forever if data fetch fails
- [x] Add iframe error handler + loading skeleton to `VideoPlayer.tsx:61-70`

### Medium
- [x] Fix `SongDetail.InfoTab.tsx:33` — change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for narrow screens
- [x] Fix tab bar in `SongDetail.Mobile.tsx:80-98` — thicker active border (`border-b-[3px]`), subtle inactive border

### Accessibility
- [x] Add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` to `SongDetail.Mobile.tsx:80-98`
- [x] Add `aria-label="Song lyrics with chord annotations"` to `LyricsViewer.tsx:76` `<pre>` tag

---

## Feature 8: Assignments + Repertoire (100/100)

### Critical
- [x] Fix `AssignmentForm.tsx:62-81` — `canAdvance()` at final step must validate `studentId` is set from step 0
- [x] Fix `RepertoireList.tsx:143-156` — FAB `onClick={onAddSong}` never receives the callback. Wire `onAddSong` in `app/dashboard/repertoire/page.tsx` to open `AddSongSheet`
- [x] Fix filter chip touch targets — change `h-9` to `h-11` in `AssignmentList.tsx:73`, `RepertoireList.tsx:100`

### High
- [x] Fix `AssignmentDetail.tsx:87` — add `pb-safe` and sticky positioning to bottom action buttons
- [x] Add `dark:` variants to `STATUS_STYLES` in `AssignmentList.Desktop.tsx:10-24`
- [x] Add edit handler to `RepertoireCard.tsx` (swipe-to-edit or inline edit button for teacher view)

### Medium
- [x] Fix `AddSongSheet.Content.tsx:87` — change `max-h-[300px]` to `max-h-[40vh]` for short phones
- [x] Sync `StatusFilter` type in `AssignmentList.tsx:17` with actual Assignment status values (missing 'cancelled')
- [x] Fix `SelfRating.tsx:66-90` — add `gap-1` between star buttons for touch safety

---

## Feature 9: Users (100/100)

### Critical
- [x] Fix `UserList.Mobile.tsx:104-109` — add confirmation dialog (AlertDialog) before swipe-delete
- [x] Fix `UserList.Filters.tsx:101-106` — filter chip height `h-9` (36px) → `h-11` (44px)

### High
- [x] Implement swipeable tab navigation in `UserDetail.TabBar.tsx` + `UserDetail.Mobile.tsx` (spec requires SwipeableTabs)
- [x] Add `/dashboard/users/invite` route wiring for `InviteFlow.tsx` (currently only full form at `/users/new`)

### Medium
- [x] Clarify desktop form approach — `UserFormV2` desktop lazy-loads v1 form. Document if intentional or implement v2 desktop form
- [x] Add missing intermediate component exports to `components/v2/users/index.ts`

---

## Feature 10: Calendar + Notifications (100/100)

### High
- [x] Fix `NotificationItem.tsx:80` — swipe drag constraint should be dynamic: `-72` for 1 button, `-144` for 2 buttons (currently hardcoded `-144`)
- [x] Fix `NotificationBell.tsx:107` — popover `w-96` (384px) overflows on 390px. Change to `w-[calc(100vw-32px)] sm:w-96`

### Medium
- [x] Fix `WeekStrip.tsx:109-115` — event indicator dot renders empty div when no events. Only render when `dayHasEvent` is true
- [x] Fix `AgendaView.tsx:37-42` — `getTimeLabel()` doesn't handle events spanning midnight
- [x] Fix `EventSheet.tsx:140` — add null check for `attendee.email` (can be undefined in Google Calendar API)
- [x] Fix function name mismatch: `NotificationBell.tsx:34` exports `NotificationBellV2` but should match filename convention

---

## Feature 11: Settings + Profile + Theory (100/100)

### High
- [x] Fix `Settings.Mobile.tsx:68-93` — `<select>` elements missing border and focus styling. Add `border border-border` and focus ring
- [x] Fix `CourseForm.tsx:45-85` — add per-step validation (don't allow "Next" if required field empty)
- [x] Fix `CourseForm.tsx:107` — add `disabled={isSubmitting}` to prevent double-submit

### Medium
- [x] Complete `ChapterReader.tsx` — implement prev/next chapter navigation (props exist but never rendered)
- [x] Add error handling to `UIVersionToggle.tsx:60-61` — try-catch on toggle, show error toast
- [x] Add "Loading your profile..." message to `Profile.tsx` loading state

---

## Feature 12: Stats + Health + Cohorts (100/100)

### Medium
- [x] Fix `HealthDashboard.tsx:59` — added `refetchOnWindowFocus: false` to both mobile and desktop variants
- [x] Fix `HealthCard.tsx:88-112` — action buttons now use icon-only below 400px via `hidden min-[400px]:inline` on labels, with `aria-label` for accessibility. Also fixed pre-existing `actions` → `headerActions` prop bug on MobilePageShell
- [x] Fix `HealthDashboard.tsx:17-21` — error messages now specific per HTTP status (401/403/5xx) with retry button. Both mobile and desktop variants updated
- [x] Verify `useCohortAnalytics` hook exists at `components/dashboard/cohorts/useCohortAnalytics.ts` — returns `{ data, isLoading, error }` with `CohortAnalyticsResult` shape matching `CohortDashboard.tsx` usage
- [x] Add `will-change-[stroke-dashoffset]` to `ProgressRing.tsx` progress arc for animation performance

---

## Feature 13: Admin Tools (100/100)

### Critical
- [x] Fix `LogViewer.tsx:20` — no `/api/admin/logs` endpoint exists. Replaced `SAMPLE_LOGS` placeholder with proper "coming soon" empty state (Terminal icon + message + API endpoint hint). Filter UI remains visible and functional

### High
- [x] Fix `SpotifyQueue.tsx:25` — `actionLoading` now tracks `{ matchId, action }` tuple. MatchCard shows spinner only on the specific button (approve or reject) being clicked, other button stays labeled but disabled
- [x] Add horizontal scroll to `LogViewer.EntryRow.tsx` — details `<pre>` block now wrapped in `overflow-x-auto` container, message text uses `break-words`

### Medium
- [x] Verify `/api/spotify/matches` endpoint exists at `app/api/spotify/matches/route.ts` — handles `status`, `page`, `limit` query params, returns `{ matches, pagination }` shape matching `SpotifyQueue.tsx` usage
- [x] Verify `/api/health` endpoint exists at `app/api/health/route.ts` — returns `HealthResponse` type from `types/health.ts` with `overall`, `services` (8 checks), `crons`, `checkedAt` matching `HealthCheck.tsx` expectations

---

## Cross-Cutting Issues

### Accessibility (all features)
- [x] `hooks/use-reduced-motion.ts` hook exists with `useReducedMotion()` (SSR-safe via `useSyncExternalStore`) and `getReducedMotion()` standalone function
- [x] Wire reduced-motion into Framer Motion — `lib/animations/variants.ts` exports `safeVariants()` and `safeMotionProps()` helpers. Wired into 3 animation-heavy components: `TeacherDashboard.Mobile.tsx`, `StudentDashboard.Mobile.tsx`, `SongList.Mobile.tsx`
- [x] Audit tab interfaces for ARIA compliance — `SongDetail.Mobile.tsx` has `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"` (fixed in Feature 7). `UserDetail.TabBar.tsx` has `role="tablist"`, `role="tab"`, `aria-selected` (fixed in Feature 9). `UserDetail.Mobile.tsx` has `role="tabpanel"`, `aria-label` on tab content (fixed in Feature 9)

### Design System Consistency
- [x] Global audit: every filter chip `min-h-[44px]` — `CollapsibleFilterBar.tsx` has `h-11 min-h-[44px]` (fixed in Feature 1), `UserList.Filters.tsx` has `h-11 min-h-[44px]` (fixed in Feature 9), `HealthDashboard.tsx` filter chips fixed from `h-9` to `h-11 min-h-[44px]`, `CohortDashboard.tsx` filter chips fixed from `h-9` to `h-11 min-h-[44px]`, `NotificationCenter.tsx` filter chips fixed from `h-9 min-h-[36px]` to `h-11 min-h-[44px]`
- [x] Global audit: every sticky bottom section has `pb-safe` — `AssignmentDetail.tsx` has `pb-safe` (fixed in Feature 8), `StepWizardForm.tsx` has `pb-safe` (used by `LessonForm.tsx` and `SongForm.tsx`), `AssignmentForm.tsx` has `pb-safe`, `InviteFlow.Steps.tsx` has `pb-safe`
- [x] Global audit: every status badge has `dark:` color variants — `lesson.helpers.ts` has dark border/text variants (fixed in Feature 6), `AssignmentList.Desktop.tsx` has dark variants (fixed in Feature 8), `SOTWCard.Content.tsx` has dark variants on resource links (fixed in Feature 4), all other badge implementations verified to include `dark:` variants

---

## Progress Summary

| Feature | Score | Tasks | Done | Remaining |
|---------|-------|-------|------|-----------|
| 1. Foundation + Primitives | 100 | 5 | 5 | 0 |
| 2. Navigation Shell | 100 | 2 | 2 | 0 |
| 3. Teacher Dashboard | 100 | 3 | 3 | 0 |
| 4. Student Dashboard + SOTW | 100 | 5 | 5 | 0 |
| 5. Onboarding | 100 | 3 | 3 | 0 |
| 6. Lessons | 100 | 14 | 14 | 0 |
| 7. Songs | 100 | 9 | 9 | 0 |
| 8. Assignments + Repertoire | 100 | 9 | 9 | 0 |
| 9. Users | 100 | 6 | 6 | 0 |
| 10. Calendar + Notifications | 100 | 6 | 6 | 0 |
| 11. Settings + Profile + Theory | 100 | 6 | 6 | 0 |
| 12. Stats + Health + Cohorts | 100 | 5 | 5 | 0 |
| 13. Admin Tools | 100 | 5 | 5 | 0 |
| **Cross-Cutting** | — | 6 | 6 | 0 |
| **TOTAL** | — | **84** | **84** | **0** |

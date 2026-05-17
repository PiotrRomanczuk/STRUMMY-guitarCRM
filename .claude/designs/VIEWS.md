# Strummy Design Bundle — Views Inventory

**Date**: 2026-05-17
**Source**: `kEawNS6zpNaaGYUURyKffw` (Claude Design handoff bundle)
**Bundle location**: `.claude/designs/strummy-design-bundle/`

This is **inventory only** — no implementation yet. Each entry maps to a source file in the bundle so we can pick what to implement and in what order.

## Design system shared across everything

- **Palette**: Editorial Light (ivory/paper + ink + gold `#ffd183` accent) with a dark "Virtuoso's Studio" variant (`#131313` base + same gold)
- **Type**: Fraunces serif (display) · Geist Sans (body) · Geist Mono (data)
- **Motifs**: fretboards, staff lines, chord grids, stave-as-timeline
- **Theme tweak**: light/dark toggle is already wired in every prototype

---

## 1. Landing Page (`Strummy Landing.html`)

Source: `src/landing-*.jsx`

| #   | View                                                                                                                                            | Viewport    | Component            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------- |
| 1.1 | Landing page — desktop (hero, day-in-the-life, 4 feature showcases, integrations bar, metrics, founder story, beta card, gold CTA band, footer) | 1440 × 5400 | `LandingPageDesktop` |
| 1.2 | Landing page — mobile (stacked, same content)                                                                                                   | 390 × 3600  | `LandingPageMobile`  |

---

## 2. Role-Specific Dashboards (newest, recommended starting point)

Source: `src/student-dashboard.jsx`, `src/teacher-dashboard.jsx`, `src/admin-dashboard.jsx`, `src/dashboard-shared.jsx`

| #   | View                                                                 | Viewport    | Component                |
| --- | -------------------------------------------------------------------- | ----------- | ------------------------ |
| 2.1 | Student dashboard — desktop (practice hero + lesson countdown)       | 1440 × 1024 | `StudentDashboard`       |
| 2.2 | Student dashboard — mobile                                           | 390 × 844   | `StudentDashboardMobile` |
| 2.3 | Teacher dashboard — desktop (day-spine schedule)                     | 1440 × 1024 | `TeacherDashboardNew`    |
| 2.4 | Teacher dashboard — mobile                                           | 390 × 844   | `TeacherDashboardMobile` |
| 2.5 | Admin dashboard — desktop (platform pulse + at-risk students two-up) | 1440 × 1024 | `AdminDashboard`         |
| 2.6 | Admin dashboard — mobile                                             | 390 × 844   | `AdminDashboardMobile`   |

---

## 3. Teacher Dashboard — earlier A/B explorations (reference only)

Source: `src/direction-a.jsx`, `src/direction-b.jsx`

| #   | View                                                                      | Viewport    | Component    |
| --- | ------------------------------------------------------------------------- | ----------- | ------------ |
| 3.1 | A · Editorial Light (safe SaaS)                                           | 1440 × 1024 | `DirectionA` |
| 3.2 | B · Music Manuscript (students as notes on a stave, piano-roll week view) | 1440 × 1024 | `DirectionB` |

> Kept for comparison; **Section 2 supersedes these** for the actual teacher dashboard.

---

## 4. Fretboard Explorer (`Strummy.html` canvas)

Source: `src/fretboard-explorer.jsx`, `src/fretboard-svg.jsx`, `src/fretboard-theory.jsx`

| #   | View                                                                   | Viewport    | Component                 |
| --- | ---------------------------------------------------------------------- | ----------- | ------------------------- |
| 4.1 | Fretboard explorer — desktop (3-column: controls / board / scale info) | 1440 × 1024 | `FretboardExplorer`       |
| 4.2 | Fretboard explorer — mobile (stacked, landscape hint)                  | 390 × 844   | `FretboardExplorerMobile` |

> Real music-theory engine: 12 scales, 12 chord qualities, CAGED shape resolution. Three fretboard style tweaks (Studio · Engraved · Mono).

---

## 5. Song Form (most field-heavy form in the app)

Source: `src/song-form-a.jsx`, `src/song-form-b.jsx`

| #   | View                                                                                                                        | Viewport    | Component        |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- |
| 5.1 | A · Editorial single-page (sticky preview, Spotify-assist, AI teaching notes, chord chips, strumming-pattern visual editor) | 1440 × 1200 | `SongFormA`      |
| 5.2 | B · Music Manuscript (Canto I–IV layout, dark score-card preview)                                                           | 1440 × 1200 | `SongFormB`      |
| 5.3 | C · Step wizard — mobile (4 steps: Essentials → Resources → Musical → Content)                                              | 390 × 844   | `SongFormMobile` |

---

## 6. Lesson Management (built in chat5, NOT wired into main canvas)

Source: `src/lesson-list.jsx`, `src/lesson-detail.jsx`, `src/lesson-primitives.jsx`, `src/lesson-data.jsx`

| #   | View                                                                                       | Viewport  | Component            |
| --- | ------------------------------------------------------------------------------------------ | --------- | -------------------- |
| 6.1 | Lesson list — desktop (table view, status filters)                                         | desktop   | `LessonList`         |
| 6.2 | Lesson list — mobile (cards)                                                               | 390 × 844 | `LessonListMobile`   |
| 6.3 | Lesson detail — desktop (header, song work, history, previous lessons)                     | desktop   | `LessonDetail`       |
| 6.4 | Lesson detail — mobile (collapsible sections)                                              | 390 × 844 | `LessonDetailMobile` |
| 6.5 | Lesson form / wizard — **not implemented in bundle** (mentioned in chat5 spec but no file) | —         | —                    |
| 6.6 | Live Mode — **not implemented in bundle** (mentioned in chat5 as bonus)                    | —         | —                    |
| 6.7 | Recurring lesson setup — **not implemented in bundle** (chat5 bonus)                       | —         | —                    |

> Includes shared primitives: `LessonStatusPill`, `StageStepper`, `DateBlock`, `FilterChip`, `PhoneFrame`.

---

## 7. Chord Quiz (`Chord Quiz Design.html`) — dark mode

Source: `project/screens/*.jsx`

| #   | View                                                  | Viewport                    | Component         |
| --- | ----------------------------------------------------- | --------------------------- | ----------------- |
| 7.1 | Quiz home — daily landing pad with mode cards + stats | mobile + desktop            | `QuizHomeScreen`  |
| 7.2 | In-quiz — the screen students see hundreds of times   | mobile + desktop            | `InQuizScreen`    |
| 7.3 | Feedback overlay — animated correct/incorrect reveal  | mobile (`density='mobile'`) | `FeedbackOverlay` |
| 7.4 | Summary — end of session                              | mobile + desktop            | `SummaryScreen`   |
| 7.5 | History — long-term mastery, per-chord rings          | mobile + desktop            | `HistoryScreen`   |

> Ships with a full `ChordQuizQuestion.tsx` source dump inside the HTML (per chat6).

---

## 8. Sidebar Variations (`Sidebars.html`)

Source: `project/sidebar-classic.jsx`, `sidebar-rail.jsx`, `sidebar-floating.jsx`

| #   | View                                                                                           | Viewport | Component         |
| --- | ---------------------------------------------------------------------------------------------- | -------- | ----------------- |
| 8.1 | 01 · Classic Wide (light, grouped, conventional)                                               | sidebar  | `SidebarClassic`  |
| 8.2 | 02 · Dual-Rail (dense pro-tool, dark)                                                          | sidebar  | `SidebarRail`     |
| 8.3 | 03 · Floating Command (compact pill, ⌘K palette, pinned-tiles grid, collapsed-to-glyphs state) | sidebar  | `SidebarFloating` |

> Three nav patterns for the app shell. Pick one (or combine) before implementing the dashboards.

---

## Totals

- **Total artboards**: ~24 distinct views across 8 feature areas
- **Already in canvas (`Strummy.html`)**: sections 1–5 (16 views)
- **Standalone HTML pages**: Landing (`Strummy Landing.html`), Sidebars (`Sidebars.html`), Chord Quiz (`Chord Quiz Design.html`)
- **Built but not in canvas**: Section 6 Lessons (4 views) — orphaned, would need wiring up

## Notes / decisions still open

1. **Sidebar choice** — three directions exist (8.1–8.3); we need to pick one before re-implementing the app shell, since every dashboard assumes a sidebar.
2. **Theme primary** — chat1 user picked light mode; chat6 (Chord Quiz) used dark. Need a decision on which is the app default (light is currently chosen for dashboards).
3. **Lessons missing pieces** — list + detail exist, but the **lesson form/wizard, Live Mode, and recurring lesson setup** were scoped in chat5 but never built. They'd need to be designed first or fabricated to match the existing aesthetic.
4. **Song form direction** — A (single-page) vs B (Canto manuscript) vs C (mobile wizard) — pick one for desktop before implementing.
5. **Teacher dashboard** — section 2.3 (day-spine) is the newest; sections 3.1/3.2 are earlier alternatives. Confirm 2.3 is the one to ship.

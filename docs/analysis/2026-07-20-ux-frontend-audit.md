# Frontend UX Audit — Teacher & Student, Desktop & Mobile

**Date**: 2026-07-20
**Author**: Claude (live walkthrough + code inspection)
**Scope**: Full UX pass of the dashboard app as `teacher@dev.local` and `student@dev.local`, at 1440×900 and 390×844, against the local dev stack (StudentDevelopment). Hover/cursor affordances, touch targets, responsiveness, dark mode, form and status UX. Evidence pinned to source files.

---

## Method

Live browser walkthrough (Playwright) of both roles at both viewports, with per-page JS probes (touch-target measurement, cursor/hover inspection, overflow detection), plus targeted code reading to pin each finding to its source. Screenshots captured for every page mentioned below.

---

## The three systemic root causes

Most individual issues below trace back to these three. Fixing them fixes whole classes of bugs at once.

### S1 — The editorial redesign is built on inline React `style={{}}` objects (HIGH)

56 files under `components/*/editorial/` style themselves with inline style objects; `app/editorial-tokens.css` contains **zero `@media` rules** and **zero `:hover` rules** (`app/globals.css` also has zero `:hover`). Inline styles cannot express hover states, media queries, or dark-mode variants. Consequences, all verified live:

- **No hover feedback anywhere in the editorial surfaces.** Student rows on People, song rows, roster/needs-attention/lesson rows, level/sort chips — all render with empty `class` attributes and show no visual change on hover (verified: background stays `rgba(0,0,0,0)` while hovered). Only the shadcn shell (sidebar nav, sign-out button) has `hover:` classes. Desktop users get zero "this is clickable" feedback beyond the arrow→hand cursor change on links.
- **No responsive behaviour in editorial layouts** (see M1, M2 below — content crushes or overflows at 390px).
- **Dark mode cannot apply to page content** (see S2).

Fix direction: move editorial primitives (Card, rows, chips, headers) to classes in `editorial-tokens.css` (or Tailwind utilities on the components) so `:hover`, `@media`, and `.dark` variants become expressible. The tokens are already CSS variables — the missing piece is class-based rules instead of per-element inline objects.

### S2 — Dark mode renders a broken half-dark hybrid (HIGH)

The sidebar theme toggle (`components/ui/mode-toggle.tsx`, rendered by `components/dashboard/Sidebar/Sidebar.Footer.tsx:45`) works — it sets `html.dark` via next-themes. But only the shadcn shell (sidebar + top header) responds; the entire main content of every editorial page stays cream/light because its colors are hard-coded inline (`var(--paper)`, `var(--ink)` — with no `.dark` overrides for those variables). Selecting "Dark" produces a jarring dark-frame/light-content split on every main page. Either wire the editorial CSS variables to `.dark` overrides, or remove/hide the toggle until dark exists — shipping a visibly broken theme switcher is worse than not offering one. Note: project rules mandate `dark:` variants on all styling; the editorial surfaces currently make that impossible (see S1).

### S3 — Two design systems coexist, page by page (MEDIUM)

- Editorial (serif Fraunces headings, mono uppercase labels, cream paper): Dashboard, Songs, Lessons, Assignments, People, Settings, sign-in.
- Old shadcn (sans headings, gray cards, brown primary buttons): **Calendar** (`/dashboard/calendar` — entirely old style), **Theory** (hybrid: serif heading + old brown buttons), admin pages, AI pages.

A teacher navigating Dashboard → Calendar experiences a different product. Decide the end state and finish the migration (or restyle the stragglers' shells at minimum).

---

## High-severity individual findings

### H1 — Mobile assignments: primary CTA clipped off-screen + horizontal page scroll

At 390px, the header row of `/dashboard/assignments` (`components/assignments/editorial/AssignmentsListEditorial.tsx:53-55` — inline `display:flex; justifyContent:space-between`, no wrap) pushes "+ New assignment" to x=359–516: **126px off-screen, only the "+" visible**, and the whole document gets `scrollWidth` 516 (horizontal scroll). This is the current feature branch's own page. "Templates" text-link + button need to wrap under the title on small widths.

### H2 — Teacher mobile dashboard: columns crush instead of stacking

`components/dashboard/editorial/teacher/TeacherDashboardEditorial.tsx:58-59` sets `gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)'` inline — no breakpoint possible. At 390px this renders 181px + 125px columns: "Needs attention" truncates the student name to "P…", the "7d" badge overlaps "last practiced" text, and the schedule's "11:52 AM" label collides with the hour-axis labels. Same file line 73-74 has a second `1fr 1fr` grid with the same problem.

### H3 — Chord cards broken for anything beyond 14 open chords

`components/songs/editorial/primitives.tsx:69` (`CHORD_SHAPES`) contains 14 shapes. On Wonderwall, 4 of 5 chords (Em7, Dsus4, A7sus4, Cadd9) hit the no-shape fallback (`primitives.tsx:94+`), which draws the chord name **again** inside the SVG at `y = padT − 10` ≈ 5px — clipped against the card's name label above it — plus a dashed "?" box. Every affected song detail (teacher and student) shows overlapping duplicated text and placeholder boxes. Either expand shapes (use a chord-shape library/derivation), or make the fallback a clean "no diagram" tile without re-rendering the name.

### H4 — Student dashboard lists "Untitled" songs (RLS-invisible rows leak through)

`lib/services/student-dashboard-queries.ts:63` falls back to `'Untitled'` when the joined song row is unreadable (RLS) or missing. Dev Student's "Songs you're working on" shows 3 "Untitled" rows with real practice minutes — confusing and leaks the existence of rows the student can't read. Filter out entries whose song can't be resolved instead of rendering a placeholder title. (The `/dashboard/songs` page filters correctly — only the dashboard widget leaks.)

### H5 — Hydration mismatch on Theory and AI Chat (live errors)

`components/v2/theory/CourseList.tsx:30` and `components/ai/chat/AIAssistant.tsx:39` both render `<Suspense fallback={<Mobile…/>}>` around the desktop variant — the SSR/client trees differ and React logs hydration failures on every visit (visible in dev overlay; whole tree regenerates client-side in prod). Use CSS-only responsive rendering (render both, toggle with classes) or a single component, not Suspense-fallback device switching.

### H6 — Checklist items: 13×13px tap target, label not clickable

`components/assignments/editorial/checklist/ChecklistView.tsx:59-75`: native checkbox (measured 13×13px) with the item text in a sibling `<span>` — no `<label>` wrapper, no `id`/`for`. On a phone the student must hit a 13px square; tapping the text does nothing (verified). Wrap each row in a `<label>` with padding so the whole row (≥44px) toggles. (The toggle interaction itself is good — optimistic, progress bar updates to "2/3 · 67%" instantly.)

---

## Medium-severity findings

- **M1 — Assignments search applies only on Enter, with no affordance.** Typing in "Search title…" does nothing (verified: no live filter, no debounce); pressing Enter navigates to `?q=`. No button, no hint. A user who types and waits concludes search is broken.
- **M2 — Three list pages, three filter models.** People: fields + "Filter" button. Songs: chips apply instantly but Key/Author/Title need "Apply". Assignments: chips instant + Enter-to-search. Pick one pattern (recommend: debounced live filtering; keep chips instant).
- **M3 — List vs detail disagree on overdue.** The list derives overdue at read time (`AssignmentsListEditorial.Row.tsx:63`, `lib/services/assignment-list-params.ts:149`) but the detail renders raw `assignment.status` (`components/assignments/editorial/detail/AssignmentDetailEditorial.tsx:64,112`) — an assignment shown OVERDUE in the list opens as "IN PROGRESS" with an unstyled due date. Use the same derived status on the detail page.
- **M4 — Status action buttons lack hierarchy and clear labels.** Student detail stacks two identical solid-black buttons ("Start working" / "Mark complete"). Teacher detail pairs "Mark complete" with "Cancel" — which cancels the _assignment_ but reads as a dialog-dismiss. Rename ("Cancel assignment"), differentiate weight, and consider confirmation for cancel.
- **M5 — Buttons render `cursor: default` app-wide.** Tailwind 4 preflight removed `cursor: pointer` from buttons and the shadcn base doesn't restore it — theme toggle, sign-out, section collapse headers, etc. all show the arrow cursor. One-line fix in the Button base / globals.
- **M6 — Songs list on mobile collapses to unlabeled fragments.** Row grid `md:grid-cols-[1fr_200px_100px_90px]` stacks to one column; author/level/key render as bare stacked values — for metadata-less songs the card is literally three floating dashes. Hide empty cells and label or inline the rest ("Beginner · Am").
- **M7 — Student song detail shows teacher analytics.** Students see "IN YOUR LIBRARY / Usage — Assigned to 1 students", "CURRENTLY LEARNING / Students — Dev S." about themselves. Role-adapt: show the student their own progress/practice on this song.
- **M8 — AI post-lesson summary offered for future lessons.** A SCHEDULED (not yet taught) lesson shows "Generate a comprehensive lesson summary" (`/dashboard/lessons/[id]`). Gate on completed status.
- **M9 — Practice durations formatted as raw minutes.** "889m", "812m" on student dashboard/detail; format as "14h 49m" (a `format.ts` already exists in the dashboard editorial folder).
- **M10 — Assignments/overdue state absent from both dashboards.** Neither the teacher's "Needs attention" (practice-recency only) nor the student's dashboard surface the 5 (teacher) / 1 (student) overdue assignments. The triage feature stops one click short of the landing pages.
- **M11 — Form validation is single-error, top-of-form only.** Empty "Create assignment" submit shows one red line above the form ("Give the assignment a title.") — the field isn't highlighted or focused, no `required` attributes, and fixing the title would only then reveal the student error. Inline per-field errors + focus the first invalid field.

---

## Low severity / polish

- **Sidebar search shows "⌘K" hint inside the mobile drawer** (touch users).
- **"+ New student" button crowds the "People" headline** (sits inline mid-headline at desktop).
- **Header caption duplicates tab counts** on Assignments ("23 total · 5 not started · …" + the same numbers in tabs).
- **Disabled inputs look editable** — Settings Email/Role are `disabled` but styled identically to editable fields.
- **"WITH AUTHOR" song-status label** is internal jargon in a student-facing dropdown; also statuses render as native selects on the student detail with no explanation of the progression.
- **"D DU UDU" strumming-pattern chip** on song detail is unexplained (tooltip or label it "Strumming").
- **Songs library widget (teacher dashboard)** wastes ~40% of its card as dead space and offers no "view all 22" link.
- **Sign-out is a 28×28px target** in the sidebar footer.
- **Orphaned routes**: `/dashboard/theory` is reachable but linked from no nav (teacher or student); also check `/dashboard/repertoire` (student-only nav), `/dashboard/stats`, `/dashboard/cohorts`, `/dashboard/skills`.
- **Dev data pollution**: 7 "RLS fixture/practice-undo/content-tables" songs appear at the top of the teacher songs list, the dashboard Songs widget, and (twice each, duplicated) in the New-assignment song dropdown. Dev-only, but it wrecks demos — consider tagging fixtures and filtering them from UI queries, or cleaning the seed.

---

## What already works well

- The editorial aesthetic is distinctive and coherent across the migrated pages; empty states are well-written (Templates, "Next lesson", Theory).
- Assignments triage: overdue-first sort with red dates reads instantly; tab counts are accurate; student mobile list adapts to clean cards.
- Checklist progress updates optimistically with correct percentages.
- Mobile drawer nav is complete and consistent for both roles; role-specific nav ("My Lessons/My Songs/My Assignments", Learning/Progress groups) is correct.
- Student delete is guarded by a two-step confirm (`components/users/editorial/DeleteShadowButton.tsx`).
- No horizontal overflow anywhere except H1; student-facing pages properly hide teacher actions (no "+ New", no student selector).
- "Generate Assignment" AI button correctly disabled with `cursor: not-allowed` until prerequisites are met.

---

## Recommended fix order

1. **S1 partially + H1 + H2** — introduce class-based styling for the editorial layout primitives (header rows, two-column grids) with mobile breakpoints. This unclips the assignments CTA and fixes the dashboard crush in one pattern change.
2. **H6 + M5** — label-wrap checklist rows; restore `cursor-pointer` on buttons. Tiny diffs, big affordance wins.
3. **H3** — chord fallback cleanup (and shape-dictionary expansion later).
4. **H4** — filter unresolvable songs in `getStudentTopSongs`.
5. **M3 + M4** — derived status on detail + button labels/hierarchy (small, same feature area as the branch).
6. **S2** — decide dark mode: either `.dark` variable overrides for editorial tokens or hide the toggle.
7. **H5** — replace Suspense device-switching with CSS responsive rendering.
8. **M1/M2** — one filter interaction model across the three list pages.
9. **S3** — finish migrating Calendar/Theory/AI shells to editorial.
10. **M7 + M10** — role-adapt song detail; surface overdue assignments on both dashboards.

---

## Evidence

Screenshots from the walkthrough (teacher/student × desktop/mobile, incl. dark-mode hybrid, form error state, checklist, clipped CTA) are in the session scratchpad `ux-audit-shots/`; re-runnable via the local dev stack with `teacher@dev.local` / `student@dev.local` (passwords reset 2026-07-20 to `test123_teacher` / `test123_student` on the dev DB, rate limiter cleared).

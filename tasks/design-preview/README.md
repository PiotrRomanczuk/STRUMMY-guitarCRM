---
created: 2026-06-08
updated: 2026-06-09
---

# Design Preview — per-section TODO index

These are per-section trackers for porting the remaining `Strummy.html` design-handoff sections to `/design-preview/<slug>`. The foundation (theme, fonts, primitives, sidebar w/ search, topbar, ArtboardStage) is already on `main`.

## How to use

For each section, the `.md` file in this folder records:

- **Status** — `not-started` / `partial` / `complete` / `merged`
- **Files already on disk** — incomplete drafts left by the original parallel-agent run on 2026-06-08
- **Source files to read** — paths under `/tmp/strummy-design/strummy/project/src/`
- **Artboards to mount** — what to expose at `/design-preview/<slug>`
- **Remaining TODO** — concrete next steps

When picking up a section: read its `.md` first, then read the source files, then either continue the partial draft or rewrite. The partial drafts are NOT guaranteed to compile — verify each file or rebuild.

## Mockup status (as of 2026-06-09)

| #   | Slug                                  | Title                        | Mockup status | Mockup PR                         |
| --- | ------------------------------------- | ---------------------------- | ------------- | --------------------------------- |
| 1   | [lessons](./lessons.md)               | Lesson Management            | partial       | uncommitted on `main`             |
| 2   | [student-detail](./student-detail.md) | Student Detail               | scaffold-only | uncommitted on `main`             |
| 3   | [song-detail](./song-detail.md)       | Song / Repertoire Detail     | **merged**    | #431 — shipped 2026-06-09 ✅      |
| 4   | [assignments](./assignments.md)       | Assignments                  | **merged**    | #432 — shipped 2026-06-09 ✅      |
| 5   | [auth](./auth.md)                     | Authentication               | **merged**    | #429 — shipped 2026-06-08 ✅      |
| 6   | [onboarding](./onboarding.md)         | Onboarding                   | **merged**    | #430 — shipped 2026-06-08 ✅      |
| 7   | [settings](./settings.md)             | Settings                     | not-started   | —                                 |
| 8   | [notifications](./notifications.md)   | Notifications / Activity     | not-started   | —                                 |
| 9   | [states](./states.md)                 | Empty + Loading States       | not-started   | —                                 |
| 10  | [tablet](./tablet.md)                 | Tablet — iPad on Music Stand | not-started   | —                                 |
| 11  | [parent](./parent.md)                 | Parent View                  | not-started   | —                                 |
| 12  | [fretboard](./fretboard.md)           | Fretboard Explorer           | not-started   | —                                 |
| 13  | [song-form](./song-form.md)           | Song Form                    | not-started   | —                                 |
| 14  | [landing](./landing.md)               | Landing Page                 | not-started   | `feature/STRUM-landing-cinematic` |

> For **production wiring status** (what's on `/dashboard/*` vs mockup-only), see [IMPLEMENTATION.md](./IMPLEMENTATION.md).
> For **full migration spec** (data sources, mutations, v1/v2 deletion targets), see [production-plan.md](./production-plan.md).

## Foundation cheat-sheet (already on main)

Import these in any new section file:

```
@/components/design-preview/lib/icons         — Icon, I (icon path dictionary)
@/components/design-preview/lib/types         — Health, Student, etc.
@/components/design-preview/lib/mock-data     — TODAY, STUDENTS, AGENDA, etc.
@/components/design-preview/primitives/atoms  — Avatar, HealthDot, Eyebrow, PulseDot, TimeAgo
@/components/design-preview/primitives/CountUp        — CountUp({to, format?: 'plain' | 'comma'})
@/components/design-preview/primitives/ProgressBar
@/components/design-preview/primitives/StatusPill     — StatusPill, SONG_STATUS
@/components/design-preview/primitives/StringVibration
@/components/design-preview/primitives/FretProgress
@/components/design-preview/primitives/TabRule
@/components/design-preview/primitives/TabNotation
@/components/design-preview/shell/SidebarNav  — Sidebar w/ embedded search at top
@/components/design-preview/shell/TopBar
@/components/design-preview/shell/ArtboardStage — wrap your artboards in this
```

## Conventions (non-negotiable)

1. **TypeScript only.** No `any`. Use `unknown` if truly opaque.
2. **Inline styles** via `style={{...}}`. Match prototype pixel-perfectly — don't translate to Tailwind.
3. **Curly quotes** inside JSX text: `’` for apostrophes, `“ ”` for double quotes. Straight `'` and `"` trigger `react/no-unescaped-entities`.
4. **`'use client'`** only when using `useState`, `useEffect`, `useRef`, or DOM event handlers. Pure render components stay server.
5. **Section-local mock data** goes in `components/design-preview/<slug>/data.ts`. Don’t extend `lib/mock-data.ts` — creates merge conflicts.
6. **Section-local types** go in `components/design-preview/<slug>/types.ts`. Don’t extend `lib/types.ts`.
7. **One PR per section.** Branch: `feature/design-preview-<slug>`.

## Workflow per section

1. Read this section’s `.md`.
2. Read the prototype source files listed.
3. Audit the partial files on disk (if any) — keep or rewrite.
4. Implement.
5. Run lint scoped to your paths: `npx eslint components/design-preview/<slug> app/design-preview/<slug>`.
6. Fix any errors.
7. Branch off `main`, stage only your paths, commit, push, open PR.

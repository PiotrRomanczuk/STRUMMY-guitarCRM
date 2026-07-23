# Mockup → Implementation status

**Updated**: 2026-07-23 · **Source of truth for**: which editorial mockups are built, how faithfully, and what's left.

Full visual gap analysis (screenshots + per-screen breakdown): [`docs/2026-07-23-editorial-mockups-vs-implementation.html`](../../docs/2026-07-23-editorial-mockups-vs-implementation.html) in the repo.

## Legend

| Mark | Meaning                                              |
| ---- | ---------------------------------------------------- |
| ✅   | Live, high fidelity, only minor gaps                 |
| ⚠️   | Live, but notable divergences / unbuilt sub-features |
| ⛔   | Not built **by design** (direction not taken)        |
| 🚀   | Fixed this cycle                                     |

## Batch 01 — core editorial views (`batch-01-core-editorial/`)

All nine are **mounted on live routes**. The editorial design _system_ (tokens, section chrome, sticky preview, typography) is reproduced with high fidelity across the board; gaps are per-screen sub-features and interaction-craft, not missing screens.

| Screen                     | Route                                      | Component                   | Fidelity | Status | Headline open gaps                                                                                                                                                                               |
| -------------------------- | ------------------------------------------ | --------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Assignment Form            | `/dashboard/assignments/new` · `[id]/edit` | `AssignmentCreateEditorial` | High     | ✅     | single-student `<select>` (mockup = multi-student pills); `FormSection` not collapsible                                                                                                          |
| Assignments — Teacher      | `/dashboard/assignments`                   | `AssignmentsListEditorial`  | Medium   | ⚠️     | no inline quick-assign composer (uses a separate form route); flat status-pill tint                                                                                                              |
| Assignments — Student      | `/dashboard/assignments/[id]`              | `AssignmentDetailEditorial` | Medium   | ⚠️     | no practice-log chart, no record-audio/file submission, no teacher-review gate _(v1.1)_                                                                                                          |
| Lesson List                | `/dashboard/lessons`                       | `LessonsListEditorial`      | High     | ✅     | no true mobile-card view (grid just stacks); "Recurring…" action dropped; flat status-pill tint                                                                                                  |
| Lesson Detail              | `/dashboard/lessons/[id]`                  | `LessonDetailEditorial`     | Medium   | ⚠️ 🚀  | 🚀 responsive grid fixed (#538). Left: Quick-assign actions exist but **unwired**; "+ Add song"; per-song notes & history; "Start live lesson" _(v1.1)_; DateBlock graphic; delete/recap buttons |
| Lesson Form                | `/dashboard/lessons/new` · `[id]/edit`     | `LessonFormEditorial`       | Medium   | ⚠️     | widget downgrades: student pills → `<select>`, split date/time → one `datetime-local`, song-card grid → `<select multiple>`                                                                      |
| Song Form A ("Editorial")  | `/dashboard/songs/new`                     | `SongFormEditorial`         | High-Med | ✅     | **this direction shipped.** No multi-image gallery (`gallery_images` column exists, unused); auto-filled fields not gold-highlighted; sections not collapsible; no Cancel button                 |
| Song Form B ("Manuscript") | —                                          | not built                   | —        | ⛔     | direction **not taken** — no Canto/manuscript/dark-score-card DNA anywhere. Documented, not a gap.                                                                                               |
| Song Detail                | `/dashboard/songs/[id]`                    | `SongDetailEditorial`       | Low-Med  | ⚠️ 🚀  | 🚀 lyrics view shipped (#539). Still: no audio player (`audio_files` unused), no tablature, no sections/progressions, no quick-assign panel, no hero duplicate/assign _(mostly v1.1)_            |
| Student Form               | `/dashboard/users/new`                     | `CreateStudentForm`         | High     | ✅     | parent-email "required" not enforced; `FormSection` not collapsible                                                                                                                              |

## Prioritized backlog (what to implement next)

### Tier 1 — latent (built, just not wired) — best ROI

- **Lesson Detail → "Quick-assign from all N songs"**: `quickAssignSongFromLesson` / `bulkAssignSongsFromLesson` fully implemented in `app/dashboard/lessons/actions.ts` (dedup + due-date inference), but no component calls them. Needs a button.
- **Song Form → multi-image gallery**: `gallery_images` column exists and is read on detail; form manages only a single cover.

### Tier 2 — correctness / consistency / polish (safe pre-launch)

- **`FormSection` collapsibility** (`components/_editorial/FormSection.tsx`) — shipped component is purely presentational; restoring the toggle fixes _every_ form (student · lesson · assignment · song) at once.
- **Student Form**: enforce "parent email required" (policy call + one validation line).
- **Polish**: gold-highlight Spotify auto-filled fields; restore per-status pill _tints_ on Lesson List; add missing Cancel / "+ Add song" affordances.

### Tier 3 — real features, defer to v1.1 (per the trust-pass roadmap)

- Lesson Detail: "Start live lesson", per-song notes & history, DateBlock graphic.
- Song Detail: audio player, tablature, sections/progressions.
- Assignments: multi-student assign; the student **submission surface** (practice chart, record-audio, review gate).
- Lesson Form: restore avatar-pill student picker + checkbox song-card grid.

> **Strategic note**: the blueprint frames the current phase as a **trust pass, not a feature pass** — Tier 3 items are the "new student-facing features wait for real usage (v1.1)" work the roadmap deliberately parks. Prefer Tier 1 → Tier 2 before launch.

## Shipped this cycle

- **#538** `fix(lessons)` — Lesson Detail two-column grid now stacks on mobile (`.ed-grid-hero`).
- **#539** `fix(songs)` — Song Detail now renders `lyrics_with_chords` (was written by both forms, read by no screen).

## Batch 02 — incoming

Empty. Drop the next batch of `*.html` mockup bundles into `batch-02-incoming/` — see [`README.md`](README.md) for the workflow, then append a new batch section here.

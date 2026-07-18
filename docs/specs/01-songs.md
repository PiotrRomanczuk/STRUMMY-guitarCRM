---
created: 2026-06-16
updated: 2026-06-16
feature: Songs
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/03-songs-repertoire.md.

# Spec 01 — Songs

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md). Depends on [Phase 0](./00-phase-0-restore-truth.md).

## Goal

A teacher/admin browses the full song library with working filters and opens any song to edit its metadata; a student sees only songs in their Repertoire (assigned via a Lesson). Every song surface renders through `components/songs/editorial/*`, RLS is the only place student scoping happens, and the v1/v2/v3 song trees are deleted.

## User stories (by role)

- **Admin / Teacher** — I see every non-deleted song with filters (level, key, author, search) and pagination; I open a song and edit its metadata, key, capo, tempo, and chords.
- **Student** — I see only songs assigned to me through a Lesson (my Repertoire surface); I cannot reach the edit form or mutate a song.

## Current state (verified 2026-06-16)

| Area                    | File / route                                                | State                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List page               | `app/dashboard/songs/page.tsx`                              | **Wired** to editorial. SSR via `getSongsForList()` → `SongsListEditorial`. Surfaces `level`/`search`/`sort` only.                                                                                                                                                                  |
| List service            | `lib/services/songs-list-queries.ts`                        | Calls `getSongsHandler` with **`createAdminClient()` (RLS bypassed)**; `limit: 200`, no pagination passthrough.                                                                                                                                                                     |
| List UI                 | `components/songs/editorial/SongsListEditorial.tsx`         | Renders level chips, search, sort. **No `key`/`author` filter UI; no pagination control.** Empty state present (lines 222–235).                                                                                                                                                     |
| Detail page             | `app/dashboard/songs/[id]/page.tsx`                         | **Editorial** (PR #433). Loads via RLS-respecting `createClient()`; `getSongUsageStats/Learners/RelatedSongs` also `createClient()` → **RLS-scoped**.                                                                                                                               |
| Detail chords           | `components/songs/editorial/SongDetailEditorial.tsx`        | `upperCaseChordRoots()` (PR #434, line 21) uppercases lowercase roots before `parseChordsColumn()`.                                                                                                                                                                                 |
| Edit page               | `app/dashboard/songs/[id]/edit/page.tsx`                    | **Mounted**; admin/teacher-gated; loads basics via `createClient()`; renders `SongEditFormEditorial`.                                                                                                                                                                               |
| Edit form               | `components/songs/editorial/edit/SongEditFormEditorial.tsx` | Submits to **server action `updateSongAction`** (`app/actions/song-edit.ts`), RLS-respecting `createClient()`. Fields: title, author, level, key, capo_fret, tempo, chords. **No sections editing.**                                                                                |
| API list/CRUD           | `app/api/song/route.ts` + `handlers.ts`                     | `GET/POST/PUT/DELETE`. All use **`createAdminClient()` (RLS bypassed)**; mutations gated by `validateMutationPermission`. Filters: level/key/author/search; pagination via `page`/`limit`. The editorial pages do **not** call this route — they call the services/action directly. |
| chord-parser            | `lib/music-theory/chord-parser.ts`                          | `parseChord`, `parseChordsColumn`. `ROOT_PATTERN = /^([A-G][#b]?)/` — uppercase-only; lowercase roots fail unless pre-normalized.                                                                                                                                                   |
| v1 tree                 | `components/songs/*` (excl. `editorial/`)                   | **Live, ~10,770 LOC** across `list/`, `student/`, `shared/`, `details`-equiv, `form/`, `stats/`, etc. Not yet deleted.                                                                                                                                                              |
| v2 tree                 | `components/v2/songs/*`                                     | **Live** (`SongListPage.tsx`, `SongForm.tsx`, `useSongList.ts`, …). Not deleted.                                                                                                                                                                                                    |
| v3 tree                 | `components/v2/stitch/songs/*`                              | **Live** (`SongFormStitch.tsx`, `SongFormSections.tsx`). Not deleted.                                                                                                                                                                                                               |
| v2 `SongDetailPage.tsx` | (named in MASTER_SPEC §3.2)                                 | **Absent** — already removed; do not re-reference.                                                                                                                                                                                                                                  |

## Editorial UI — current implementation (verified 2026-06-16)

All three surfaces mount `components/songs/editorial/*` under a `theme-editorial` wrapper with locally-imported Fraunces/Geist/Geist-Mono fonts and `editorial-tokens.css`. Styling is entirely inline `style={}` (CSS custom properties), not Tailwind/shadcn.

**Mounted at:**

- `app/dashboard/songs/page.tsx` → `SongsListEditorial` (SSR via `getSongsForList`, filters from search params).
- `app/dashboard/songs/[id]/page.tsx` → `SongDetailEditorial` (RLS `createClient()`; song + stats/learners/related in parallel).
- `app/dashboard/songs/[id]/edit/page.tsx` → `SongEditFormEditorial` (admin/teacher-gated; loads 8 scalar columns via `createClient()`).
- `app/dashboard/songs/new` → referenced by the list's "+ New song" link; `SongFormEditorial` exists for it but its mount route was **not** verified here.

### Component inventory

| Component                        | Lines | Renders                                                                                                                                    | Data source                                               | State                                                                                                          |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SongsListEditorial.tsx`         | 325   | Header (title, count, "+ New song"), level chips w/ counts, search box, sort chips, table (Title/Author/Level/Key), empty state            | Props from `getSongsForList` (server)                     | **PARTIAL** — mounted + real data; only level/search/sort filters, no key/author filter, no pagination control |
| `SongDetailEditorial.tsx`        | 73    | Hero + 2-col grid: chords card + ComingSoonCard (left); usage/learners/related (right). Normalizes chord roots via `upperCaseChordRoots`   | Props (server-loaded `song`/`stats`/`learners`/`related`) | **WIRED** (left column mixes a stub card)                                                                      |
| `SongHeroEditorial.tsx`          | 202   | Cover art (or vinyl SVG fallback), level/year eyebrow, title, author, Key/Capo/Tempo/Time/Length meta, category/strumming/chord-count tags | Props (`song`, `chordTokens`)                             | **WIRED**                                                                                                      |
| `SongSidebarEditorial.tsx`       | 192   | `UsageCard` (assigned/lessons/since/avg-mastery), `LearnersCard` (StageStepper + practice mins), `RelatedCard`                             | Props from `song-detail-queries` (server)                 | **WIRED**                                                                                                      |
| `SongChordsCardEditorial.tsx`    | 64    | Chord voicing grid (`ChordGrid` per token) or "no chords" empty state                                                                      | Props (`chordTokens`)                                     | **WIRED** (voicings limited by `CHORD_SHAPES` table)                                                           |
| `edit/SongEditFormEditorial.tsx` | 228   | Edit form: title, author, level, key, capo_fret, tempo, chords                                                                             | `useActionState(updateSongAction)` (server action)        | **PARTIAL** — persists scalars only; no sections/lyrics/tab                                                    |
| `form/SongFormEditorial.tsx`     | 166   | Create form: same 7 fields                                                                                                                 | `useActionState(createSongAction)` (server action)        | **WIRED** (create path; mount route unverified)                                                                |
| `form/Field.tsx`                 | 59    | Label + optional badge + error wrapper                                                                                                     | Props                                                     | n/a — primitive                                                                                                |
| `primitives.tsx`                 | 228   | `Card`, `CardHeader`, `ChordGrid` (15 hardcoded shapes), `StageStepper` (5 stages)                                                         | Props                                                     | n/a — primitives                                                                                               |
| `format.ts`                      | 40    | `levelLabel`, `msToClock`, `monthYear`, `minutesLabel`, `firstNameWithInitial`                                                             | n/a                                                       | n/a — pure helpers                                                                                             |
| `ComingSoonCard.tsx`             | 74    | Static "On the way" list: Tablature, Sections & form, Lyrics w/ chord positions, Assign as homework                                        | none (hardcoded `PLANNED`)                                | **COMING-SOON** (pure stub)                                                                                    |

**What's built:**

- List, detail, and edit surfaces all render through editorial and run on real, RLS-respecting (detail/edit) or admin-client (list) data.
- Detail hero surfaces every scalar field the schema carries (key/capo/tempo/time-signature/duration/year/category/strumming + cover image).
- Sidebar cards (usage/learners/related) are fully wired to `song-detail-queries`.
- Edit + create forms both submit through server actions (`updateSongAction` / `createSongAction`) with field-level + `_form` error surfacing.
- Chord rendering normalizes lowercase roots (`upperCaseChordRoots`) before `parseChordsColumn`.

**What's stub or ComingSoon:**

- `ComingSoonCard` — entirely static; advertises Tablature, Sections & form, Lyrics with chord positions, Assign as homework. No backing data or write path.
- `ChordGrid` voicings — only 15 shapes in `CHORD_SHAPES`; any unknown chord silently falls back to the **G** diagram (data-accuracy bug, not just a gap).
- `SongFormEditorial` mount route (`/dashboard/songs/new`) not confirmed in this pass.

### Gap to this spec's target behavior

- **List filters (story: level/key/author/search)** — `SongsListEditorial` ships level/search/sort only. **No key or author filter UI**; `buildHref` doesn't carry them. Target requires both.
- **Pagination (data contract + `songs-list.filters.test`)** — no pagination control in the list UI; service is `limit: 200` flat. The `page`/`limit`/`totalPages` contract is unsurfaced.
- **RLS scoping (story: student sees only Repertoire)** — list still reads via `createAdminClient()` (per Current state), so the editorial list shows all songs regardless of role; the student-Repertoire story is **not** enforced at this surface yet.
- **Sections write path (out-of-scope note + ComingSoonCard)** — "Sections & form" and "Lyrics with chord positions" live only in `ComingSoonCard` as static copy; no editable entity exists. Matches the spec's explicit out-of-scope, but the gap is visible to users as a "coming soon" placeholder.
- **Chord-voicing fidelity** — unknown chords fall back to G in `ChordGrid`; not covered by `song-chords.lowercase.test` (which only checks parse/normalize, not diagram correctness).

## Data contract (routes + query params + payloads + RLS)

**List (page render — not the API):** `getSongsForList(user, roles, { level?, search?, sort })` → `{ songs, total, breakdown }`. Backed by `app/api/song` `GET` for any external/API consumer with params `level`, `key`, `author`, `search`, `page`, `limit`, `sortBy`, `sortOrder` → `{ songs, pagination: { page, limit, total, totalPages } }`.

**Edit:** server action `updateSongAction(prev, FormData)` updates `songs` for `{ title, author, level, key, capo_fret, tempo, chords }`; revalidates and redirects to `/dashboard/songs/[id]`. The API `PUT /api/song?id=` remains for programmatic clients.

**RLS (ADR-0001 — the security boundary):**

- `songs_select_policy` (`20251208000000`): admin/teacher see all non-deleted; student sees a song only if a `lesson_songs → lessons` row ties it to `auth.uid()`.
- `student_repertoire`: `sr_select_own` (student own), `sr_select_admin_teacher`, `sr_update_own_notes` (student → notes/difficulty only), `sr_update_admin_teacher` (all fields).
- **Gap to close:** list reads run under `createAdminClient()`, so student scoping is **not** enforced for the list. Switch the list read path to an RLS-respecting client (`createClient()`) so RLS — not app code — scopes students; do not re-filter in the query (`CONTEXT.md` → StudentAccess: the visible-set is for selectors/pre-write 403s, not `WHERE`).

## Behavior & edge cases / failure modes

- **Empty library / no matches** — list shows "No songs in the library yet…" or "No songs match the current filters." (already implemented).
- **Student with empty Repertoire** — RLS yields zero rows; list must render the empty state, not error.
- **Lowercase chords (PR #434)** — `upperCaseChordRoots()` normalizes `c, g, am` → `C, G, Am` before parsing on the detail view; the edit form must persist chords without forcing case, and the detail normalizer remains the parse-time fix.
- **Pagination bounds** — `page`/`limit` clamp to ≥1; out-of-range page returns an empty `songs` array with correct `totalPages`, not a 500.
- **Soft-deleted songs** — `deleted_at IS NULL` filters them everywhere (route, page, edit load).
- **Non-teacher hits edit URL** — redirected to the detail view; mutation also blocked at RLS.
- **No silent failure** — surface query/action errors (the edit action already returns a `_form` error); the list service currently swallows handler errors into an empty list — make it surface instead.

## Files to touch

- `lib/services/songs-list-queries.ts` — swap to RLS-respecting client; stop swallowing errors; thread pagination.
- `components/songs/editorial/SongsListEditorial.tsx` — add `key`/`author` filter controls + pagination.
- `app/dashboard/songs/page.tsx` — parse `key`/`author`/`page` search params.
- `components/songs/editorial/edit/SongEditFormEditorial.tsx` / `app/actions/song-edit.ts` — confirm chord persistence; (optional) sections, if §2.1 sections scope is pulled in.
- **Delete:** `components/songs/*` (v1, excl. `editorial/`), `components/v2/songs/*`, `components/v2/stitch/songs/*`. Run `tsc --noEmit` after each deletion (MASTER_SPEC §3.2).

## Acceptance criteria (as test names)

- `songs-list.rls.test` — teacher/admin see all non-deleted; student sees only Repertoire (lesson-linked) songs.
- `songs-list.filters.test` — level / key / author / search narrow correctly; pagination bounds hold.
- `song-edit.editorial.test` — `SongEditFormEditorial` submits and persists title/author/level/key/capo/tempo/chords.
- `song-chords.lowercase.test` — lowercase chord input renders correctly via `upperCaseChordRoots` + `parseChordsColumn`.
- `songs-list.empty.test` — empty library and student-with-no-repertoire both render the empty state, no error.

## Definition of Done

| ✓   | Gate                  | Met when                                                                                                          |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ☐   | Behavior complete     | List (all filters + pagination) and edit work for every role; no stub.                                            |
| ☐   | No silent failure     | List service surfaces errors (no swallow-to-empty); edit action surfaces `_form`.                                 |
| ☐   | RLS-tested            | `songs` + `student_repertoire` RLS tests pass on real Supabase; **list read path uses an RLS-respecting client**. |
| ☐   | Renders via editorial | List, detail, edit all mount `components/songs/editorial/*`; no `ui-version` branch.                              |
| ☐   | v1/v2/v3 deleted      | `components/songs/*` (v1), `components/v2/songs/*`, `components/v2/stitch/songs/*` removed; `tsc --noEmit` clean. |

## Dependencies & out of scope

- **Depends on** Phase 0 (schema/migration/CI green) before this lands.
- **Out of scope:** song sections as a distinct editable entity (no sections write path exists today — `SongEditFormEditorial` edits scalar fields only); ProductionTab/content (§2.9); bulk import / Spotify / Ultimate-Guitar import routes (separate skills/routes, unchanged here).

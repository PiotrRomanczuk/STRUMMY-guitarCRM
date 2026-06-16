# STRUM-p2 — Songs (spec 01) + Content/Production (spec 09)

**Date**: 2026-06-16
**Branch**: feature/STRUM-p2-songs-content

## Spec 01 — Songs

- [x] Fix RLS: `songs-list-queries.ts` → `createClient()`, surface errors, pagination + key/author + breakdown
- [x] `app/api/song/route.ts` GET — keep admin-client (widget), add comment
- [x] `app/dashboard/songs/page.tsx` — parse `key`/`author`/`page`
- [x] `SongsListEditorial.tsx` — key/author filter UI + pagination (split for SRP)
- [x] Sections — added `lyrics_with_chords` (the real text column behind "Sections
      & form / Lyrics with chord positions") to the edit form + `song-edit.ts`
      action + edit-page select. No literal `sections` column exists; this is the
      genuine persisting backing field (not a stub).
- [x] Delete dead trees: `v2/songs`, `v2/stitch/songs` + orphan test; rewire `loading.tsx`. `components/songs/details/` never existed. `songs/list` (v1) DEFERRED (still barrel-wired + used by StudentDashboard).
- [x] `songs.rls.test.ts` — seed fixed to satisfy NOT NULL (author/level/key/ultimate_guitar_link) + non-draft.

## Spec 09 — Content/Production

- [x] Mount `ProductionTab` (teacher/admin only) via editorial tab container
- [x] Remove `content` nav entry from `AppSidebar.tsx`
- [x] Comment: content tables = bucket B (Phase 0.1)
- [ ] Content RLS test — BLOCKED on Phase 0.1 (not added). Reported.

## Quality gates (2026-06-16, re-run after completion)

- [x] `npx tsc --noEmit` → exit 0 (no orphan imports after v2 deletions)
- [x] `npm run lint` → 0 errors (588 pre-existing warnings project-wide; the
      editorial inline-style components add file-length warnings only)
- [x] `npm test` → 182 suites, 2628 passed, 1 skipped, 0 failed

## Review

### Implemented (spec 01 — Songs)

- `lib/services/songs-list-queries.ts` — RLS-respecting `createClient()` (was
  `createAdminClient()`); surfaces errors via `throw` (caught by
  `app/dashboard/songs/error.tsx`) instead of swallowing to empty; threads
  `page`/`limit` (SONGS_PAGE_SIZE=50) + `key`/`author`; accurate level breakdown
  via a dedicated RLS-scoped query.
- `app/dashboard/songs/page.tsx` — parses `key`/`author`/`page`.
- Editorial list split for SRP: `SongsListEditorial.tsx` + `.Filters.tsx` +
  `.Pagination.tsx` + `songs-list.helpers.ts` (buildHref carries all filters;
  resets page on filter change).
- `app/api/song/route.ts` GET — kept admin-client (external widget) + comment.

### Implemented (spec 09 — Content/Production)

- `SongDetailTabs.tsx` (new client tab container) mounts `<ProductionTab>` as a
  teacher/admin-only "Production" tab; students see overview only.
- `SongDetailEditorial.tsx` + detail page pass `canSeeProduction = isAdmin||isTeacher`.
- `AppSidebar.tsx` — removed `content` nav entry + unused `Clapperboard` import (D-10).
- Bucket-B / Phase 0.1 dependency flagged in `SongDetailTabs.tsx` comment.

### Deletions

- Deleted dead v2 trees: `components/v2/songs/*`, `components/v2/stitch/songs/*`,
  orphan test `components/v2/__tests__/song-form.unit.test.tsx`.
- Rewrote `app/dashboard/songs/loading.tsx` (was importing the deleted v2 skeleton).

### Decisions / blockers

- **Sections field: IMPLEMENTED via `lyrics_with_chords`.** There is no literal
  `sections` column. The real column behind the song's "Sections & form / lyrics
  with chord positions" content is `songs.lyrics_with_chords` (text, present in
  the live DB / generated types). Added it as a textarea on the editorial edit
  form, wired through `updateSongAction` (`z.string().max(20000).nullable()`)
  and the edit-page select. Persists — not a stub.
- **Full v1 deletion: DEFERRED.** `components/songs/list` is still re-exported by
  `components/songs/index.ts` and `components/songs/student/SongLibrary` is live
  in `StudentDashboardClient`. Removing the whole v1 tree breaks the build / is a
  larger migration. Only genuinely-dead v2 trees removed.
- **Content RLS test: NOT added (blocked on Phase 0.1).** Content tables are
  bucket B (not on the RLS branch); real policy is `is_admin_or_teacher()` (any
  teacher/admin, NOT owner-isolated). Added required `songs.rls.test.ts` instead.

---
created: 2026-06-08
updated: 2026-06-08
status: partial
slug: song-detail
---

# Song / Repertoire Detail

`/design-preview/song-detail`

## Status

**partial** — several supporting components drafted (incl. local ChordGrid), main composition + page not done.

## Files already on disk (2026-06-08)

```
components/design-preview/song-detail/types.ts
components/design-preview/song-detail/data.ts
components/design-preview/song-detail/helpers.tsx
components/design-preview/song-detail/ChordGrid.tsx       ← re-ported locally from primitives.jsx
components/design-preview/song-detail/SongHero.tsx
components/design-preview/song-detail/StageStepper.tsx
```

`ChordGrid` and `StageStepper` look reusable — review before re-porting elsewhere.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/song-detail.jsx` — `<SongDetail width height>` with chord chart, tab, lyrics, assign-to-student, usage stats

## Artboards to mount

| Label                                    | Dim       | Prototype                                  |
| ---------------------------------------- | --------- | ------------------------------------------ |
| Hotel California · Chords view · Desktop | 1440×1300 | `<SongDetail width={1440} height={1300}/>` |

## Remaining TODO

- [ ] Audit the 6 existing files; confirm `ChordGrid`, `SongHero`, `StageStepper` are correct
- [ ] Implement `SongDetail.tsx` (main composition) — sidebar + topbar + tabs (chords / tab / lyrics) + assign panel + usage stats
- [ ] Create `app/design-preview/song-detail/page.tsx` mounting the artboard
- [ ] Lint clean
- [ ] Branch `feature/design-preview-song-detail`, PR, verify

---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: song-form
---

# Song Form

`/design-preview/song-form`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/song-form-a.jsx` — variant A: editorial single-page form (26 KB)
- `/tmp/strummy-design/strummy/project/src/song-form-b.jsx` — variant B: music-manuscript style (31 KB)
- Mobile variant `SongFormMobile` is defined in one of the two `a` / `b` files — check both

## Artboards to mount

| Label                               | Dim       | Prototype           |
| ----------------------------------- | --------- | ------------------- |
| A · Editorial single-page — desktop | 1440×1200 | `<SongFormA/>`      |
| B · Music Manuscript — desktop      | 1440×1200 | `<SongFormB/>`      |
| C · Step wizard — mobile            | 390×844   | `<SongFormMobile/>` |

## Remaining TODO

- [ ] Read both source files in full
- [ ] Implement `SongFormA.tsx` (editorial single-page — title / author / chords / lyrics / tab / metadata)
- [ ] Implement `SongFormB.tsx` (manuscript style — staff lines, measure boxes)
- [ ] Implement `SongFormMobile.tsx` (step wizard — 1 field per screen)
- [ ] Share field primitives across A/B/Mobile in a `fields.tsx` if helpful
- [ ] Spotify-assist callout (visual only, no real API)
- [ ] Local types + data
- [ ] Create `app/design-preview/song-form/page.tsx` mounting all 3 artboards
- [ ] Lint clean
- [ ] Branch `feature/design-preview-song-form`, PR, verify

## Note

This is the most field-heavy section. Variants A/B/Mobile are intentionally divergent designs — port faithfully.

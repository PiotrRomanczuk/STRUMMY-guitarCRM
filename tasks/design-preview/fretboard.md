---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: fretboard
---

# Fretboard Explorer

`/design-preview/fretboard`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

Three closely-related files — read in this order:

- `/tmp/strummy-design/strummy/project/src/fretboard-theory.jsx` — scale + key data, note math
- `/tmp/strummy-design/strummy/project/src/fretboard-svg.jsx` — SVG rendering primitives (the three runtime styles: `studio`, `engraved`, `mono`)
- `/tmp/strummy-design/strummy/project/src/fretboard-explorer.jsx` — `<FretboardExplorer fretboardStyle>` and `<FretboardExplorerMobile fretboardStyle>`

## Artboards to mount

| Label                                | Dim       | Prototype                                              |
| ------------------------------------ | --------- | ------------------------------------------------------ |
| Desktop · 3-column · Editorial Light | 1440×1024 | `<FretboardExplorer fretboardStyle="engraved"/>`       |
| Mobile · Stacked · Landscape hint    | 390×844   | `<FretboardExplorerMobile fretboardStyle="engraved"/>` |

## Remaining TODO

- [ ] Read all 3 source files
- [ ] Implement fretboard theory helpers in `theory.ts` (notes, intervals, scale lookups)
- [ ] Implement SVG renderers for the 3 styles (`FretboardSVG.tsx` with style switch)
- [ ] Implement `FretboardExplorer.tsx` (key + scale picker, fretboard render, note legend)
- [ ] Implement `FretboardExplorerMobile.tsx`
- [ ] Wire interactive key/scale state (`'use client'`)
- [ ] Optional: surface the style switch (`studio` / `engraved` / `mono`) via URL param or page-level toggle
- [ ] Create `app/design-preview/fretboard/page.tsx`
- [ ] Lint clean
- [ ] Branch `feature/design-preview-fretboard`, PR, verify

## Note

This is the largest single-section port (37 KB of source — see `fretboard-explorer.jsx`). Consider splitting into a 2-PR effort: first the theory + SVG primitives, then the interactive explorer.

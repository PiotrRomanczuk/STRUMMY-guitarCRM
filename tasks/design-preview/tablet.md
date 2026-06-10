---
created: 2026-06-08
updated: 2026-06-08
status: not-started
slug: tablet
---

# Tablet — iPad on Music Stand

`/design-preview/tablet`

## Status

**not-started**.

## Files on disk

None.

## Source files (bundle)

- `/tmp/strummy-design/strummy/project/src/tablet.jsx` — landscape iPad LIVE-lesson view, readable from 3 feet

## Artboards to mount

| Label                                        | Dim      | Prototype                                       |
| -------------------------------------------- | -------- | ----------------------------------------------- |
| iPad · Live lesson · Big chord cards + timer | 1220×860 | `<TabletLiveLesson width={1180} height={820}/>` |

The outer artboard is 1220×860 to give the iPad a frame around the 1180×820 inner viewport.

## Remaining TODO

- [ ] Read `tablet.jsx` in full
- [ ] Implement `TabletLiveLesson.tsx` (big chord cards, BPM timer, “next song” strip, minimal chrome)
- [ ] Use existing `ChordGrid` from song-detail’s local port if helpful (decide: keep separate, or extract into foundation)
- [ ] Local types + data
- [ ] Create `app/design-preview/tablet/page.tsx`
- [ ] Lint clean
- [ ] Branch `feature/design-preview-tablet`, PR, verify

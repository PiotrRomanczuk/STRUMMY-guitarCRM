# Feature 18: Song of the Week

> **Tier**: 4 | **Priority**: Specialized

## Current Routes

| Route | Purpose |
|-------|---------|
| N/A (widget on dashboard) | Embedded in Teacher + Student dashboards |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/song-of-the-week/SongOfTheWeek.Card.tsx` | ~80 | Main display card |
| `components/song-of-the-week/SongOfTheWeek.SongDetails.tsx` | ~60 | Song info section |
| `components/song-of-the-week/SongOfTheWeek.AdminControls.tsx` | ~60 | Admin action buttons |
| `components/song-of-the-week/SongOfTheWeek.PickerDialog.tsx` | ~80 | Song selection dialog |
| `components/song-of-the-week/SongOfTheWeek.AddButton.tsx` | ~40 | Add to repertoire button |
| `components/song-of-the-week/SongOfTheWeek.EmptyState.tsx` | ~30 | No SOTW active |
| `components/song-of-the-week/index.ts` | ~10 | Re-exports |

**Total**: 7 files, ~360 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `getCurrentSongOfTheWeek()` | `app/actions/song-of-the-week.ts` | SOTW with song details |
| `setSongOfTheWeek(input)` | `app/actions/song-of-the-week.ts` | Created SOTW (admin) |
| `deactivateSongOfTheWeek(id)` | `app/actions/song-of-the-week.ts` | Deactivated (admin) |
| `addSotwToRepertoire()` | `app/actions/song-of-the-week.ts` | Added to student repertoire |
| `searchSongsForSotw(query)` | `app/actions/song-of-the-week.ts` | Search results for picker |

## User Stories

### Teacher (on phone)
1. Set this week's featured song — search and select from library
2. Add a teacher message explaining why this song was chosen
3. Deactivate current SOTW when the week is over

### Student (on phone)
1. See this week's featured song prominently on dashboard
2. Tap to view song details, chords, and resources
3. Add song to personal repertoire with one tap

## Mobile Pain Points (at 390px)

1. **Card width** — SOTW card competes with other dashboard cards for space
2. **Song picker** — search dialog needs full-screen treatment on mobile
3. **Teacher message** — long messages truncated, no expand/collapse
4. **Add to repertoire button** — should be more prominent, maybe sticky
5. **Album art** — if Spotify-linked, image too small to see

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/song-of-the-week/SOTWCard.tsx` | Prominent mobile card with large art |
| `components/v2/song-of-the-week/SOTWPicker.tsx` | Full-screen song search picker |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/song-of-the-week/SongOfTheWeek.Card.tsx` | Replaced by v2 card |
| `components/song-of-the-week/SongOfTheWeek.PickerDialog.tsx` | Replaced by full-screen picker |

### Shared Primitives Needed
- [x] `MobilePageShell` (inherited from dashboard)
- [ ] `FullScreenSearchPicker` — reusable song search
- [ ] `ExpandableText` — truncated text with expand button

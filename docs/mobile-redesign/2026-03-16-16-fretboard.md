# Feature 16: Interactive Fretboard

> **Tier**: 4 | **Priority**: Specialized

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/fretboard` | Interactive fretboard training tool |

## Component Tree

### Core Fretboard
| File | LOC | Purpose |
|------|-----|---------|
| `components/fretboard/Fretboard.tsx` | ~150 | Main fretboard canvas/SVG |
| `components/fretboard/Fretboard.NoteCell.tsx` | ~60 | Individual note cell |
| `components/fretboard/Fretboard.Info.tsx` | ~80 | Legend/info panel |
| `components/fretboard/Fretboard.Controls.tsx` | ~60 | Control panel wrapper |

### Controls
| File | LOC | Purpose |
|------|-----|---------|
| `components/fretboard/ModeButtons.tsx` | ~40 | Scale/chord/mode selector |
| `components/fretboard/RootSelector.tsx` | ~40 | Root note picker |
| `components/fretboard/ScaleSelector.tsx` | ~40 | Scale type selector |
| `components/fretboard/ChordSelector.tsx` | ~40 | Chord type selector |
| `components/fretboard/CagedSelector.tsx` | ~60 | CAGED system positions |
| `components/fretboard/TrainingBar.tsx` | ~60 | Training mode controls |
| `components/fretboard/AudioPanel.tsx` | ~60 | Audio playback controls |
| `components/fretboard/AudioSliders.tsx` | ~40 | Audio parameter sliders |

### Hooks
| File | LOC | Purpose |
|------|-----|---------|
| `components/fretboard/useFretboard.ts` | ~120 | Main fretboard state |
| `components/fretboard/useFretboardPlayback.ts` | ~80 | Audio playback logic |
| `components/fretboard/useFretboardTraining.ts` | ~80 | Training game logic |
| `components/fretboard/useGuitarAudio.ts` | ~80 | Web Audio API synthesis |

### Helpers
| File | LOC | Purpose |
|------|-----|---------|
| `components/fretboard/fretboard.helpers.ts` | ~100 | Music theory calculations |
| `components/fretboard/caged.helpers.ts` | ~80 | CAGED position logic |
| `components/fretboard/positions.helpers.ts` | ~60 | Fret position calculations |

**Total**: ~22 files, ~2,196 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| N/A | — | Fretboard is fully client-side (no server data) |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useFretboard` | `components/fretboard/useFretboard.ts` | Local state (scale/chord selection) |
| `useFretboardPlayback` | `components/fretboard/useFretboardPlayback.ts` | Web Audio API |
| `useFretboardTraining` | `components/fretboard/useFretboardTraining.ts` | Local state (training game) |
| `useGuitarAudio` | `components/fretboard/useGuitarAudio.ts` | Web Audio API synthesis |

## User Stories

### Student (practicing at home)
1. Select a scale or chord and see it highlighted on the fretboard — study finger positions
2. Tap notes on the fretboard to hear them — learn by ear
3. Train with the quiz mode — identify notes/scales/chords timed

### Teacher (in lesson)
1. Show a chord or scale pattern to a student during a live lesson
2. Demonstrate CAGED positions visually
3. Use audio playback to demonstrate how a scale sounds

## Mobile Pain Points (at 390px)

1. **Fretboard too small** — 22 frets × 6 strings = 132 cells at 390px width means ~3px per cell, untouchable
2. **No pinch-to-zoom** — can't zoom into a region of the fretboard
3. **Portrait mode** — fretboard is naturally landscape, portrait makes it tiny
4. **Control panels** — selectors take up half the screen above the fretboard
5. **Audio sliders** — slider thumbs too small for touch, overlap each other
6. **Note labels** — text too small to read on fret cells
7. **Training mode** — quiz timer/score UI competes with fretboard for space

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/fretboard/Fretboard.tsx` | Touch-optimized fretboard with pinch-zoom |
| `components/v2/fretboard/Fretboard.Desktop.tsx` | Desktop full-width fretboard |
| `components/v2/fretboard/Controls.tsx` | Compact controls in bottom sheet |
| `components/v2/fretboard/TrainingMode.tsx` | Mobile quiz with large touch targets |
| `components/v2/fretboard/useFretboard.ts` | Shared hook (reuse existing) |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/fretboard/Fretboard.tsx` | Replaced by touch-optimized v2 |
| `components/fretboard/Fretboard.Controls.tsx` | Replaced by bottom sheet controls |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `BottomActionSheet` — for control panels
- [ ] `PinchZoomCanvas` — pinch-to-zoom fretboard container
- [ ] `LandscapeHint` — prompt to rotate device for better view

### Mobile-Specific Considerations
- **Landscape mode**: Detect and suggest landscape orientation for fretboard use
- **Region focus**: Show only 5-7 frets at a time, swipe to scroll
- **Touch targets**: Minimum 44px per fret cell when zoomed in
- **Audio**: Consider AudioContext resume on first touch (iOS requirement)

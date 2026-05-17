# Feature 5: Student Repertoire

> **Tier**: 1 | **Priority**: Core Daily Use

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/repertoire` | Student's full song repertoire with self-rating |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/repertoire/AssessmentComparison.tsx` | ~100 | Compare teacher vs self assessment |
| `components/repertoire/SelfRatingStars.tsx` | ~100 | Star rating input |

**Note**: Most repertoire UI is embedded in:
| File | LOC | Purpose |
|------|-----|---------|
| `components/users/UserRepertoireTab.tsx` | ~100 | Repertoire tab in user detail |
| `components/users/RepertoireCard.tsx` | ~80 | Song card in repertoire |
| `components/users/AddSongToRepertoireDialog.tsx` | ~80 | Add song dialog |
| `components/users/EditSongConfigDialog.tsx` | ~60 | Edit config dialog |
| `components/users/repertoire.helpers.ts` | ~40 | Utility functions |
| `components/songs/student/StudentSongsPageClient.tsx` | ~120 | Student song browser |

**Total**: ~8 files, ~680 LOC (split across repertoire + users + songs domains)

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `getStudentRepertoireAction(studentId)` | `app/actions/repertoire.ts` | StudentRepertoireWithSong[] (sorted by priority + sort_order) |
| `addSongToRepertoireAction(input)` | `app/actions/repertoire.ts` | Created repertoire entry ID |
| `updateRepertoireEntryAction(id, input)` | `app/actions/repertoire.ts` | Updated entry |
| `updateSelfRatingAction(repertoireId, rating)` | `app/actions/self-rating.ts` | Updated rating + timestamp |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| N/A | -- | Uses server actions directly |

## User Stories

### Teacher (on phone between lessons)
1. Review a student's full repertoire before their lesson -- see what they know and what needs work
2. Add a new song to a student's repertoire with priority/difficulty settings
3. Compare teacher assessment vs student self-rating to identify gaps

### Student (practicing at home)
1. Browse full repertoire sorted by priority -- know what to practice first
2. Self-rate songs after practicing -- track my own progress
3. See which songs are new vs. mastered to manage practice time

## Mobile Pain Points (at 390px)

1. **Repertoire is minimal** -- only 2 dedicated components, UI feels like an afterthought
2. **Self-rating stars** -- star targets may be too small for touch
3. **Song cards in repertoire** -- don't show enough context (key, difficulty, last practiced)
4. **No drag-to-reorder** -- can't prioritize repertoire order on mobile
5. **Add song dialog** -- standard dialog, needs bottom sheet on mobile
6. **No practice session tracking** -- repertoire doesn't link to actual practice activity

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/repertoire/RepertoireList.tsx` | Full mobile-first repertoire with priority sections |
| `components/v2/repertoire/RepertoireList.Desktop.tsx` | Desktop grid/table |
| `components/v2/repertoire/RepertoireCard.tsx` | Rich card with rating, difficulty, last practiced |
| `components/v2/repertoire/SelfRating.tsx` | Touch-friendly star rating (48px targets) |
| `components/v2/repertoire/AddSongSheet.tsx` | Bottom sheet to add songs |
| `components/v2/repertoire/useRepertoire.ts` | Shared hook wrapping server actions |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/repertoire/SelfRatingStars.tsx` | Replaced by v2 SelfRating with larger targets |
| `components/users/UserRepertoireTab.tsx` | Replaced by v2 RepertoireList |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `BottomActionSheet` -- add song sheet
- [ ] `TouchStarRating` -- 48px touch-target star rating
- [ ] `DraggableSortList` -- drag to reorder priority

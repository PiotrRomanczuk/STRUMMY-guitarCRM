# Feature 11: Skills Management

> **Tier**: 3 | **Priority**: Admin & Analytics

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/skills` | Skills hierarchy management |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/skills/SkillsManager.tsx` | ~10 | Main skills management (minimal) |
| `components/users/UserSkills.tsx` | ~60 | Skills display on user detail |

**Total**: 2 files, ~70 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| N/A | — | Skills uses API routes |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/skills` | GET, POST | List/create skills |
| `/api/skills/[id]` | PUT, DELETE | Update/delete skill |

## User Stories

### Teacher (on phone)
1. Browse skill categories to see what areas a student needs to improve
2. Assign skills to students during or after a lesson
3. Track skill progression over time

### Admin
1. Manage the skill taxonomy — add new skill categories, reorder hierarchy

## Mobile Pain Points (at 390px)

1. **Minimal implementation** — almost no UI, needs to be built from scratch for v2
2. **Hierarchy display** — tree structures are hard to navigate on mobile
3. **Skill assignment** — no inline assignment flow from lesson/student context

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/skills/SkillBrowser.tsx` | Card/chip-based skill browser |
| `components/v2/skills/SkillBrowser.Desktop.tsx` | Desktop tree view |
| `components/v2/skills/SkillAssignment.tsx` | Inline skill assignment sheet |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/skills/SkillsManager.tsx` | Replaced by v2 SkillBrowser |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `BottomActionSheet` — skill assignment
- [ ] `ChipSelector` — multi-select skill chips

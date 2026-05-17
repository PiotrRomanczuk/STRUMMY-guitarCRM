# Feature 12: Cohort Analytics

> **Tier**: 3 | **Priority**: Admin & Analytics

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/cohorts` | Cohort analytics view |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/cohorts/CohortAnalytics.tsx` | ~150 | Main cohort analytics |
| Related sub-components in `/components/dashboard/cohorts/` | ~200 | Charts, tables, filters |

**Total**: ~4 files, ~350 LOC (estimated)

## Data Contract

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useCohortAnalytics` | `components/dashboard/admin/hooks/useCohortAnalytics.ts` | `/api/students` aggregated |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/students` | GET | Student data for cohort grouping |

## User Stories

### Teacher (on phone)
1. Compare student groups (cohorts) by lesson count and progress
2. Identify which cohort needs more attention
3. View cohort-level statistics at a glance

### Admin
1. Create and manage cohort definitions
2. Generate cohort comparison reports

## Mobile Pain Points (at 390px)

1. **Charts are desktop-sized** — Nivo charts don't resize well below 400px
2. **Comparison tables** — side-by-side cohort comparison overflows horizontally
3. **No drill-down** — can't tap a cohort to see individual students on mobile
4. **Filter controls** — take up too much vertical space

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/cohorts/CohortDashboard.tsx` | Mobile-first cohort cards with sparklines |
| `components/v2/cohorts/CohortDashboard.Desktop.tsx` | Desktop chart grid |
| `components/v2/cohorts/CohortDetail.tsx` | Drill-down into cohort members |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/dashboard/cohorts/CohortAnalytics.tsx` | Replaced by v2 dashboard |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `CollapsibleFilterBar`
- [ ] `MobileChart` — responsive chart wrapper (Nivo → mobile-friendly)
- [ ] `SparklineCard` — compact metric card with inline chart

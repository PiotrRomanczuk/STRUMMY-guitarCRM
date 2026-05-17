# Feature 13: Student Health Monitoring

> **Tier**: 3 | **Priority**: Admin & Analytics

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/health` | Student health monitoring dashboard |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/health/HealthAlertsBanner.tsx` | ~60 | Alert banner (appears on dashboard too) |
| `components/dashboard/health/HealthSummaryWidget.tsx` | ~80 | Summary widget with key metrics |
| `components/dashboard/health/StudentHealthTable.tsx` | ~120 | Student health data table |

**Total**: 3 files, ~260 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| Health data computed by | `lib/health/` | Student health scores, at-risk flags |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/students` | GET | Student data with health metrics |
| `/api/cron/update-student-status` | POST | Recalculate health scores |

## User Stories

### Teacher (on phone)
1. Quickly see which students are at risk — haven't attended lessons, declining ratings
2. Tap a student to see their health details and take action
3. Get alerts for students who need immediate attention

### Admin
1. Monitor overall student health across all teachers
2. Track retention metrics

## Mobile Pain Points (at 390px)

1. **Health table** — multi-column table overflows, needs card layout
2. **Alert banner** — takes too much space when multiple alerts are active
3. **No quick action** — can't message a student directly from the health alert
4. **Status indicators** — color-coded dots too small to differentiate on mobile

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/health/HealthDashboard.tsx` | Card-based at-risk student list |
| `components/v2/health/HealthDashboard.Desktop.tsx` | Desktop table with charts |
| `components/v2/health/HealthCard.tsx` | Student health card with status + actions |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/dashboard/health/StudentHealthTable.tsx` | Replaced by card list |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `SwipeableListItem` — swipe to message/schedule lesson
- [ ] `StatusIndicator` — large, accessible status badges

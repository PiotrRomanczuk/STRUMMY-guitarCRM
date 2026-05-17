# Feature 14: Statistics

> **Tier**: 3 | **Priority**: Admin & Analytics

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/stats` | Student stats (student view) |
| `/dashboard/admin/stats/songs` | Admin song statistics |
| `/dashboard/admin/stats/lessons` | Admin lesson statistics |
| `/dashboard/admin/stats/chord-analysis` | Chord analysis dashboard |

## Component Tree

### Lesson Statistics
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/stats/LessonStatsPage.tsx` | ~100 | Stats overview page |
| `components/lessons/stats/LessonStatsPageEnhanced.tsx` | ~120 | Enhanced version |
| `components/lessons/stats/LessonStatsKPIs.tsx` | ~80 | KPI metric cards |
| `components/lessons/stats/LessonStatsKPIsEnhanced.tsx` | ~80 | Enhanced KPIs |
| `components/lessons/stats/LessonStatsCalendarHeatmap.tsx` | ~120 | Activity heatmap |
| `components/lessons/stats/LessonStatsGrowthChart.tsx` | ~100 | Growth visualization |
| `components/lessons/stats/LessonStatsGrowthChartNivo.tsx` | ~100 | Nivo growth chart |
| `components/lessons/stats/LessonStatsMonthlyChart.tsx` | ~100 | Monthly chart |
| `components/lessons/stats/LessonStatsMonthlyChartNivo.tsx` | ~100 | Nivo monthly |
| `components/lessons/stats/LessonStatsRetention.tsx` | ~80 | Retention chart |
| `components/lessons/stats/LessonStatsRetentionNivo.tsx` | ~80 | Nivo retention |
| `components/lessons/stats/LessonStatsScheduleCharts.tsx` | ~100 | Schedule analysis |
| `components/lessons/stats/LessonStatsScheduleChartsNivo.tsx` | ~100 | Nivo schedule |
| `components/lessons/stats/LessonStatsStudentTable.tsx` | ~80 | Per-student table |

### Song Statistics
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/stats/SongStatsPage.tsx` | ~100 | Song stats overview |
| `components/songs/stats/SongStatsKPIs.tsx` | ~80 | Song KPIs |
| `components/songs/stats/SongStatsGrowthChart.tsx` | ~80 | Song growth |
| `components/songs/stats/SongStatsKeyChart.tsx` | ~80 | Key distribution |
| `components/songs/stats/SongStatsSunburst.tsx` | ~100 | Category sunburst |
| `components/songs/stats/SongStatsTempoChart.tsx` | ~80 | Tempo distribution |

### Chord Analysis
| File | LOC | Purpose |
|------|-----|---------|
| `components/songs/chord-analysis/ChordAnalysisPage.tsx` | ~120 | Analysis dashboard |
| `components/songs/chord-analysis/ChordAnalysisKPIs.tsx` | ~60 | Chord KPIs |
| `components/songs/chord-analysis/ArchetypeCards.tsx` | ~80 | Song archetype cards |
| `components/songs/chord-analysis/ChordFrequencyChart.tsx` | ~80 | Frequency chart |
| `components/songs/chord-analysis/ProgressionBarChart.tsx` | ~80 | Progression chart |
| `components/songs/chord-analysis/ProgressionLengthChart.tsx` | ~60 | Length distribution |
| `components/songs/chord-analysis/TransitionHeatmap.tsx` | ~100 | Chord transition heatmap |
| `components/songs/chord-analysis/TheoryTable.tsx` | ~80 | Theory reference |

### Student Stats
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/student/StudentStatsPageClient.tsx` | ~120 | Student stats view |
| `components/dashboard/student/ProgressChart.tsx` | ~100 | Progress chart |
| `components/dashboard/student/AchievementsCard.tsx` | ~80 | Achievement badges |

**Total**: ~31 files, ~2,820 LOC

## Data Contract

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useLessonStatsAdvanced` | `components/lessons/hooks/useLessonStatsAdvanced.ts` | `/api/lessons/stats` |
| `useSongStatsAdvanced` | `components/songs/hooks/useSongStatsAdvanced.ts` | `/api/song/stats` |
| `useChordAnalysis` | `components/songs/hooks/useChordAnalysis.ts` | `/api/song/analysis` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/lessons/stats` | GET | Lesson statistics |
| `/api/song/stats` | GET | Song statistics |
| `/api/song/analysis` | GET | Chord analysis data |

## User Stories

### Teacher (on phone)
1. Check teaching stats — how many lessons this month, growth trend
2. See which songs are most popular/least used
3. Review chord analysis to plan curriculum

### Student (on phone)
1. View personal stats — lessons attended, songs learned, practice time
2. See progress chart over time for motivation
3. Check achievements and milestones

## Mobile Pain Points (at 390px)

1. **Nivo charts** — most charts don't have mobile breakpoints, legends overflow
2. **Heatmap** — calendar heatmap needs horizontal scrolling on mobile
3. **Sunburst chart** — interactive SVG too dense for touch
4. **KPI cards grid** — 4-column grid doesn't collapse to 2-column cleanly
5. **Duplicate chart components** — both vanilla and Nivo versions exist (tech debt)
6. **Data tables** — student stats table overflows

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/stats/StatsOverview.tsx` | Mobile KPI cards with swipeable chart carousel |
| `components/v2/stats/StatsOverview.Desktop.tsx` | Desktop chart grid |
| `components/v2/stats/ChartCarousel.tsx` | Swipeable chart carousel for mobile |
| `components/v2/stats/StudentStats.tsx` | Mobile student stats with progress ring |
| `components/v2/stats/ChordAnalysis.tsx` | Mobile-optimized chord analysis |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| All `*Nivo.tsx` duplicates | Consolidate to single charting solution |
| `components/lessons/stats/LessonStatsPage.tsx` | Replaced by v2 overview |
| `components/songs/stats/SongStatsPage.tsx` | Replaced by v2 overview |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [ ] `MobileChart` — responsive Nivo wrapper with touch tooltips
- [ ] `ChartCarousel` — horizontal swipe between charts
- [ ] `ProgressRing` — circular progress indicator for student stats

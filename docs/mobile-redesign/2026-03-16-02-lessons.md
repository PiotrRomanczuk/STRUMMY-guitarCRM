# Feature 2: Lessons

> **Tier**: 1 | **Priority**: Core Daily Use

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/lessons` | Lesson list (role-based: teacher sees all, student sees own) |
| `/dashboard/lessons/new` | Create new lesson |
| `/dashboard/lessons/[id]` | Lesson detail page |
| `/dashboard/lessons/[id]/edit` | Edit lesson |
| `/dashboard/lessons/[id]/live` | Live lesson mode |
| `/dashboard/lessons/import` | Import from Google Calendar |

## Component Tree

### List / Page
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/list/Client.tsx` | ~60 | Client wrapper |
| `components/lessons/list/index.tsx` | ~30 | Re-exports |
| `components/lessons/list/LessonList.tsx` | ~120 | Main list render |
| `components/lessons/list/LessonList.Header.tsx` | ~80 | List header + actions |
| `components/lessons/list/LessonList.Filter.tsx` | ~100 | Filter controls |
| `components/lessons/list/LessonTable.tsx` | ~150 | Table component |
| `components/lessons/list/LessonTable.Row.tsx` | ~80 | Table row |
| `components/lessons/list/LessonTable.Empty.tsx` | ~30 | Empty state |

### Student View
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/student/StudentLessonsPageClient.tsx` | ~120 | Student lesson list |
| `components/lessons/student/StudentLessonDetailPageClient.tsx` | ~150 | Student lesson detail |

### Form / CRUD
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/form/LessonForm.tsx` | ~180 | Main lesson form |
| `components/lessons/form/LessonForm.Fields.tsx` | ~150 | Form fields |
| `components/lessons/form/LessonForm.Actions.tsx` | ~60 | Form actions |
| `components/lessons/form/LessonForm.ProfileSelect.tsx` | ~80 | Student picker |
| `components/lessons/form/LessonForm.SongSelect.tsx` | ~100 | Song picker |
| `components/lessons/form/LessonNotesAI.tsx` | ~80 | AI note generation |

### Detail View
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/details/LessonDetailsCard.tsx` | ~150 | Full lesson detail card |
| `components/lessons/details/PostLessonPrompt.tsx` | ~80 | Post-lesson AI prompt |
| `components/lessons/details/AddAssignmentDialog.tsx` | ~80 | Add assignment from lesson |
| `components/lessons/details/LessonAssignmentsList.tsx` | ~80 | Assignments in lesson |

### Lesson Songs
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/songs/LessonSongs.tsx` | ~100 | Songs section |
| `components/lessons/songs/LessonSongSelector.tsx` | ~120 | Song picker |
| `components/lessons/songs/LessonSongsList.tsx` | ~80 | Song list display |
| `components/lessons/songs/LessonSongStatusSelect.tsx` | ~60 | Status dropdown |

### Live Lesson Mode
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/live/LiveLessonView.tsx` | ~150 | Live mode container |
| `components/lessons/live/LiveLessonTopBar.tsx` | ~60 | Top bar with timer |
| `components/lessons/live/LiveLessonNotes.tsx` | ~100 | Real-time notes |
| `components/lessons/live/LiveSongCard.tsx` | ~80 | Song display during lesson |
| `components/lessons/live/StatusStepper.tsx` | ~60 | Lesson progress stepper |

### Statistics
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/stats/LessonStatsPage.tsx` | ~100 | Stats overview |
| `components/lessons/stats/LessonStatsKPIs.tsx` | ~80 | KPI cards |
| `components/lessons/stats/LessonStatsCalendarHeatmap.tsx` | ~120 | Heatmap |
| `components/lessons/stats/LessonStatsGrowthChart.tsx` | ~100 | Growth chart |
| `components/lessons/stats/LessonStatsMonthlyChart.tsx` | ~100 | Monthly chart |
| `components/lessons/stats/LessonStatsRetention.tsx` | ~80 | Retention chart |
| `components/lessons/stats/LessonStatsScheduleCharts.tsx` | ~100 | Schedule analytics |
| `components/lessons/stats/LessonStatsStudentTable.tsx` | ~80 | Per-student stats |

### Shared / Support
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/shared/LessonCard.tsx` | ~80 | Reusable lesson card |
| `components/lessons/shared/StatusBadge.tsx` | ~30 | Status indicator |
| `components/lessons/shared/AIAssistButton.tsx` | ~40 | AI assist trigger |
| `components/lessons/PostLessonSummaryAI.tsx` | ~80 | AI summary |
| `components/lessons/actions/LessonDeleteButton.tsx` | ~40 | Delete action |
| `components/lessons/actions/SendEmailButton.tsx` | ~40 | Email action |

**Total**: ~76 files, ~7,937 LOC

## Data Contract

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useLessonList` | `components/lessons/hooks/useLessonList.ts` | `/api/lessons` with filtering |
| `useLessonForm` | `components/lessons/hooks/useLessonForm.ts` | Form state + mutations |
| `useSongs` | `components/lessons/hooks/useSongs.ts` | `/api/song` for song picker |
| `useProfiles` | `components/lessons/hooks/useProfiles.ts` | `/api/users` for student picker |
| `useCalendarBulkSync` | `components/lessons/hooks/useCalendarBulkSync.ts` | `/api/calendar/sync` |
| `useLessonStatsAdvanced` | `components/lessons/hooks/useLessonStatsAdvanced.ts` | `/api/lessons/stats` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/lessons` | GET, POST | List lessons, create lesson |
| `/api/lessons/[id]` | GET, PUT, DELETE | CRUD single lesson |
| `/api/lessons/songs` | GET, POST, DELETE | Manage songs in lessons |
| `/api/admin/lessons` | GET | Admin lesson queries |
| `/api/student/lessons` | GET | Student-specific lessons |

## User Stories

### Teacher (on phone between lessons)
1. Review today's lesson list -- tap a lesson to see student, songs planned, and notes
2. Quick-create a lesson by picking student + date + songs from a step wizard
3. During a live lesson, mark songs as played and add notes in real-time

### Student (practicing at home)
1. See upcoming lesson date and what to prepare (songs, assignments)
2. Review notes from last lesson to guide practice
3. Check lesson history to track progress over time

## Mobile Pain Points (at 390px)

1. **Lesson list uses table layout** -- columns overflow, no card alternative for mobile
2. **Lesson form is a long single-page form** -- no step wizard like MobileSongForm, fields are cramped
3. **Song picker in lesson form** -- dropdown/combobox difficult to use on mobile, needs full-screen search
4. **Live lesson mode** -- notes editor too small, song card takes too much space, timer hard to see
5. **Date/time picker** -- native mobile picker not utilized, custom picker is awkward
6. **Filter controls** -- take up 1/3 of screen, should collapse into filter chips

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/lessons/LessonList.tsx` | Card-based lesson list with swipe actions |
| `components/v2/lessons/LessonList.Desktop.tsx` | Desktop table view |
| `components/v2/lessons/LessonDetail.tsx` | Mobile-optimized detail view |
| `components/v2/lessons/LessonForm.tsx` | Step-wizard form (following MobileSongForm pattern) |
| `components/v2/lessons/LiveLesson.tsx` | Mobile-optimized live mode |
| `components/v2/lessons/LiveLesson.Desktop.tsx` | Desktop live mode with side panels |
| `components/v2/lessons/useLessonList.ts` | Reuses existing hook |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/lessons/list/LessonTable.tsx` | Replaced by card-based list |
| `components/lessons/form/LessonForm.tsx` | Replaced by step-wizard |
| `components/lessons/live/LiveLessonView.tsx` | Replaced by mobile-optimized live mode |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `StepWizardForm` -- generalized from MobileSongForm
- [x] `SwipeableListItem` -- swipe to edit/delete lessons
- [x] `CollapsibleFilterBar` -- filter chips for status/date
- [ ] `FullScreenSearchPicker` -- for student + song selection on mobile

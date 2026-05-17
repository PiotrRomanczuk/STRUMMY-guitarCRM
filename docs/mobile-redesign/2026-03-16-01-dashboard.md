# Feature 1: Dashboard

> **Tier**: 1 | **Priority**: Core Daily Use

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard (role-switched: Teacher/Student/Admin) |

## Component Tree

### Core
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/Dashboard.tsx` | 43 | Fallback/generic dashboard |
| `components/dashboard/DashboardPageContent.tsx` | ~30 | Content wrapper |
| `components/dashboard/DashboardPageLayout.tsx` | ~40 | Layout wrapper |
| `components/dashboard/DashboardCard.tsx` | ~50 | Reusable card component |
| `components/dashboard/DashboardHeader.tsx` | ~40 | Header section |
| `components/dashboard/DashboardStatsGrid.tsx` | ~60 | Stats grid layout |
| `components/dashboard/StatsCard.tsx` | ~50 | Individual stat card |

### Teacher Dashboard
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/teacher/TeacherDashboardClient.tsx` | ~200 | Main teacher view |
| `components/dashboard/teacher/TeacherLessonSchedule.tsx` | ~80 | Upcoming lessons |
| `components/dashboard/teacher/TeacherRecentLessons.tsx` | ~80 | Recent lesson list |
| `components/dashboard/teacher/TeacherStudentsList.tsx` | ~80 | Student overview |
| `components/dashboard/teacher/StudentList.tsx` | ~100 | Student list component |
| `components/dashboard/teacher/StudentList.Rows.tsx` | ~80 | List row rendering |
| `components/dashboard/teacher/StudentList.Skeleton.tsx` | ~40 | Loading state |
| `components/dashboard/teacher/StudentList.States.tsx` | ~60 | Empty/error states |
| `components/dashboard/teacher/SongLibrary.tsx` | ~80 | Song library widget |
| `components/dashboard/teacher/SongLibrary.Card.tsx` | ~60 | Song card |
| `components/dashboard/teacher/AssignmentList.tsx` | ~80 | Assignment overview |
| `components/dashboard/teacher/TeacherDashboardAlerts.tsx` | ~60 | Alert notifications |
| `components/dashboard/teacher/Performance/TeacherPerformance.Charts.tsx` | ~120 | Performance charts |
| `components/dashboard/teacher/Performance/TeacherPerformance.MetricsGrid.tsx` | ~80 | Metrics grid |

### Student Dashboard
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/student/StudentDashboardClient.tsx` | ~180 | Main student view |
| `components/dashboard/student/NextLessonCard.tsx` | ~80 | Next scheduled lesson |
| `components/dashboard/student/LastLessonCard.tsx` | ~80 | Previous lesson recap |
| `components/dashboard/student/RecentSongsCard.tsx` | ~60 | Recently practiced songs |
| `components/dashboard/student/StatCard.tsx` | ~40 | Individual stat display |
| `components/dashboard/student/AssignmentsCard.tsx` | ~80 | Pending assignments |
| `components/dashboard/student/ProgressChart.tsx` | ~100 | Progress visualization |
| `components/dashboard/student/AchievementsCard.tsx` | ~80 | Achievement badges |
| `components/dashboard/student/PracticeToday.tsx` | ~60 | Daily practice tracker |
| `components/dashboard/student/RecentActivity.tsx` | ~60 | Activity feed |
| `components/dashboard/student/StudentStatsPageClient.tsx` | ~120 | Full stats page |

### Widgets
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/LessonStatsOverview.tsx` | ~80 | Lesson stats summary |
| `components/dashboard/TodaysAgenda.tsx` | ~100 | Daily agenda |
| `components/dashboard/WeeklySummaryCard.tsx` | ~80 | Weekly overview |
| `components/dashboard/NeedsAttentionCard.tsx` | ~80 | Students needing attention |
| `components/dashboard/QuickActionButton.tsx` | ~30 | Quick action button |
| `components/dashboard/QuickActionsSection.tsx` | ~60 | Action button group |
| `components/dashboard/QuickStartChecklist.tsx` | ~80 | Onboarding checklist |
| `components/dashboard/NotificationsAlertsSection.tsx` | ~60 | Notification alerts |
| `components/dashboard/NotificationItem.tsx` | ~40 | Individual notification |
| `components/dashboard/WelcomeTour.tsx` | ~80 | Welcome walkthrough |
| `components/dashboard/GlobalSearch.tsx` | ~100 | Global search bar |

### Health & Calendar Widgets
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/health/HealthAlertsBanner.tsx` | ~60 | Health alerts |
| `components/dashboard/health/HealthSummaryWidget.tsx` | ~80 | Health overview |
| `components/dashboard/calendar/CalendarEventsList.tsx` | ~100 | Calendar events |
| `components/dashboard/calendar/CalendarView.tsx` | ~120 | Calendar display |
| `components/dashboard/calendar/ConnectGoogleButton.tsx` | ~40 | Google connect |

**Total**: ~125 files, ~15,598 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `getTeacherDashboardData()` | `app/actions/teacher/dashboard.ts` | students, activities, chartData, songs, assignments, agenda, stats |
| `getStudentDashboardData()` | `app/actions/student/dashboard.ts` | studentName, nextLesson, lastLesson, assignments, recentSongs, allSongs, stats |
| `getCurrentSongOfTheWeek()` | `app/actions/song-of-the-week.ts` | Current SOTW with song details |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useTeacherPerformance` | `components/dashboard/teacher/Performance/` | `/api/lessons` aggregation |
| `useCohortAnalytics` | `components/dashboard/cohorts/` | `/api/students` aggregation |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/lessons` | GET | Lesson data for dashboard widgets |
| `/api/students` | GET | Student list for teacher dashboard |
| `/api/song` | GET | Song data for library widget |

## User Stories

### Teacher (on phone between lessons)
1. Glance at today's agenda -- who's next, what songs, any prep notes
2. Check which students need attention (missed lessons, overdue assignments)
3. Quick-add a lesson note or mark a lesson complete

### Student (practicing at home)
1. See next lesson date/time and what to prepare
2. Check pending assignments and due dates
3. View practice stats and achievements for motivation

## Mobile Pain Points (at 390px)

1. **Dashboard is information-dense** -- 8+ widgets competing for screen space, no clear hierarchy on mobile
2. **Stats grid forces horizontal scroll** -- grid columns don't collapse cleanly below 400px
3. **Student list uses table layout** -- rows overflow horizontally with no card alternative
4. **Quick actions hidden** -- action buttons blend into the layout, no FAB for primary actions
5. **Calendar widget too compact** -- events are truncated, tap targets overlap
6. **No swipe navigation** -- can't swipe between dashboard sections (agenda, students, stats)

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/dashboard/TeacherDashboard.tsx` | Mobile-first teacher view with card stack |
| `components/v2/dashboard/TeacherDashboard.Desktop.tsx` | Desktop grid enhancement |
| `components/v2/dashboard/StudentDashboard.tsx` | Mobile-first student view |
| `components/v2/dashboard/StudentDashboard.Desktop.tsx` | Desktop enhancement |
| `components/v2/dashboard/widgets/AgendaWidget.tsx` | Swipeable agenda cards |
| `components/v2/dashboard/widgets/StatsWidget.tsx` | Compact stat display |
| `components/v2/dashboard/widgets/AttentionWidget.tsx` | Students needing attention |
| `components/v2/dashboard/widgets/QuickActions.tsx` | FAB + action sheet |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/dashboard/teacher/TeacherDashboardClient.tsx` | Replaced by v2 TeacherDashboard |
| `components/dashboard/student/StudentDashboardClient.tsx` | Replaced by v2 StudentDashboard |
| `components/dashboard/DashboardStatsGrid.tsx` | Replaced by v2 StatsWidget |

### Shared Primitives Needed
- [x] `MobilePageShell` -- consistent header + scroll + safe area
- [x] `CollapsibleFilterBar` -- for quick-switching dashboard sections
- [x] `FloatingActionButton` -- quick lesson/song creation
- [ ] `SwipeableCardStack` -- swipeable widget navigation

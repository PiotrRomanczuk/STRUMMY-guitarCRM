# Feature 7: Calendar

> **Tier**: 2 | **Priority**: Supporting

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/calendar` | Calendar view with Google Calendar sync |

## Component Tree

### Core Calendar
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/calendar/CalendarView.tsx` | ~120 | Main calendar display |
| `components/dashboard/calendar/CalendarEventsList.tsx` | ~100 | Event list view |
| `components/dashboard/calendar/CalendarEventsList.Compact.tsx` | ~60 | Compact list |
| `components/dashboard/calendar/CalendarEventsList.EventCard.tsx` | ~80 | Event card |
| `components/dashboard/calendar/CalendarEventsList.Dialogs.tsx` | ~80 | Event dialogs |
| `components/dashboard/calendar/CalendarDayEvents.tsx` | ~80 | Day events view |
| `components/dashboard/calendar/ConnectGoogleButton.tsx` | ~40 | Google OAuth |
| `components/calendar/DashboardCalendarWidget.tsx` | ~80 | Dashboard widget |

### Lesson Calendar Integration
| File | LOC | Purpose |
|------|-----|---------|
| `components/lessons/integrations/GoogleEventImporter.tsx` | ~100 | Import from Google |
| `components/lessons/integrations/CalendarWebhookControl.tsx` | ~60 | Webhook management |
| `components/lessons/integrations/HistoricalCalendarSync.tsx` | ~80 | Historical sync |

**Total**: ~11 files, ~880 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `detectCalendarConflicts()` | `app/actions/calendar-conflicts.ts` | Conflict[] |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useCalendarBulkSync` | `components/lessons/hooks/useCalendarBulkSync.ts` | `/api/calendar/sync` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/calendar/sync/stream` | GET | SSE calendar sync |
| `/api/auth/google` | GET | Google OAuth callback |
| `/api/oauth2/callback` | GET | OAuth2 callback |

## User Stories

### Teacher (on phone between lessons)
1. Check today's and tomorrow's schedule at a glance — who, when, where
2. Spot scheduling conflicts before they happen
3. Sync Google Calendar to auto-create lessons from existing events

### Student (on phone)
1. See when the next lesson is — date, time, location
2. Add lesson to personal calendar with one tap

## Mobile Pain Points (at 390px)

1. **Calendar grid** — monthly grid cells too small for touch, events truncated
2. **Week view** — horizontal scrolling needed, not intuitive on mobile
3. **Event creation** — form overlaps with calendar, needs separate sheet
4. **Google sync** — streaming sync progress hard to see on small screen
5. **No agenda view** — mobile should default to agenda (list) view, not grid
6. **Conflict detection** — overlap warnings need prominent display

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/calendar/Calendar.tsx` | Mobile-first with agenda default |
| `components/v2/calendar/Calendar.Desktop.tsx` | Desktop month grid |
| `components/v2/calendar/AgendaView.tsx` | List-based agenda (mobile default) |
| `components/v2/calendar/WeekStrip.tsx` | Horizontal scrollable week selector |
| `components/v2/calendar/EventSheet.tsx` | Bottom sheet for event details |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/dashboard/calendar/CalendarView.tsx` | Replaced by v2 Calendar |
| `components/dashboard/calendar/CalendarEventsList.tsx` | Replaced by v2 AgendaView |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `BottomActionSheet` — event creation/details
- [ ] `HorizontalWeekStrip` — swipeable week day selector
- [ ] `AgendaTimeline` — time-based event list

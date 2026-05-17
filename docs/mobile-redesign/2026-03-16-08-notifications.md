# Feature 8: Notifications

> **Tier**: 2 | **Priority**: Supporting

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/notifications` | Full notification center |

## Component Tree

| File | LOC | Purpose |
|------|-----|---------|
| `components/notifications/NotificationBell.tsx` | ~80 | Header bell with unread count |
| `components/notifications/NotificationBell.Item.tsx` | ~60 | Individual notification row |
| `components/notifications/NotificationCenter.tsx` | ~120 | Full notification list |
| `components/notifications/useNotifications.ts` | ~80 | Real-time subscription hook |
| `components/notifications/index.ts` | ~10 | Re-exports |

**Total**: 5 files, ~350 LOC

## Data Contract

### Server Actions
| Action | File | Returns |
|--------|------|---------|
| `getInAppNotifications(userId, opts)` | `app/actions/in-app-notifications.ts` | Notification[] with pagination |
| `markNotificationAsRead(id)` | `app/actions/in-app-notifications.ts` | Updated notification |
| `markAllNotificationsAsRead(userId)` | `app/actions/in-app-notifications.ts` | Count of marked |
| `getUnreadNotificationCount(userId)` | `app/actions/in-app-notifications.ts` | number |

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useNotifications` | `components/notifications/useNotifications.ts` | Supabase realtime subscription |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/cron/process-notification-queue` | POST | Process queued notifications |

## User Stories

### Teacher (on phone)
1. See notification bell badge — know if there's something new without opening the app fully
2. Quick-read notifications — student completed assignment, new song request, upcoming lesson reminder
3. Mark all as read with one tap

### Student (on phone)
1. Get notified when teacher assigns new work or posts a song of the week
2. See lesson reminders — date/time/prep notes
3. Dismiss individual notifications by swiping

## Mobile Pain Points (at 390px)

1. **Notification center is minimal** — just a list, no grouping by type or time
2. **No swipe-to-dismiss** — have to tap into each notification
3. **Bell icon** — badge count may not be visible enough on mobile header
4. **Real-time updates** — new notifications don't animate in smoothly
5. **No notification settings inline** — have to navigate to settings separately

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/notifications/NotificationCenter.tsx` | Grouped, swipeable notification list |
| `components/v2/notifications/NotificationCenter.Desktop.tsx` | Desktop panel view |
| `components/v2/notifications/NotificationItem.tsx` | Swipeable notification row |
| `components/v2/notifications/NotificationBell.tsx` | Enhanced bell with animation |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/notifications/NotificationCenter.tsx` | Replaced by grouped v2 |
| `components/notifications/NotificationBell.Item.tsx` | Replaced by v2 item |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `SwipeableListItem` — swipe to dismiss/mark-read
- [ ] `GroupedList` — group notifications by time (Today, Yesterday, This Week)

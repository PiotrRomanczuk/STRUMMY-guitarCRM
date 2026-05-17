# Feature 15: Admin Tools

> **Tier**: 3 | **Priority**: Admin & Analytics

## Current Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/admin/debug` | Debug/health panel |
| `/dashboard/admin/documentation` | Internal documentation |
| `/dashboard/admin/drive-videos` | Google Drive video management |
| `/dashboard/admin/spotify-matches` | Spotify song matching queue |
| `/dashboard/admin/notifications` | Notification analytics |
| `/dashboard/logs` | Activity log viewer |

## Component Tree

### Admin Core
| File | LOC | Purpose |
|------|-----|---------|
| `components/admin/NotificationAnalytics.tsx` | ~100 | Notification metrics |
| `components/admin/NotificationAnalytics.Charts.tsx` | ~80 | Analytics charts |
| `components/admin/useNotificationAnalytics.ts` | ~60 | Analytics hook |
| `components/admin/index.ts` | ~10 | Re-exports |

### Debug Panel (12 files)
| File | LOC | Purpose |
|------|-----|---------|
| `components/debug/ServicesGrid.tsx` | ~80 | Service status grid |
| `components/debug/ServiceCard.tsx` | ~60 | Individual service card |
| `components/debug/StatusBadge.tsx` | ~20 | Status indicator |
| `components/debug/DebugRefreshButton.tsx` | ~30 | Manual refresh |
| `components/debug/DatabaseStatus.tsx` | ~60 | DB health check |
| `components/debug/SimpleDatabaseStatus.tsx` | ~40 | Simple DB status |
| `components/debug/BackendDatabaseIndicator.tsx` | ~40 | Backend DB indicator |
| `components/debug/CronStatusPanel.tsx` | ~80 | Cron job status |
| `components/debug/AIGenerationsPanel.tsx` | ~60 | AI generation metrics |
| `components/debug/AIProviderPanel.tsx` | ~60 | AI provider status |
| `components/debug/AIQueuePanel.tsx` | ~60 | AI queue status |
| `components/debug/index.ts` | ~10 | Re-exports |

### Logs
| File | LOC | Purpose |
|------|-----|---------|
| `components/logs/LogsPageClient.tsx` | ~300 | Client-side log viewer |
| `components/logs/SystemLogs.tsx` | ~200 | System log display |

### Drive Videos (in dashboard/admin)
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/admin/drive-videos/` | ~500 | Drive video sync & management |

### Spotify Matches (in dashboard/admin)
| File | LOC | Purpose |
|------|-----|---------|
| `components/dashboard/admin/SpotifyMatchesClient.tsx` | ~150 | Match approval queue |

**Total**: ~25 files, ~2,100 LOC

## Data Contract

### Hooks (Client)
| Hook | File | Data Source |
|------|------|-------------|
| `useNotificationAnalytics` | `components/admin/useNotificationAnalytics.ts` | `/api/admin/notification-analytics` |
| `useDriveVideos` | `components/dashboard/admin/hooks/useDriveVideos.ts` | `/api/admin/drive-videos` |
| `useAdminUsers` | `components/dashboard/admin/hooks/useAdminUsers.ts` | `/api/admin/users` |

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/drive-sync` | POST | Trigger Drive sync |
| `/api/admin/drive-videos` | GET, POST, DELETE | Drive video CRUD |
| `/api/admin/lessons` | GET | Admin lesson queries |
| `/api/admin/users` | GET, PUT | Admin user management |
| `/api/admin/notification-analytics` | GET | Notification metrics |
| `/api/admin/set-passwords` | POST | Password management |
| `/api/health` | GET | Service health check |

## User Stories

### Admin (on phone)
1. Quick health check — are all services running (DB, cron, AI)?
2. Approve/reject Spotify song matches from the queue
3. Check if any cron jobs have failed recently

### Teacher (admin role, on phone)
1. Review activity logs to see student engagement
2. Check notification delivery stats
3. Manage Drive video sync

## Mobile Pain Points (at 390px)

1. **Service grid** — cards don't stack cleanly in single column
2. **Log viewer** — monospace text overflows, needs horizontal scroll
3. **Spotify match queue** — album art + song info + approve/reject buttons cramped
4. **Notification charts** — same Nivo chart sizing issues as statistics
5. **Drive video list** — file management table overflows
6. **Admin-only** — lower priority for mobile optimization since admin work typically done on desktop

## Figma Design Link

> To be filled when designed

## Implementation Spec

### New Files (v2)
| File | Purpose |
|------|---------|
| `components/v2/admin/AdminDashboard.tsx` | Mobile-first admin overview with status cards |
| `components/v2/admin/AdminDashboard.Desktop.tsx` | Desktop grid layout |
| `components/v2/admin/HealthCheck.tsx` | Compact service status list |
| `components/v2/admin/SpotifyQueue.tsx` | Swipeable approve/reject queue |
| `components/v2/admin/LogViewer.tsx` | Mobile-friendly log display |

### Files to Deprecate (v1)
| File | Reason |
|------|--------|
| `components/debug/ServicesGrid.tsx` | Replaced by v2 HealthCheck |
| `components/logs/LogsPageClient.tsx` | Replaced by v2 LogViewer |

### Shared Primitives Needed
- [x] `MobilePageShell`
- [x] `SwipeableListItem` — swipe to approve/reject Spotify matches
- [ ] `ServiceStatusCard` — compact service health indicator
- [ ] `MobileLogView` — horizontally scrollable monospace log display

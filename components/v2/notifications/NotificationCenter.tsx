'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useNotifications } from '@/components/notifications/useNotifications';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import { NotificationCenterEmpty, NotificationCenterSkeleton } from './NotificationCenter.Empty';
import type { InAppNotification } from '@/lib/services/in-app-notification-service';

const NotificationCenterDesktop = lazy(() => import('./NotificationCenter.Desktop'));

interface NotificationCenterProps {
  userId: string;
}

type FilterStatus = 'all' | 'unread';

interface NotificationGroup {
  label: string;
  notifications: InAppNotification[];
}

function groupNotifications(notifications: InAppNotification[]): NotificationGroup[] {
  const groups: Record<string, InAppNotification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    'This Month': [],
    Older: [],
  };

  for (const n of notifications) {
    const date = new Date(n.created_at);
    if (isToday(date)) groups['Today'].push(n);
    else if (isYesterday(date)) groups['Yesterday'].push(n);
    else if (isThisWeek(date)) groups['This Week'].push(n);
    else if (isThisMonth(date)) groups['This Month'].push(n);
    else groups['Older'].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, notifications: items }));
}

/**
 * v2 NotificationCenter -- grouped, swipeable notification list.
 *
 * Mobile: filter chips + grouped list with swipe actions.
 * Desktop: lazy-loaded panel view.
 */
export function NotificationCenter({ userId }: NotificationCenterProps) {
  const mode = useLayoutMode();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId, { limit: 100 });

  const displayed = useMemo(
    () => (filterStatus === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filterStatus]
  );

  const groups = useMemo(() => groupNotifications(displayed), [displayed]);

  if (mode !== 'mobile') {
    return (
      <Suspense fallback={<NotificationCenterSkeleton />}>
        <NotificationCenterDesktop userId={userId} />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Header with filter chips */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={markAllAsRead}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <FilterChip label="All" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
          <FilterChip
            label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            active={filterStatus === 'unread'}
            onClick={() => setFilterStatus('unread')}
          />
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <NotificationCenterSkeleton />
        ) : displayed.length === 0 ? (
          <NotificationCenterEmpty filterStatus={filterStatus} />
        ) : (
          <div className="space-y-6 px-4 py-4">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </h2>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                  {group.notifications.map((notification) => (
                    <motion.div key={notification.id} variants={listItem}>
                      <NotificationItem notification={notification} onMarkAsRead={markAsRead} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Filter chip button */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors',
        'border border-border min-h-[44px]',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground'
      )}
    >
      {label}
    </button>
  );
}

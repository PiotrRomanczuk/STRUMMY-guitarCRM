'use client';

import { useState, useMemo } from 'react';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Check, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/components/notifications/useNotifications';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import { NotificationCenterEmpty, NotificationCenterSkeleton } from './NotificationCenter.Empty';
import type { InAppNotification } from '@/lib/services/in-app-notification-service';

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

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors',
        'border border-border',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground'
      )}
    >
      {label}
    </button>
  );
}

interface NotificationCenterDesktopProps {
  userId: string;
}

export default function NotificationCenterDesktop({ userId }: NotificationCenterDesktopProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId, { limit: 100 });

  const displayed = useMemo(
    () => (filterStatus === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filterStatus]
  );

  const groups = useMemo(() => groupNotifications(displayed), [displayed]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-8 pt-7 pb-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">Inbox</div>
            <h1 className="mt-1 font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">Notifications</h1>
            <div className="text-muted-foreground text-[13px] mt-1.5">
              {displayed.length} {displayed.length === 1 ? 'notification' : 'notifications'}{filterStatus === 'unread' ? ' unread' : ''}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="flex gap-2.5 items-center p-3 bg-card border border-border rounded-[10px]">
          <FilterChip label="All" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
          <FilterChip
            label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            active={filterStatus === 'unread'}
            onClick={() => setFilterStatus('unread')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 pb-10">
        {isLoading ? (
          <NotificationCenterSkeleton />
        ) : displayed.length === 0 ? (
          <NotificationCenterEmpty filterStatus={filterStatus} />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium mb-3">
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

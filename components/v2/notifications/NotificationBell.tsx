'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/components/notifications/useNotifications';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  userId?: string;
}

/**
 * Enhanced notification bell for v2 navigation header.
 *
 * Mobile: navigates to /dashboard/notifications on tap.
 * Desktop: shows popover dropdown with recent notifications.
 *
 * Features:
 * - Animated badge with scale-in effect
 * - Ring animation on new notifications
 * - Larger touch target (44px) on mobile
 */
export function NotificationBell({ userId }: NotificationBellProps) {
  const mode = useLayoutMode();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId, { limit: 10 });

  const handleMarkAsRead = useCallback(
    (id: string) => markAsRead(id),
    [markAsRead]
  );

  if (!userId) return null;

  // Mobile: simple link to notifications page
  if (mode === 'mobile') {
    return (
      <Link
        href="/dashboard/notifications"
        className="relative p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5 text-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'bg-destructive text-white text-[10px] font-bold',
                'rounded-full min-w-[18px] h-[18px]',
                'flex items-center justify-center px-1'
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  }

  // Desktop: popover with notification list
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'absolute -top-1 -right-1',
                  'bg-destructive text-white text-xs font-semibold',
                  'rounded-full h-5 w-5',
                  'flex items-center justify-center'
                )}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border bg-muted/50">
            <Button variant="ghost" className="w-full h-9 text-sm" asChild>
              <Link href="/dashboard/notifications">View All Notifications</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

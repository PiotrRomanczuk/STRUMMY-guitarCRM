/**
 * useNotifications Hook
 *
 * Custom hook for managing in-app notifications with:
 * - Real-time Supabase subscription
 * - Unread count tracking
 * - Mark as read functionality
 * - Optimistic updates for instant UI feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/app/actions/in-app-notifications';
import type { InAppNotification } from '@/lib/services/in-app-notification-service';
import { logger } from '@/lib/logger';

export interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

export function useNotifications(userId?: string, options: UseNotificationsOptions = {}) {
  const { limit = 20, unreadOnly = false } = options;

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Real-time subscription
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const channel = supabase
      .channel('in_app_notifications')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`,
        } as any,
        handleRealtimeUpdate
      )
      .subscribe();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: supabase client is stable; fetchNotifications/handleRealtimeUpdate are non-memoized helpers; adding them would cause infinite loops
  }, [userId, limit, unreadOnly]);

  async function fetchNotifications() {
    if (!userId) return;

    try {
      let query = supabase
        .from('in_app_notifications')
        .select('id, user_id, notification_type, title, body, icon, variant, is_read, read_at, action_url, action_label, entity_type, entity_id, priority, created_at, updated_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[useNotifications] Fetch error:', error);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications((data as InAppNotification[]) || []);
        setUnreadCount((data as InAppNotification[])?.filter((n) => !n.is_read).length || 0);
      }
    } catch (error) {
      logger.error('[useNotifications] Fetch exception:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRealtimeUpdate(payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: InAppNotification;
    old: InAppNotification;
  }) {
    if (payload.eventType === 'INSERT') {
      // Add new notification to the top
      setNotifications((prev) => {
        const newNotifications = [payload.new, ...prev];
        // Respect limit
        return newNotifications.slice(0, limit);
      });

      // Increment unread count if unread
      if (!payload.new.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    } else if (payload.eventType === 'UPDATE') {
      // Update existing notification
      setNotifications((prev) =>
        prev.map((n) => (n.id === payload.new.id ? payload.new : n))
      );

      // Update unread count if read status changed
      if (payload.old && !payload.old.is_read && payload.new.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else if (payload.old && payload.old.is_read && !payload.new.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    } else if (payload.eventType === 'DELETE') {
      // Remove notification
      setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));

      // Decrement unread count if it was unread
      if (payload.old && !payload.old.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  }

  async function markAsRead(notificationId: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Server update (will trigger realtime update, but we've already updated optimistically)
    const success = await markNotificationAsRead(notificationId);

    if (!success) {
      // Revert optimistic update on failure
      logger.error('[useNotifications] Failed to mark as read');
      fetchNotifications();
    }
  }

  async function markAllAsRead() {
    if (!userId) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);

    // Server update
    const success = await markAllNotificationsAsRead(userId);

    if (!success) {
      // Revert optimistic update on failure
      logger.error('[useNotifications] Failed to mark all as read');
      fetchNotifications();
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

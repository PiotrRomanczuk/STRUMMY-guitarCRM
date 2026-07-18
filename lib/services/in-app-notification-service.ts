/**
 * In-App Notification Service
 *
 * Core service for managing in-app notifications with:
 * - Creating notifications with visual variants and actions
 * - Real-time updates via Supabase Realtime
 * - Read/unread status management
 * - Polymorphic entity references
 */

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { NotificationType } from '@/types/notifications';
import type { Database } from '@/database.types';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export type InAppNotification = Database['public']['Tables']['in_app_notifications']['Row'];

export interface CreateInAppNotificationParams {
  type: NotificationType;
  recipientUserId: string;
  title: string;
  body: string;
  icon?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
  priority?: number;
}

export interface GetUserNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Create a new in-app notification
 */
export async function createInAppNotification(
  params: CreateInAppNotificationParams
): Promise<InAppNotification | null> {
  const {
    type,
    recipientUserId,
    title,
    body,
    icon,
    variant = 'default',
    actionUrl,
    actionLabel,
    entityType,
    entityId,
    priority = 5,
  } = params;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('in_app_notifications')
      .insert({
        user_id: recipientUserId,
        notification_type: type,
        title,
        body,
        icon,
        variant,
        action_url: actionUrl,
        action_label: actionLabel,
        entity_type: entityType,
        entity_id: entityId,
        priority,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('[in-app-notification-service] Create error:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[in-app-notification-service] Create exception:', error);
    return null;
  }
}

/**
 * Mark a single notification as read. `userId` scopes the update to the
 * caller's own rows — this runs on the admin client (RLS bypassed), so the
 * ownership filter is the only thing preventing marking another user's
 * notification as read.
 */
export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('in_app_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('[in-app-notification-service] Mark as read error:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[in-app-notification-service] Mark as read exception:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('in_app_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error('[in-app-notification-service] Mark all as read error:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[in-app-notification-service] Mark all as read exception:', error);
    return false;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from('in_app_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error('[in-app-notification-service] Get unread count error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('[in-app-notification-service] Get unread count exception:', error);
    return 0;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: GetUserNotificationsOptions = {}
): Promise<InAppNotification[]> {
  const { limit = 50, unreadOnly = false } = options;

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('in_app_notifications')
      .select(
        'id, user_id, notification_type, title, body, icon, variant, action_url, action_label, entity_type, entity_id, priority, is_read, read_at, created_at, updated_at, expires_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[in-app-notification-service] Get notifications error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[in-app-notification-service] Get notifications exception:', error);
    return [];
  }
}

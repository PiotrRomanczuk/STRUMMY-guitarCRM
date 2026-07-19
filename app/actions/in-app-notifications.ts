/**
 * In-App Notifications Server Actions
 *
 * UI-facing server actions for notification bell and notification center.
 * These actions are called from client components.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getUserNotifications as serviceGetUserNotifications,
  markAsRead as serviceMarkAsRead,
  markAllAsRead as serviceMarkAllAsRead,
  getUnreadCount as serviceGetUnreadCount,
  type InAppNotification,
  type GetUserNotificationsOptions,
} from '@/lib/services/in-app-notification-service';

/**
 * Get in-app notifications for the current user
 */
export async function getInAppNotifications(
  userId: string,
  options?: GetUserNotificationsOptions
): Promise<InAppNotification[]> {
  const notifications = await serviceGetUserNotifications(userId, options);
  return notifications;
}

/**
 * Mark a single notification as read. Ownership is derived from the caller's
 * session, not a client-supplied id — the underlying update runs on the admin
 * client, so this is the only guard against marking another user's row.
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const success = await serviceMarkAsRead(notificationId, user.id);

  if (success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/notifications');
  }

  return success;
}

/**
 * Mark all notifications as read for a user. `userId` must match the caller's
 * own session — see markNotificationAsRead for why.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return false;

  const success = await serviceMarkAllAsRead(userId);

  if (success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/notifications');
  }

  return success;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await serviceGetUnreadCount(userId);
}

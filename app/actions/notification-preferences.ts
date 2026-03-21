'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { NotificationPreference, NotificationType } from '@/types/notifications';
import { logger } from '@/lib/logger';

/**
 * Result type for server actions
 */
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all notification preferences for a user
 *
 * @param userId - The user ID to fetch preferences for
 * @returns Result with array of notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<ActionResult<NotificationPreference[]>> {
  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // RLS check: Users can only access their own preferences
  // Admins can access any user's preferences (handled by RLS policy)
  if (user.id !== userId) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Cannot access other users preferences' };
    }
  }

  // Fetch preferences with RLS enforcement
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('id, user_id, notification_type, enabled, delivery_channel, created_at, updated_at')
    .eq('user_id', userId)
    .order('notification_type', { ascending: true });

  if (error) {
    logger.error('Error fetching notification preferences:', error);
    return { success: false, error: 'Failed to fetch notification preferences' };
  }

  return { success: true, data };
}

/**
 * Update a single notification preference
 *
 * @param userId - The user ID whose preference to update
 * @param type - The notification type to update
 * @param enabled - Whether the notification should be enabled
 * @returns Result indicating success or failure
 */
export async function updateNotificationPreference(
  userId: string,
  type: NotificationType,
  enabled: boolean
): Promise<ActionResult> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return guard;

  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // RLS check: Users can only modify their own preferences
  if (user.id !== userId) {
    return { success: false, error: 'Unauthorized: Cannot modify other users preferences' };
  }

  // Update preference (RLS ensures user can only update their own)
  const { error } = await supabase
    .from('notification_preferences')
    .update({ enabled })
    .eq('user_id', userId)
    .eq('notification_type', type);

  if (error) {
    logger.error('Error updating notification preference:', error);
    return { success: false, error: 'Failed to update notification preference' };
  }

  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');

  return { success: true };
}

/**
 * Bulk enable or disable all notification preferences for a user
 *
 * @param userId - The user ID whose preferences to update
 * @param enabled - Whether all notifications should be enabled or disabled
 * @returns Result indicating success or failure
 */
export async function updateAllNotificationPreferences(
  userId: string,
  enabled: boolean
): Promise<ActionResult> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return guard;

  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // RLS check: Users can only modify their own preferences
  if (user.id !== userId) {
    return { success: false, error: 'Unauthorized: Cannot modify other users preferences' };
  }

  // Bulk update all preferences (RLS ensures user can only update their own)
  const { error } = await supabase
    .from('notification_preferences')
    .update({ enabled })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating all notification preferences:', error);
    return { success: false, error: 'Failed to update all notification preferences' };
  }

  // Revalidate settings page to reflect changes
  revalidatePath('/dashboard/settings');

  return { success: true };
}

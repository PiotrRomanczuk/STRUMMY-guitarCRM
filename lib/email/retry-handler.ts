/**
 * Retry Handler for Email Notifications
 *
 * Handles retry logic with exponential backoff for failed email notifications.
 * Implements a 5-attempt retry schedule: 1min, 5min, 30min, 2hr, 24hr
 */

import { createAdminClient } from '@/lib/supabase/admin';
import {
  logNotificationRetry,
  logDeadLetter,
  logError,
  logInfo,
} from '@/lib/logging/notification-logger';
import type { NotificationLog, NotificationStatus } from '@/types/notifications';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of retry attempts before moving to dead letter
 */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Exponential backoff schedule in minutes
 * [1min, 5min, 30min, 2hr, 24hr]
 */
export const BACKOFF_SCHEDULE_MINUTES = [1, 5, 30, 120, 1440];

/**
 * Status to set when max retries exceeded
 */
export const DEAD_LETTER_STATUS: NotificationStatus = 'bounced';

// ============================================================================
// BACKOFF CALCULATION
// ============================================================================

/**
 * Calculate exponential backoff time in minutes based on retry count
 *
 * @param retryCount - Current retry attempt count (0-indexed)
 * @returns Backoff time in minutes
 *
 * @example
 * calculateBackoffMinutes(0) // 1 (first retry after 1 minute)
 * calculateBackoffMinutes(1) // 5 (second retry after 5 minutes)
 * calculateBackoffMinutes(4) // 1440 (fifth retry after 24 hours)
 * calculateBackoffMinutes(5) // 1440 (defaults to 24 hours for out of range)
 */
export function calculateBackoffMinutes(retryCount: number): number {
  if (retryCount < 0) {
    return BACKOFF_SCHEDULE_MINUTES[0];
  }

  return BACKOFF_SCHEDULE_MINUTES[retryCount] || BACKOFF_SCHEDULE_MINUTES[BACKOFF_SCHEDULE_MINUTES.length - 1];
}

/**
 * Calculate the next retry timestamp
 *
 * @param lastAttemptAt - ISO timestamp of last retry attempt
 * @param retryCount - Current retry attempt count
 * @returns ISO timestamp for next retry
 *
 * @example
 * calculateNextRetryTime('2024-01-01T12:00:00Z', 0)
 * // Returns '2024-01-01T12:01:00Z' (1 minute later)
 */
export function calculateNextRetryTime(lastAttemptAt: string, retryCount: number): string {
  const backoffMinutes = calculateBackoffMinutes(retryCount);
  const nextRetryDate = new Date(lastAttemptAt);
  nextRetryDate.setMinutes(nextRetryDate.getMinutes() + backoffMinutes);
  return nextRetryDate.toISOString();
}

// ============================================================================
// RETRY READINESS
// ============================================================================

/**
 * Check if a notification is ready for retry based on backoff schedule
 *
 * @param notification - Notification log entry
 * @param currentTime - Current time (defaults to now, can be overridden for testing)
 * @returns True if enough time has passed for retry
 *
 * @example
 * const notification = {
 *   retry_count: 0,
 *   updated_at: '2024-01-01T12:00:00Z',
 *   status: 'failed'
 * };
 * isReadyForRetry(notification, new Date('2024-01-01T12:02:00Z'))
 * // Returns true (2 minutes > 1 minute backoff)
 */
export function isReadyForRetry(
  notification: Pick<NotificationLog, 'retry_count' | 'updated_at' | 'status'>,
  currentTime: Date = new Date()
): boolean {
  // Only retry failed notifications
  if (notification.status !== 'failed') {
    return false;
  }

  const backoffMinutes = calculateBackoffMinutes(notification.retry_count);
  const nextRetryTime = new Date(notification.updated_at);
  nextRetryTime.setMinutes(nextRetryTime.getMinutes() + backoffMinutes);

  return currentTime >= nextRetryTime;
}

/**
 * Check if notification has exceeded max retries
 *
 * @param retryCount - Current retry count
 * @returns True if max retries exceeded
 */
export function hasExceededMaxRetries(retryCount: number): boolean {
  return retryCount >= MAX_RETRY_ATTEMPTS;
}

/**
 * Check if notification should be moved to dead letter
 *
 * @param notification - Notification log entry
 * @returns True if should be moved to dead letter (max retries exceeded and still failed)
 */
export function shouldMoveToDeadLetter(
  notification: Pick<NotificationLog, 'retry_count' | 'status'>
): boolean {
  return notification.status === 'failed' && hasExceededMaxRetries(notification.retry_count);
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Update notification log with retry information
 *
 * @param notificationId - Notification log entry ID
 * @param status - New status ('sent' or 'failed')
 * @param retryCount - New retry count
 * @param errorMessage - Error message (if failed)
 * @returns True if update successful
 */
export async function updateNotificationRetry(
  notificationId: string,
  status: 'sent' | 'failed' | typeof DEAD_LETTER_STATUS,
  retryCount: number,
  errorMessage?: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      retry_count: retryCount,
      status,
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
      updateData.error_message = null;
    } else if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('notification_log')
      .update(updateData as { status?: string; retry_count?: number; sent_at?: string | null; error_message?: string | null })
      .eq('id', notificationId);

    if (error) {
      logError(
        'Failed to update notification retry',
        error instanceof Error ? error : new Error('Failed to update notification retry'),
        { notification_id: notificationId }
      );
      return false;
    }

    if (status === 'sent') {
      logInfo('Notification retry successful', {
        notification_id: notificationId,
        retry_count: retryCount,
      });
    } else {
      logNotificationRetry(
        notificationId,
        retryCount,
        calculateNextRetryTime(new Date().toISOString(), retryCount),
        undefined,
        undefined,
        { error_message: errorMessage }
      );
    }

    return true;
  } catch (error) {
    logError(
      'updateNotificationRetry error',
      error instanceof Error ? error : new Error('Unknown error'),
      { notification_id: notificationId }
    );
    return false;
  }
}

/**
 * Move notification to dead letter queue (max retries exceeded)
 *
 * @param notificationId - Notification log entry ID
 * @param finalErrorMessage - Final error message to log
 * @returns True if update successful
 */
export async function moveToDeadLetter(
  notificationId: string,
  finalErrorMessage?: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const errorMsg = finalErrorMessage || 'Maximum retry attempts exceeded';

    const { error } = await supabase
      .from('notification_log')
      .update({
        status: DEAD_LETTER_STATUS,
        error_message: errorMsg,
      })
      .eq('id', notificationId);

    if (error) {
      logError(
        'Failed to move notification to dead letter',
        error instanceof Error ? error : new Error('Failed to move notification to dead letter'),
        { notification_id: notificationId }
      );
      return false;
    }

    logDeadLetter(notificationId, errorMsg);
    return true;
  } catch (error) {
    logError(
      'moveToDeadLetter error',
      error instanceof Error ? error : new Error('Unknown error'),
      { notification_id: notificationId }
    );
    return false;
  }
}

/**
 * Get failed notifications ready for retry
 *
 * @param limit - Maximum number of notifications to retrieve
 * @returns Array of notifications ready for retry
 */
export async function getRetryableNotifications(
  limit: number = 50
): Promise<NotificationLog[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notification_log')
      .select('id, notification_type, recipient_user_id, recipient_email, status, subject, template_data, sent_at, error_message, retry_count, max_retries, entity_type, entity_id, created_at, updated_at')
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRY_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logError(
        'Failed to fetch retryable notifications',
        error instanceof Error ? error : new Error('Failed to fetch retryable notifications')
      );
      return [];
    }

    // Filter by backoff schedule
    const currentTime = new Date();
    const typedData = (data || []) as unknown as NotificationLog[];
    const readyNotifications = typedData.filter(notification =>
      isReadyForRetry(notification, currentTime)
    );

    logInfo(`Found ${readyNotifications.length} notifications ready for retry`);

    return readyNotifications;
  } catch (error) {
    logError(
      'getRetryableNotifications error',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return [];
  }
}

/**
 * Get notifications that should be moved to dead letter
 *
 * @param limit - Maximum number of notifications to retrieve
 * @returns Array of notifications to move to dead letter
 */
export async function getDeadLetterCandidates(
  limit: number = 100
): Promise<NotificationLog[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notification_log')
      .select('id, notification_type, recipient_user_id, recipient_email, status, subject, template_data, sent_at, error_message, retry_count, max_retries, entity_type, entity_id, created_at, updated_at')
      .eq('status', 'failed')
      .gte('retry_count', MAX_RETRY_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logError(
        'Failed to fetch dead letter candidates',
        error instanceof Error ? error : new Error('Failed to fetch dead letter candidates')
      );
      return [];
    }

    return (data || []) as unknown as NotificationLog[];
  } catch (error) {
    logError(
      'getDeadLetterCandidates error',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return [];
  }
}

/**
 * Batch move notifications to dead letter
 *
 * @returns Number of notifications moved
 */
export async function processDeadLetterQueue(): Promise<number> {
  try {
    const candidates = await getDeadLetterCandidates();

    let moved = 0;
    for (const notification of candidates) {
      const success = await moveToDeadLetter(
        notification.id,
        `Max retries (${MAX_RETRY_ATTEMPTS}) exceeded. Last error: ${notification.error_message || 'Unknown'}`
      );
      if (success) {
        moved++;
      }
    }

    logInfo(`Processed dead letter queue: ${moved} notifications moved`);

    return moved;
  } catch (error) {
    logError(
      'processDeadLetterQueue error',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return 0;
  }
}

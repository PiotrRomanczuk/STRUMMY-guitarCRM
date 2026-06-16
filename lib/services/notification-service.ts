/**
 * Notification Service
 *
 * Core service for sending email notifications with:
 * - User preference checking
 * - Notification queuing
 * - Retry logic with exponential backoff
 * - Comprehensive logging
 */

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import transporter, { isSmtpConfigured } from '@/lib/email/smtp-client';
import { getDeliverableEmail } from '@/lib/email/recipient';
import { checkRateLimit, checkSystemRateLimit } from '@/lib/email/rate-limiter';
import {
  logNotificationSent,
  logNotificationFailed,
  logNotificationQueued,
  logNotificationSkipped,
  logError,
} from '@/lib/logging/notification-logger';
import { createInAppNotification } from '@/lib/services/in-app-notification-service';
import {
  generateInAppContent,
  getPriorityForType,
} from '@/lib/services/notification-in-app-content';
import {
  getDeliveryChannel,
  getNotificationSubject,
  getNotificationHtml,
} from '@/lib/services/notification-helpers';
import type {
  NotificationType,
  SendNotificationParams,
  QueueNotificationParams,
  NotificationResult,
} from '@/types/notifications';
import type { Json } from '@/database.types';

// ============================================================================
// STUDENT EMAIL KILL SWITCH
// ============================================================================

/**
 * Check if student emails are enabled via environment variable.
 * When STUDENT_EMAILS_ENABLED is not 'true', all student emails are blocked
 * but in-app notifications still work.
 */
function isStudentEmailEnabled(): boolean {
  return process.env.STUDENT_EMAILS_ENABLED === 'true';
}

// ============================================================================
// MAIN NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send a notification immediately (checks preferences, logs attempt)
 * Supports dual-channel routing: email, in-app, or both
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const { type, recipientUserId, templateData, entityType, entityId } = params;

  try {
    const supabase = createAdminClient();

    // 1. Get recipient info (include is_student for student email kill switch)
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_student, is_shadow, invite_email')
      .eq('id', recipientUserId)
      .single();

    if (recipientError || !recipient) {
      logError(
        'Recipient not found',
        recipientError instanceof Error ? recipientError : new Error('Recipient not found'),
        { user_id: recipientUserId, notification_type: type }
      );
      return {
        success: false,
        error: 'Recipient not found',
      };
    }

    // 2. Check user preferences
    const preferenceEnabled = await checkUserPreference(recipientUserId, type);

    if (!preferenceEnabled) {
      // Log as skipped
      const { data: logEntry } = await supabase
        .from('notification_log')
        .insert({
          notification_type: type,
          recipient_user_id: recipientUserId,
          recipient_email: recipient.email,
          status: 'skipped',
          subject: getNotificationSubject(type, templateData),
          template_data: templateData as unknown as Json,
          entity_type: entityType,
          entity_id: entityId,
        })
        .select('id')
        .single();

      logNotificationSkipped(recipientUserId, type, 'User preference disabled', {
        notification_id: logEntry?.id,
        recipient_email: recipient.email,
        entity_type: entityType,
        entity_id: entityId,
      });

      return {
        success: true,
        skipped: true,
        logId: logEntry?.id,
      };
    }

    // 3. Get delivery channel (email, in-app, or both)
    let deliveryChannel = await getDeliveryChannel(recipientUserId, type);

    // Student email kill switch: force in-app only for students when emails disabled
    if (recipient.is_student && !isStudentEmailEnabled()) {
      if (deliveryChannel === 'email' || deliveryChannel === 'both') {
        const originalChannel = deliveryChannel;
        deliveryChannel = 'in_app';
        logNotificationSkipped(
          recipientUserId,
          type,
          'Student emails disabled (STUDENT_EMAILS_ENABLED != true)',
          {
            recipient_email: recipient.email,
            entity_type: entityType,
            entity_id: entityId,
            original_channel: originalChannel,
          }
        );
      }
    }

    const results: { email: boolean | null; inApp: boolean | null } = {
      email: null,
      inApp: null,
    };

    // 4. Send via in-app if enabled
    if (deliveryChannel === 'in_app' || deliveryChannel === 'both') {
      const inAppContent = generateInAppContent(type, templateData);
      const inAppNotification = await createInAppNotification({
        type,
        recipientUserId,
        ...inAppContent,
        entityType,
        entityId: entityId || '',
        priority: getPriorityForType(type),
      });
      results.inApp = !!inAppNotification;
    }

    // 5. Send via email if enabled (skip email logic if in-app only)
    if (deliveryChannel === 'email' || deliveryChannel === 'both') {
      // Continue with existing email logic below...

      // 5.1. Generate email content
      const subject = getNotificationSubject(type, templateData);
      const htmlContent = await getNotificationHtml(type, templateData, recipient);

      // 5.2. Create log entry (pending)
      const { data: logEntry, error: logEntryError } = await supabase
        .from('notification_log')
        .insert({
          notification_type: type,
          recipient_user_id: recipientUserId,
          recipient_email: recipient.email,
          status: 'pending',
          subject,
          template_data: templateData as unknown as Json,
          entity_type: entityType,
          entity_id: entityId,
        })
        .select('id')
        .single();

      if (logEntryError || !logEntry) {
        logError(
          'Failed to create log entry',
          logEntryError instanceof Error ? logEntryError : new Error('Failed to create log entry'),
          {
            user_id: recipientUserId,
            notification_type: type,
            entity_type: entityType,
            entity_id: entityId,
          }
        );
        return {
          success: results.inApp === true,
          error: 'Failed to create email log entry',
        };
      }

      // 5.3. Check rate limits
      const userRateLimit = await checkRateLimit(recipientUserId);
      if (!userRateLimit.allowed) {
        await supabase
          .from('notification_log')
          .update({
            status: 'failed',
            error_message: `User rate limited. Retry after ${userRateLimit.retryAfter}s`,
          })
          .eq('id', logEntry.id);
        return {
          success: results.inApp === true,
          error: `User rate limited. Retry after ${userRateLimit.retryAfter}s`,
          logId: logEntry.id,
        };
      }
      const systemRateLimit = await checkSystemRateLimit();
      if (!systemRateLimit.allowed) {
        await supabase
          .from('notification_log')
          .update({ status: 'failed', error_message: 'System rate limit reached' })
          .eq('id', logEntry.id);
        return {
          success: results.inApp === true,
          error: 'System rate limit reached',
          logId: logEntry.id,
        };
      }

      // 5.4. Check SMTP configuration
      if (!isSmtpConfigured()) {
        await supabase
          .from('notification_log')
          .update({
            status: 'failed',
            error_message: 'SMTP not configured: missing GMAIL_USER or GMAIL_APP_PASSWORD',
          })
          .eq('id', logEntry.id);
        return {
          success: results.inApp === true,
          error: 'SMTP not configured: missing GMAIL_USER or GMAIL_APP_PASSWORD',
          logId: logEntry.id,
        };
      }

      // 5.4b. Deliverable-email chokepoint (ADR-0002 §3, spec 06 §6.2).
      // Shadow profiles with no invite_email (or placeholder addresses) are
      // skipped — never bounced to shadow_*@placeholder.com.
      const deliverableEmail = getDeliverableEmail({
        is_shadow: recipient.is_shadow ?? false,
        email: recipient.email,
        invite_email: recipient.invite_email ?? null,
      });

      if (!deliverableEmail) {
        await supabase
          .from('notification_log')
          .update({
            status: 'skipped',
            error_message: 'skipped_shadow: no deliverable email (un-invited shadow)',
          })
          .eq('id', logEntry.id);

        logNotificationSkipped(recipientUserId, type, 'skipped_shadow: no deliverable email', {
          notification_id: logEntry.id,
          entity_type: entityType,
          entity_id: entityId,
        });

        return {
          success: results.inApp === true,
          skipped: true,
          logId: logEntry.id,
        };
      }

      // 5.5. Send email
      try {
        await transporter.sendMail({
          from: `"Guitar CRM" <${process.env.GMAIL_USER}>`,
          to: deliverableEmail,
          subject,
          html: htmlContent,
        });

        // Update log entry to sent
        await supabase
          .from('notification_log')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);

        logNotificationSent(logEntry.id, recipientUserId, type, recipient.email, {
          entity_type: entityType,
          entity_id: entityId,
          subject,
        });

        results.email = true;
      } catch (emailError: unknown) {
        // Update log entry to failed
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';

        await supabase
          .from('notification_log')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', logEntry.id);

        logNotificationFailed(
          logEntry.id,
          emailError instanceof Error ? emailError : new Error(errorMessage),
          recipientUserId,
          type,
          {
            entity_type: entityType,
            entity_id: entityId,
            recipient_email: recipient.email,
          }
        );

        results.email = false;
      }
    }

    // 6. Return combined result
    const overallSuccess = results.email === true || results.inApp === true;
    return {
      success: overallSuccess,
      logId: undefined,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('sendNotification error', error instanceof Error ? error : new Error(errorMessage), {
      user_id: recipientUserId,
      notification_type: type,
      entity_type: entityType,
      entity_id: entityId,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Queue a notification for future delivery
 */
export async function queueNotification(
  params: QueueNotificationParams
): Promise<NotificationResult> {
  const {
    type,
    recipientUserId,
    templateData,
    entityType,
    entityId,
    priority = 5,
    scheduledFor = new Date(),
  } = params;

  try {
    const supabase = createAdminClient();

    const { data: queueEntry, error: queueError } = await supabase
      .from('notification_queue')
      .insert({
        notification_type: type,
        recipient_user_id: recipientUserId,
        template_data: templateData as unknown as Json,
        scheduled_for: scheduledFor.toISOString(),
        priority,
        entity_type: entityType,
        entity_id: entityId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (queueError || !queueEntry) {
      logError(
        'Failed to queue notification',
        queueError instanceof Error ? queueError : new Error('Failed to queue notification'),
        {
          user_id: recipientUserId,
          notification_type: type,
          entity_type: entityType,
          entity_id: entityId,
        }
      );
      return {
        success: false,
        error: 'Failed to queue notification',
      };
    }

    logNotificationQueued(
      queueEntry.id,
      recipientUserId,
      type,
      scheduledFor.toISOString(),
      priority,
      {
        entity_type: entityType,
        entity_id: entityId,
      }
    );

    return {
      success: true,
      logId: queueEntry.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('queueNotification error', error instanceof Error ? error : new Error(errorMessage), {
      user_id: recipientUserId,
      notification_type: type,
      entity_type: entityType,
      entity_id: entityId,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cancel pending queued notifications for a specific entity
 */
export async function cancelPendingQueueEntries(
  entityType: string,
  entityId: string,
  notificationType?: NotificationType
): Promise<void> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('notification_queue')
      .update({ status: 'cancelled' })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'pending');

    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    const { error } = await query;

    if (error) {
      logError(
        'Failed to cancel pending queue entries',
        error instanceof Error ? error : new Error('Failed to cancel queue entries'),
        { entity_type: entityType, entity_id: entityId, notification_type: notificationType }
      );
    }
  } catch (error) {
    logError(
      'cancelPendingQueueEntries error',
      error instanceof Error ? error : new Error('Unknown error'),
      { entity_type: entityType, entity_id: entityId, notification_type: notificationType }
    );
  }
}

/**
 * Check if user has enabled a specific notification type
 */
export async function checkUserPreference(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .single();

    if (error || !data) {
      // If no preference found, default to enabled
      return true;
    }

    return data.enabled as boolean;
  } catch (error) {
    logError(
      'checkUserPreference error',
      error instanceof Error ? error : new Error('Unknown error'),
      { user_id: userId, notification_type: notificationType }
    );
    // Default to enabled on error
    return true;
  }
}

/**
 * Notification Queue Processor
 *
 * Handles processing of queued and failed notifications:
 * - Processing pending notifications from the queue
 * - Retrying failed notifications with exponential backoff
 * - Dead letter queue management
 */

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import transporter, { isSmtpConfigured } from '@/lib/email/smtp-client';
import { getDeliverableEmail } from '@/lib/email/recipient';
import { checkRateLimit, checkSystemRateLimit } from '@/lib/email/rate-limiter';
import {
  getRetryableNotifications,
  updateNotificationRetry,
  processDeadLetterQueue,
  shouldMoveToDeadLetter,
  moveToDeadLetter,
} from '@/lib/email/retry-handler';
import { logBatchProcessed, logError, logInfo } from '@/lib/logging/notification-logger';
import type { NotificationType } from '@/types/notifications';
import { sendNotification } from './notification-service';
import { logger } from '@/lib/logger';

/**
 * Check if student emails are enabled via environment variable.
 */
function isStudentEmailEnabled(): boolean {
  return process.env.STUDENT_EMAILS_ENABLED === 'true';
}

interface QueuedNotification {
  id: string;
  notification_type: string;
  recipient_user_id: string;
  template_data: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  priority: number;
}

async function getNotificationHtml(
  type: NotificationType,
  templateData: Record<string, unknown>,
  recipient: { full_name: string | null; email: string }
): Promise<string> {
  const { renderNotificationHtml } = await import('@/lib/email/render-notification');
  return renderNotificationHtml(type, templateData, recipient);
}

// ============================================================================
// QUEUE PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process pending notifications from the queue
 */
export async function processQueuedNotifications(
  batchSize: number = 100
): Promise<{ processed: number; failed: number }> {
  try {
    const supabase = createAdminClient();

    // Get pending notifications
    const { data: rpcData, error: fetchError } = await supabase.rpc(
      'get_pending_notifications' as never,
      { batch_size: batchSize } as never
    );
    const queuedNotifications = rpcData as QueuedNotification[] | null;

    if (fetchError) {
      logError(
        'Failed to fetch queued notifications',
        fetchError instanceof Error ? fetchError : new Error('Failed to fetch queued notifications')
      );
      return { processed: 0, failed: 0 };
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      logInfo('No queued notifications to process');
      return { processed: 0, failed: 0 };
    }

    logInfo(`Processing ${queuedNotifications.length} queued notifications`);

    let processed = 0;
    let failed = 0;

    // Process each notification
    for (const notification of queuedNotifications) {
      try {
        // Dedup check: skip if already sent manually for this entity
        if (notification.entity_type && notification.entity_id) {
          const { data: existing } = await supabase
            .from('notification_log')
            .select('id')
            .eq('notification_type', notification.notification_type)
            .eq('entity_type', notification.entity_type)
            .eq('entity_id', notification.entity_id)
            .eq('status', 'sent')
            .limit(1);

          if (existing && existing.length > 0) {
            await supabase
              .from('notification_queue')
              .update({
                status: 'cancelled',
                processed_at: new Date().toISOString(),
              })
              .eq('id', notification.id);

            logInfo(
              `Skipped duplicate notification ${notification.id} — already sent for ${notification.entity_type}:${notification.entity_id}`
            );
            processed++;
            continue;
          }
        }

        const result = await sendNotification({
          type: notification.notification_type as NotificationType,
          recipientUserId: notification.recipient_user_id,
          templateData: notification.template_data as Record<string, unknown>,
          entityType: notification.entity_type || undefined,
          entityId: notification.entity_id || undefined,
          priority: notification.priority,
        });

        // Update queue status
        await supabase
          .from('notification_queue')
          .update({
            status: result.success ? 'sent' : 'failed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        logError(
          `Failed to process notification ${notification.id}`,
          error instanceof Error ? error : new Error('Unknown error'),
          {
            notification_id: notification.id,
            user_id: notification.recipient_user_id,
            notification_type: notification.notification_type as NotificationType,
          }
        );
        failed++;

        // Mark as failed in queue
        await supabase
          .from('notification_queue')
          .update({
            status: 'failed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
      }
    }

    logBatchProcessed('queue', processed, failed);

    return { processed, failed };
  } catch (error) {
    logError(
      'processQueuedNotifications error',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return { processed: 0, failed: 0 };
  }
}

/**
 * Retry failed notifications with exponential backoff
 */
export async function retryFailedNotifications(): Promise<{
  retried: number;
  failed: number;
  deadLettered: number;
}> {
  try {
    const supabase = createAdminClient();

    // Get notifications ready for retry (using retry handler)
    const failedNotifications = await getRetryableNotifications(50);

    if (!failedNotifications || failedNotifications.length === 0) {
      // Process dead letter queue if no retries
      const deadLettered = await processDeadLetterQueue();
      return { retried: 0, failed: 0, deadLettered };
    }

    let retried = 0;
    let failed = 0;

    for (const notification of failedNotifications) {
      try {
        // Check if should move to dead letter before retry
        if (shouldMoveToDeadLetter(notification)) {
          await moveToDeadLetter(notification.id, 'Maximum retry attempts exceeded');
          continue;
        }

        // Get recipient info (include is_student for student email kill switch,
        // is_shadow + invite_email for the deliverable-email chokepoint)
        const { data: recipient } = await supabase
          .from('profiles')
          .select('id, email, full_name, is_student, is_shadow, invite_email')
          .eq('id', notification.recipient_user_id)
          .single();

        if (!recipient) {
          continue;
        }

        // Student email kill switch: skip retry for students when emails disabled
        if (recipient.is_student && !isStudentEmailEnabled()) {
          logInfo(
            `Skipping retry for student notification ${notification.id} — student emails disabled`
          );
          await updateNotificationRetry(
            notification.id,
            'failed',
            notification.retry_count + 1,
            'Student emails disabled'
          );
          failed++;
          continue;
        }

        // Deliverable-email chokepoint: un-invited shadows are skipped (not
        // retried), never bounced to a placeholder address (spec 06 §6.2).
        const deliverableEmail = getDeliverableEmail({
          is_shadow: recipient.is_shadow ?? false,
          email: recipient.email,
          invite_email: recipient.invite_email ?? null,
        });
        if (!deliverableEmail) {
          logInfo(`Skipping shadow notification ${notification.id} — no deliverable email`);
          await supabase
            .from('notification_log')
            .update({ status: 'skipped', error_message: 'skipped_shadow' })
            .eq('id', notification.id);
          continue;
        }

        // Generate email content
        const htmlContent = await getNotificationHtml(
          notification.notification_type as NotificationType,
          notification.template_data as Record<string, unknown>,
          recipient
        );

        // Check rate limits before retry
        const userRL = await checkRateLimit(notification.recipient_user_id);
        if (!userRL.allowed) {
          continue; // Skip this notification, try next
        }
        const systemRL = await checkSystemRateLimit();
        if (!systemRL.allowed) {
          break; // Stop all retries this cycle
        }

        // Check SMTP configuration
        if (!isSmtpConfigured()) {
          await updateNotificationRetry(
            notification.id,
            'failed',
            notification.retry_count + 1,
            'SMTP not configured'
          );
          failed++;
          continue;
        }

        // Attempt to send
        await transporter.sendMail({
          from: `"Guitar CRM" <${process.env.GMAIL_USER}>`,
          to: deliverableEmail,
          subject: notification.subject,
          html: htmlContent,
        });

        // Update to sent (using retry handler)
        await updateNotificationRetry(notification.id, 'sent', notification.retry_count + 1);

        retried++;
      } catch (error) {
        logger.error(`Failed to retry notification ${notification.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Retry failed';

        // Increment retry count and update error (using retry handler)
        await updateNotificationRetry(
          notification.id,
          'failed',
          notification.retry_count + 1,
          errorMessage
        );

        failed++;
      }
    }

    logBatchProcessed('retry', retried, failed);

    // Process dead letter queue after retries
    const deadLettered = await processDeadLetterQueue();
    logBatchProcessed('dead_letter', deadLettered, 0);

    return { retried, failed, deadLettered };
  } catch (error) {
    logError(
      'retryFailedNotifications error',
      error instanceof Error ? error : new Error('Unknown error')
    );
    return { retried: 0, failed: 0, deadLettered: 0 };
  }
}

/**
 * Notification Service Helpers
 *
 * Helper functions for delivery channel logic, subject/HTML generation.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { NotificationType } from '@/types/notifications';

export type DeliveryChannel = 'email' | 'in_app' | 'both';

/**
 * Get delivery channel for a notification type.
 * Checks the user's stored preference; falls back to the default when no row
 * exists yet (a genuine query error is logged, not silently absorbed —
 * NOT-1: delivery guarantees ride on email at launch, so a swallowed error
 * here used to be indistinguishable from an intentional in-app-only choice).
 */
export async function getDeliveryChannel(
  userId: string,
  type: NotificationType
): Promise<DeliveryChannel> {
  const supabase = createAdminClient();

  // `delivery_channel` postdates the generated types (migration 038); double-cast
  // mirrors the same pattern used for system_logs until types catch up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from as any)('notification_preferences')
    .select('delivery_channel')
    .eq('user_id', userId)
    .eq('notification_type', type)
    .maybeSingle()) as {
    data: { delivery_channel: DeliveryChannel } | null;
    error: { message: string } | null;
  };

  if (error) {
    logger.error('[notification-helpers] Failed to load delivery_channel preference', {
      error: error.message,
      userId,
      type,
    });
    return getDefaultDeliveryChannel(type);
  }

  return (data?.delivery_channel as DeliveryChannel | undefined) ?? getDefaultDeliveryChannel(type);
}

/**
 * Default delivery channel when no preference row exists.
 *
 * Decided in grill 2026-07-18 (NOT-1): email-only for ALL notification types
 * at launch — delivery guarantees ride on the proven Gmail SMTP chain, and
 * the in-app bell still surfaces items on next login regardless. Revisit
 * `both` for reminder types after observing real student login frequency.
 */
export function getDefaultDeliveryChannel(_type: NotificationType): DeliveryChannel {
  return 'email';
}

/**
 * Get notification subject based on type and template data
 */
export function getNotificationSubject(
  type: NotificationType,
  templateData: Record<string, unknown>
): string {
  const subjectMap: Record<NotificationType, (data: Record<string, unknown>) => string> = {
    lesson_reminder_24h: () => 'Upcoming Lesson Reminder',
    lesson_recap: (data) => `Lesson Recap: ${data.lessonTitle || 'Your Recent Lesson'}`,
    lesson_cancelled: () => 'Lesson Cancelled',
    lesson_rescheduled: () => 'Lesson Rescheduled',
    assignment_created: (data) => `New Assignment: ${data.assignmentTitle}`,
    assignment_due_reminder: (data) => `Assignment Due Soon: ${data.assignmentTitle}`,
    assignment_overdue_alert: (data) => `Overdue Assignment: ${data.assignmentTitle}`,
    assignment_completed: (data) => `Assignment Completed: ${data.assignmentTitle}`,
    song_mastery_achievement: (data) => `Congratulations! You Mastered "${data.songTitle}"`,
    milestone_reached: (data) => `Milestone Reached: ${data.milestone}`,
    student_welcome: () => 'Welcome to Guitar CRM!',
    trial_ending_reminder: () => 'Your Trial Period is Ending Soon',
    teacher_daily_summary: (data) => `Daily Summary - ${data.date}`,
    weekly_progress_digest: () => 'Your Weekly Progress Report',
    calendar_conflict_alert: () => 'Calendar Conflict Detected',
    webhook_expiration_notice: () => 'Calendar Integration Expiring',
    admin_error_alert: (data) => `System Error: ${data.errorType}`,
  };

  const subjectGenerator = subjectMap[type];
  return subjectGenerator ? subjectGenerator(templateData) : 'Notification from Guitar CRM';
}

/**
 * Get notification HTML content using dedicated email templates.
 */
export async function getNotificationHtml(
  type: NotificationType,
  templateData: Record<string, unknown>,
  recipient: { full_name: string | null; email: string }
): Promise<string> {
  const { renderNotificationHtml } = await import('@/lib/email/render-notification');
  return renderNotificationHtml(type, templateData, recipient);
}

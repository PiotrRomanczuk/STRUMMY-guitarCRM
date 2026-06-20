/**
 * Notification System Types
 *
 * Type definitions for the email notification system including
 * notification types, statuses, preferences, logs, and queue items.
 */

// ============================================================================
// ENUMS (matching database enums)
// ============================================================================

export type NotificationType =
  // Lesson notifications
  | 'lesson_reminder_24h'
  | 'lesson_recap'
  | 'lesson_cancelled'
  | 'lesson_rescheduled'
  // Assignment notifications
  | 'assignment_created'
  | 'assignment_due_reminder'
  | 'assignment_overdue_alert'
  | 'assignment_completed'
  // Achievement notifications
  | 'song_mastery_achievement'
  | 'milestone_reached'
  // Student lifecycle
  | 'student_welcome'
  | 'trial_ending_reminder'
  // Digest notifications
  | 'teacher_daily_summary'
  | 'weekly_progress_digest'
  // System notifications
  | 'calendar_conflict_alert'
  | 'webhook_expiration_notice'
  | 'admin_error_alert';

export type NotificationStatus =
  | 'pending' // Queued, not yet sent
  | 'sent' // Successfully delivered
  | 'failed' // Delivery failed, will retry
  | 'bounced' // Email bounced, user email invalid
  | 'skipped' // Skipped due to user preference
  | 'cancelled'; // Cancelled before sending

// ============================================================================
// CATEGORY GROUPINGS
// ============================================================================

export const NOTIFICATION_CATEGORIES = {
  lessons: [
    'lesson_reminder_24h',
    'lesson_recap',
    'lesson_cancelled',
    'lesson_rescheduled',
  ] as const,
  assignments: [
    'assignment_created',
    'assignment_due_reminder',
    'assignment_overdue_alert',
    'assignment_completed',
  ] as const,
  achievements: ['song_mastery_achievement', 'milestone_reached'] as const,
  lifecycle: ['student_welcome', 'trial_ending_reminder'] as const,
  digests: ['teacher_daily_summary', 'weekly_progress_digest'] as const,
  system: ['calendar_conflict_alert', 'webhook_expiration_notice', 'admin_error_alert'] as const,
} as const;

export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES;

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

export type NotificationDeliveryChannel = 'email' | 'in_app' | 'both';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  notification_type: NotificationType;
  recipient_user_id: string;
  recipient_email: string;
  status: NotificationStatus;
  subject: string;
  template_data: Record<string, unknown> | null;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationQueue {
  id: string;
  notification_type: NotificationType;
  recipient_user_id: string;
  template_data: Record<string, unknown>;
  scheduled_for: string;
  processed_at: string | null;
  status: NotificationStatus;
  priority: number;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================================================

export interface SendNotificationParams {
  type: NotificationType;
  recipientUserId: string;
  templateData: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  priority?: number;
}

export interface QueueNotificationParams extends SendNotificationParams {
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  logId?: string;
  error?: string;
  skipped?: boolean;
}

// ============================================================================
// TEMPLATE DATA TYPES
// ============================================================================

export interface LessonReminderData {
  studentName: string;
  teacherName: string;
  lessonDate: string;
  lessonTime: string;
  lessonTitle?: string;
  lessonNotes?: string;
}

export interface LessonRecapData {
  studentName: string;
  teacherName: string;
  lessonDate: string;
  lessonTitle: string;
  songsWorkedOn: Array<{
    title: string;
    artist: string;
    status: string;
  }>;
  notes: string;
  nextLessonDate?: string;
}

export interface LessonCancellationData {
  studentName: string;
  teacherName: string;
  lessonDate: string;
  lessonTime: string;
  reason?: string;
  rescheduleLink?: string;
}

export interface LessonRescheduledData {
  studentName: string;
  teacherName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
}

export interface AssignmentDueReminderData {
  studentName: string;
  assignmentTitle: string;
  dueDate: string;
  assignmentDescription?: string;
  assignmentLink: string;
}

export interface AssignmentOverdueAlertData {
  studentName: string;
  assignmentTitle: string;
  dueDate: string;
  daysOverdue: number;
  assignmentLink: string;
}

export interface SongMasteryAchievementData {
  studentName: string;
  songTitle: string;
  songArtist: string;
  masteredDate: string;
  totalSongsMastered: number;
}

export interface StudentWelcomeData {
  studentName: string;
  teacherName: string;
  loginLink: string;
  firstLessonDate?: string;
}

export interface TeacherDailySummaryData {
  teacherName: string;
  date: string;
  upcomingLessons: Array<{
    studentName: string;
    time: string;
    title: string;
  }>;
  completedLessons: number;
  pendingAssignments: number;
  recentAchievements: Array<{
    studentName: string;
    achievement: string;
  }>;
}

export interface WeeklyProgressDigestData {
  recipientName: string;
  weekStart: string;
  weekEnd: string;
  lessonsCompleted: number;
  songsMastered: number;
  practiceTime: number;
  highlights: string[];
  upcomingLessons: Array<{
    date: string;
    title: string;
  }>;
}

// Union type of all template data types
export type NotificationTemplateData =
  | LessonReminderData
  | LessonRecapData
  | LessonCancellationData
  | LessonRescheduledData
  | AssignmentDueReminderData
  | AssignmentOverdueAlertData
  | SongMasteryAchievementData
  | StudentWelcomeData
  | TeacherDailySummaryData
  | WeeklyProgressDigestData;

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface NotificationAnalytics {
  totalSent: number;
  successRate: number;
  failureRate: number;
  bounceRate: number;
  optOutRate: number;
  sentByType: Record<NotificationType, number>;
  sentByDay: Array<{
    date: string;
    count: number;
  }>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface NotificationCategoryInfo {
  name: string;
  description: string;
  types: readonly NotificationType[];
}

export const NOTIFICATION_CATEGORY_INFO: Record<NotificationCategory, NotificationCategoryInfo> = {
  lessons: {
    name: 'Lessons',
    description: 'Notifications about scheduled, completed, and cancelled lessons',
    types: NOTIFICATION_CATEGORIES.lessons,
  },
  assignments: {
    name: 'Assignments',
    description: 'Updates about homework and practice assignments',
    types: NOTIFICATION_CATEGORIES.assignments,
  },
  achievements: {
    name: 'Achievements',
    description: 'Celebrate milestones and song mastery',
    types: NOTIFICATION_CATEGORIES.achievements,
  },
  lifecycle: {
    name: 'Account',
    description: 'Welcome messages and account updates',
    types: NOTIFICATION_CATEGORIES.lifecycle,
  },
  digests: {
    name: 'Digests',
    description: 'Daily and weekly summary emails',
    types: NOTIFICATION_CATEGORIES.digests,
  },
  system: {
    name: 'System',
    description: 'Important system alerts and warnings',
    types: NOTIFICATION_CATEGORIES.system,
  },
};

// ============================================================================
// NOTIFICATION TYPE METADATA
// ============================================================================

export interface NotificationTypeInfo {
  label: string;
  description: string;
  defaultEnabled: boolean;
  category: NotificationCategory;
}

export const NOTIFICATION_TYPE_INFO: Record<NotificationType, NotificationTypeInfo> = {
  lesson_reminder_24h: {
    label: '24h Lesson Reminders',
    description: 'Get reminded 24 hours before your scheduled lesson',
    defaultEnabled: true,
    category: 'lessons',
  },
  lesson_recap: {
    label: 'Lesson Recaps',
    description: 'Receive a summary after each completed lesson',
    defaultEnabled: true,
    category: 'lessons',
  },
  lesson_cancelled: {
    label: 'Lesson Cancellations',
    description: 'Get notified when a lesson is cancelled',
    defaultEnabled: true,
    category: 'lessons',
  },
  lesson_rescheduled: {
    label: 'Lesson Rescheduling',
    description: 'Get notified when a lesson time changes',
    defaultEnabled: true,
    category: 'lessons',
  },
  assignment_created: {
    label: 'New Assignments',
    description: 'Get notified when you receive a new assignment',
    defaultEnabled: true,
    category: 'assignments',
  },
  assignment_due_reminder: {
    label: 'Assignment Due Reminders',
    description: 'Reminder 2 days before assignment is due',
    defaultEnabled: true,
    category: 'assignments',
  },
  assignment_overdue_alert: {
    label: 'Overdue Assignment Alerts',
    description: 'Get notified when an assignment becomes overdue',
    defaultEnabled: true,
    category: 'assignments',
  },
  assignment_completed: {
    label: 'Assignment Completions',
    description: 'Confirmation when you complete an assignment',
    defaultEnabled: true,
    category: 'assignments',
  },
  song_mastery_achievement: {
    label: 'Song Mastery',
    description: 'Celebrate when you master a new song',
    defaultEnabled: true,
    category: 'achievements',
  },
  milestone_reached: {
    label: 'Milestones',
    description: 'Celebrate learning milestones and achievements',
    defaultEnabled: true,
    category: 'achievements',
  },
  student_welcome: {
    label: 'Welcome Email',
    description: 'Welcome message for new students',
    defaultEnabled: true,
    category: 'lifecycle',
  },
  trial_ending_reminder: {
    label: 'Trial Ending',
    description: 'Reminder when trial period is ending',
    defaultEnabled: true,
    category: 'lifecycle',
  },
  teacher_daily_summary: {
    label: 'Daily Summary',
    description: 'Daily summary of lessons and student activity',
    defaultEnabled: false,
    category: 'digests',
  },
  weekly_progress_digest: {
    label: 'Weekly Progress',
    description: 'Weekly summary of your learning progress',
    defaultEnabled: false,
    category: 'digests',
  },
  calendar_conflict_alert: {
    label: 'Calendar Conflicts',
    description: 'Alert when there are scheduling conflicts',
    defaultEnabled: true,
    category: 'system',
  },
  webhook_expiration_notice: {
    label: 'Integration Expiring',
    description: 'Alert when calendar integration needs renewal',
    defaultEnabled: true,
    category: 'system',
  },
  admin_error_alert: {
    label: 'System Errors',
    description: 'Critical system error notifications (admin only)',
    defaultEnabled: true,
    category: 'system',
  },
};

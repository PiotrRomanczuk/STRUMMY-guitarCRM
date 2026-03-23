/**
 * Centralized status colors for the application
 * Follows CLAUDE.md Table Standards (Section 11)
 *
 * All status displays should use these colors for consistency.
 * Format: Tailwind classes for text, background, and border
 */

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'special';

export interface StatusColorClasses {
  text: string;
  bg: string;
  border: string;
  /** Combined classes for Badge component */
  badge: string;
}

export const STATUS_VARIANTS: Record<StatusVariant, StatusColorClasses> = {
  success: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    badge: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20',
  },
  warning: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    badge: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  error: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    badge: 'text-destructive bg-destructive/10 border-destructive/20',
  },
  info: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    badge: 'text-primary bg-primary/10 border-primary/20',
  },
  muted: {
    text: 'text-muted-foreground dark:text-zinc-400',
    bg: 'bg-muted',
    border: 'border-border',
    badge: 'text-muted-foreground dark:text-zinc-400 bg-muted border-border',
  },
  special: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    badge: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
};

/**
 * Lesson status color mapping
 */
export const LESSON_STATUS_COLORS: Record<string, StatusVariant> = {
  COMPLETED: 'success',
  CANCELLED: 'error',
  IN_PROGRESS: 'info',
  SCHEDULED: 'warning',
  RESCHEDULED: 'special',
};

/**
 * Song progress status color mapping
 */
export const SONG_STATUS_COLORS: Record<string, StatusVariant> = {
  to_learn: 'muted',
  started: 'warning',
  remembered: 'info',
  mastered: 'success',
  // Legacy statuses (for backward compatibility)
  learning: 'warning',
  practicing: 'info',
  improving: 'info',
};

/**
 * Song difficulty level color mapping
 */
export const SONG_LEVEL_COLORS: Record<string, StatusVariant> = {
  Beginner: 'info',
  Intermediate: 'warning',
  Advanced: 'error',
};

/**
 * Assignment status color mapping
 */
export const ASSIGNMENT_STATUS_COLORS: Record<string, StatusVariant> = {
  not_started: 'muted',
  pending: 'muted',
  in_progress: 'info',
  completed: 'success',
  overdue: 'error',
  submitted: 'info',
};

/**
 * User status color mapping
 */
export const USER_STATUS_COLORS: Record<string, StatusVariant> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
  registered: 'info',
  shadow: 'muted',
};

/**
 * History change type color mapping
 */
export const CHANGE_TYPE_COLORS: Record<string, StatusVariant> = {
  created: 'success',
  updated: 'info',
  deleted: 'error',
  status_change: 'warning',
  progress_update: 'info',
  // Song status transitions
  to_learn: 'muted',
  started: 'warning',
  remembered: 'info',
  mastered: 'success',
};

/**
 * Get status color classes for a given domain and status
 */
export function getStatusColors(
  domain: 'lesson' | 'song' | 'songLevel' | 'assignment' | 'user' | 'changeType',
  status: string
): StatusColorClasses {
  const colorMaps: Record<string, Record<string, StatusVariant>> = {
    lesson: LESSON_STATUS_COLORS,
    song: SONG_STATUS_COLORS,
    songLevel: SONG_LEVEL_COLORS,
    assignment: ASSIGNMENT_STATUS_COLORS,
    user: USER_STATUS_COLORS,
    changeType: CHANGE_TYPE_COLORS,
  };

  const variant = colorMaps[domain]?.[status] ?? 'muted';
  return STATUS_VARIANTS[variant];
}

/**
 * Get badge classes for a status
 */
export function getStatusBadgeClasses(
  domain: 'lesson' | 'song' | 'songLevel' | 'assignment' | 'user' | 'changeType',
  status: string
): string {
  return getStatusColors(domain, status).badge;
}

/**
 * Get legacy-compatible color string for difficulty levels
 * @deprecated Use getStatusBadgeClasses('songLevel', level) instead
 */
export function getDifficultyColorClass(level: string): string {
  const legacyMap: Record<string, string> = {
    beginner: 'text-primary',
    Beginner: 'text-primary',
    intermediate: 'text-yellow-600 dark:text-yellow-500',
    Intermediate: 'text-yellow-600 dark:text-yellow-500',
    advanced: 'text-destructive',
    Advanced: 'text-destructive',
  };
  return legacyMap[level] || 'text-muted-foreground';
}

/**
 * Get legacy-compatible color string for song status
 * @deprecated Use getStatusBadgeClasses('song', status) instead
 */
export function getSongStatusColorClass(status: string): string {
  const colors = getStatusColors('song', status);
  return colors.badge;
}

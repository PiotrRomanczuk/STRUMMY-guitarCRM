/**
 * Format a date string for display in lesson cards.
 */
export function formatLessonDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not scheduled';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a time string (HH:mm:ss or ISO) for display.
 */
export function formatLessonTime(timeString: string | null | undefined): string {
  if (!timeString) return '';
  try {
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

/**
 * Map lesson status to v2 design system status badge styles.
 */
export function getLessonStatusStyle(status: string | null | undefined): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/30';
    case 'CANCELLED':
      return 'bg-destructive/10 text-destructive dark:text-red-400 border-destructive/20 dark:border-destructive/30';
    case 'IN_PROGRESS':
      return 'bg-primary/10 text-primary dark:text-primary border-primary/20 dark:border-primary/30';
    case 'SCHEDULED':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Get a human-friendly status label.
 */
export function getLessonStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'SCHEDULED':
      return 'Scheduled';
    default:
      return 'Scheduled';
  }
}

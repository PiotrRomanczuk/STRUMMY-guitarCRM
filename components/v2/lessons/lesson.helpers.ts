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
 * Map lesson status to M3 Stitch design system status badge styles.
 * No visible borders -- uses bg color shifts only.
 */
export function getLessonStatusStyle(status: string | null | undefined): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-400 border-transparent';
    case 'CANCELLED':
      return 'bg-destructive/10 text-red-400 border-transparent';
    case 'IN_PROGRESS':
      return 'bg-primary/15 text-primary border-transparent';
    case 'SCHEDULED':
      return 'bg-primary/15 text-primary border-transparent';
    default:
      return 'bg-muted text-muted-foreground border-transparent';
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

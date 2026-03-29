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
      return 'bg-muted text-muted-foreground dark:text-zinc-400 border-transparent';
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

export function getSongStatusStyle(status: string | null | undefined): string {
  switch (status) {
    case 'mastered':
      return 'bg-emerald-500/10 text-emerald-400 border-transparent';
    case 'remembered':
    case 'with_author':
      return 'bg-yellow-500/10 text-yellow-400 border-transparent';
    case 'started':
      return 'bg-blue-500/10 text-blue-400 border-transparent';
    case 'to_learn':
    default:
      return 'bg-muted text-muted-foreground border-transparent';
  }
}

export function getSongStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'mastered':
      return 'Mastered';
    case 'with_author':
      return 'With Author';
    case 'remembered':
      return 'Remembered';
    case 'started':
      return 'Started';
    case 'to_learn':
    default:
      return 'To Learn';
  }
}

export function getAssignmentStatusStyle(status: string | null | undefined): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border-transparent';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-400 border-transparent';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-transparent';
    case 'overdue':
      return 'bg-destructive/10 text-red-400 border-transparent';
    case 'cancelled':
      return 'bg-muted text-muted-foreground border-transparent';
    case 'not_started':
    default:
      return 'bg-muted text-muted-foreground border-transparent';
  }
}

export function getAssignmentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    case 'cancelled':
      return 'Cancelled';
    case 'not_started':
    default:
      return 'Not Started';
  }
}

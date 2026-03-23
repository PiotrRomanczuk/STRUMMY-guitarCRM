export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not scheduled';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '-';
  // Handle HH:MM:SS format
  try {
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

export function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'CANCELLED':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'IN_PROGRESS':
      return 'text-primary bg-primary/10 border-primary/20';
    case 'SCHEDULED':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'RESCHEDULED':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    default:
      return 'text-muted-foreground dark:text-zinc-400 bg-muted border-border';
  }
}

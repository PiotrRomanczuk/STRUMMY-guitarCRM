export const ASSIGNMENT_STATUS_STYLES = {
  not_started: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-primary/15 text-primary border-primary/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-destructive/10 text-red-400 border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
} as const;

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

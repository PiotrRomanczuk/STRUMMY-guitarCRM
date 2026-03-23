import { ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gray'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'active'
  | 'inactive'
  | 'registered'
  | 'shadow';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  testId?: string;
}

/**
 * Universal status badge component
 * Used for displaying status across all entities
 *
 * @example
 * <StatusBadge variant="success">Completed</StatusBadge>
 * <StatusBadge variant="warning">Pending</StatusBadge>
 * <StatusBadge variant="danger">Overdue</StatusBadge>
 */
export default function StatusBadge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  testId,
}: StatusBadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/15 text-success dark:bg-success/20',
    warning: 'bg-warning/15 text-warning dark:bg-warning/20',
    danger: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
    info: 'bg-primary/15 text-primary dark:bg-primary/20',
    gray: 'bg-muted text-muted-foreground',
    blue: 'bg-primary/15 text-primary dark:bg-primary/20',
    green: 'bg-success/15 text-success dark:bg-success/20',
    yellow: 'bg-warning/15 text-warning dark:bg-warning/20',
    red: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
    purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20',
    active: 'bg-success/15 text-success dark:bg-success/20',
    inactive: 'bg-muted text-muted-foreground',
    registered: 'bg-primary/15 text-primary dark:bg-primary/20',
    shadow: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 sm:px-3 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-block rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

/**
 * Helper function to get badge variant based on status string
 */
export function getStatusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();

  // Status to variant mapping
  const statusMap: Record<string, BadgeVariant> = {
    // Lesson statuses
    completed: 'success',
    scheduled: 'info',
    cancelled: 'danger',
    // Song learning statuses
    mastered: 'success',
    with_author: 'purple',
    remembered: 'yellow',
    started: 'blue',
    to_learn: 'gray',
    // Assignment statuses
    pending: 'warning',
    overdue: 'danger',
    in_progress: 'info',
    // Difficulty levels
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red',
    // User statuses
    active: 'active',
    inactive: 'inactive',
    registered: 'registered',
    shadow: 'shadow',
  };

  return statusMap[statusLower] || 'default';
}

/** Display label overrides for statuses that don't auto-format well. */
const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  with_author: 'Play Along',
};

/**
 * Helper function to format status text
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';

  if (STATUS_LABEL_OVERRIDES[status]) return STATUS_LABEL_OVERRIDES[status];

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

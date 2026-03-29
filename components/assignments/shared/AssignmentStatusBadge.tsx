'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Play, Check, AlertTriangle, X } from 'lucide-react';

type AssignmentStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  AssignmentStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  not_started: {
    label: 'Not Started',
    className: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
    icon: Clock,
  },
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning/20 text-warning border-warning/20',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Check,
  },
  overdue: {
    label: 'Late',
    className: 'bg-destructive/20 text-destructive border-destructive/20',
    icon: AlertTriangle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
    icon: X,
  },
};

/**
 * Status badge for assignments
 * Shows status with appropriate color and optional icon
 */
function AssignmentStatusBadge({ status, className, showIcon = false }: AssignmentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
        'text-[10px] font-bold uppercase tracking-wider',
        'border',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

export { AssignmentStatusBadge, type AssignmentStatus };

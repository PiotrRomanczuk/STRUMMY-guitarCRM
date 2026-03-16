'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const STATUS_STYLES = {
  not_started: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
} as const;

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function AssignmentCardMobile({ assignment }: { assignment: Assignment }) {
  const isLate = assignment.status === 'overdue';
  const isCompleted = assignment.status === 'completed';

  const dueDateLabel = useMemo(() => {
    if (!assignment.due_date) return 'No due date';
    const date = new Date(assignment.due_date);
    if (isCompleted) return `Done ${format(date, 'MMM d')}`;
    if (isLate || isPast(date)) return `Overdue ${format(date, 'MMM d')}`;
    if (isToday(date)) return 'Due Today';
    if (isTomorrow(date)) return 'Due Tomorrow';
    return `Due ${format(date, 'MMM d')}`;
  }, [assignment.due_date, isLate, isCompleted]);

  const style = STATUS_STYLES[assignment.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.not_started;

  return (
    <Link href={`/dashboard/assignments/${assignment.id}`} className="block">
      <article
        className={cn(
          'relative bg-card rounded-xl border border-border p-4 space-y-2',
          'active:bg-muted/50 transition-colors',
          isLate && 'border-destructive/30',
          isCompleted && 'opacity-75'
        )}
      >
        {isLate && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive rounded-l-xl" />
        )}

        <div className={cn('flex items-center justify-between', isLate && 'pl-2')}>
          <span
            className={cn(
              'font-medium text-sm truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {assignment.title}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5',
              'text-[11px] sm:text-xs font-medium border',
              style
            )}
          >
            {STATUS_LABELS[assignment.status] ?? assignment.status}
          </span>
        </div>

        <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isLate && 'pl-2')}>
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">
              {assignment.student_profile?.full_name || 'Unknown'}
            </span>
          </div>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <div
            className={cn(
              'flex items-center gap-1',
              isLate && 'text-destructive font-medium',
              !isLate && !isCompleted && 'text-warning'
            )}
          >
            {isLate ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : isCompleted ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            <span>{dueDateLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

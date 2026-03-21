'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ASSIGNMENT_STATUS_STYLES as STATUS_STYLES, ASSIGNMENT_STATUS_LABELS as STATUS_LABELS } from './assignment.styles';

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
          'relative bg-card rounded-[10px] p-4 space-y-2',
          'active:bg-muted transition-colors',
          isLate && 'border-l-4 border-destructive',
          isCompleted && 'opacity-75'
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-bold text-sm truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {assignment.title}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5',
              'text-[10px] font-bold uppercase tracking-widest',
              style
            )}
          >
            {STATUS_LABELS[assignment.status] ?? assignment.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              isLate && 'text-red-400 font-medium',
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

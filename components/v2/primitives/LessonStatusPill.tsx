'use client';

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  SCHEDULED: { label: 'Scheduled', dotClass: 'bg-blue-500', bgClass: 'bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400' },
  IN_PROGRESS: { label: 'In progress', dotClass: 'bg-primary', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  COMPLETED: { label: 'Completed', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', dotClass: 'bg-muted-foreground', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
  RESCHEDULED: { label: 'Rescheduled', dotClass: 'bg-amber-500', bgClass: 'bg-amber-500/10', textClass: 'text-amber-600 dark:text-amber-400' },
};

interface LessonStatusPillProps {
  status: string | null;
  compact?: boolean;
  className?: string;
}

export function LessonStatusPill({ status, compact = false, className }: LessonStatusPillProps) {
  const config = STATUS_CONFIG[status ?? ''] ?? STATUS_CONFIG.SCHEDULED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-mono font-medium uppercase tracking-[.08em]',
        config.bgClass,
        config.textClass,
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-[3px] text-[11px]',
        className
      )}
    >
      <span className={cn('rounded-full shrink-0', config.dotClass, compact ? 'w-[5px] h-[5px]' : 'w-1.5 h-1.5')} />
      {config.label}
    </span>
  );
}

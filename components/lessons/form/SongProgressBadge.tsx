import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import type { SongProgressEntry } from '@/app/actions/repertoire';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; icon: 'check' | 'circle' }
> = {
  mastered: {
    label: 'Mastered',
    dotClass: 'text-green-500 dark:text-green-400',
    icon: 'check',
  },
  with_author: {
    label: 'With author',
    dotClass: 'text-purple-500 dark:text-purple-400',
    icon: 'circle',
  },
  remembered: {
    label: 'Remembered',
    dotClass: 'text-blue-500 dark:text-blue-400',
    icon: 'circle',
  },
  started: {
    label: 'Started',
    dotClass: 'text-yellow-500 dark:text-yellow-400',
    icon: 'circle',
  },
  to_learn: {
    label: 'Not started',
    dotClass: 'text-muted-foreground/50',
    icon: 'circle',
  },
};

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function formatPracticeTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

interface SongProgressBadgeProps {
  progress: SongProgressEntry;
}

export function SongProgressBadge({ progress }: SongProgressBadgeProps) {
  const config = STATUS_CONFIG[progress.current_status] ?? STATUS_CONFIG.to_learn;

  const tooltipLines: string[] = [config.label];
  if (progress.last_practiced_at) {
    tooltipLines.push(`Practiced ${formatRelativeDate(progress.last_practiced_at)}`);
  }
  if (progress.total_practice_minutes > 0) {
    tooltipLines.push(`${formatPracticeTime(progress.total_practice_minutes)} total`);
  }

  const StatusIcon = config.icon === 'check' ? CheckCircle2 : Circle;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium shrink-0',
            config.dotClass
          )}
        >
          <StatusIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltipLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Returns a subtle hint class for sorting visual priority:
 * - mastered songs get slightly muted styling
 * - in-progress songs get a left-border highlight
 */
export function getSongProgressHintClass(progress: SongProgressEntry | undefined): string {
  if (!progress) return '';
  if (progress.current_status === 'mastered') return 'opacity-60';
  if (progress.current_status !== 'to_learn') return 'border-l-2 border-l-primary/30';
  return '';
}

/** Numeric order for sorting: in-progress first, not started, mastered last */
export function getProgressSortOrder(status: string | undefined): number {
  if (!status) return 1; // No repertoire entry = not started
  const order: Record<string, number> = {
    started: 0,
    remembered: 0,
    with_author: 0,
    to_learn: 1,
    mastered: 2,
  };
  return order[status] ?? 1;
}

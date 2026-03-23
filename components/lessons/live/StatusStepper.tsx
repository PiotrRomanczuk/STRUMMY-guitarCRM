'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import {
  LessonSongStatus,
  SONG_STATUS_ORDER,
  STATUS_LABELS,
  STATUS_COLORS,
} from './live-lesson.types';

interface StatusStepperProps {
  currentStatus: LessonSongStatus;
  onStatusChange: (newStatus: LessonSongStatus) => void;
  isDisabled?: boolean;
}

export function StatusStepper({ currentStatus, onStatusChange, isDisabled }: StatusStepperProps) {
  const currentIndex = SONG_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex flex-wrap gap-2">
      {SONG_STATUS_ORDER.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = status === currentStatus;
        const colors = STATUS_COLORS[status];

        return (
          <Tooltip key={status}>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onStatusChange(status)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-95',
                  colors.ring,
                  isCurrent && [colors.bg, colors.text, 'ring-2', 'shadow-sm'],
                  isCompleted && [colors.bg, colors.text, 'opacity-80'],
                  !isCurrent && !isCompleted && [
                    'bg-muted/50 text-muted-foreground',
                    'hover:bg-muted dark:hover:bg-muted/80',
                  ],
                )}
                aria-label={`Set status to ${STATUS_LABELS[status]}`}
                aria-pressed={isCurrent}
              >
                {isCompleted && <CheckCircle2 className="size-3.5 shrink-0" />}
                <span className="whitespace-nowrap">{STATUS_LABELS[status]}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {SONG_STATUS_DESCRIPTIONS[status as keyof typeof SONG_STATUS_DESCRIPTIONS] || status}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

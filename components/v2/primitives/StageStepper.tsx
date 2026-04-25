'use client';

import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'to_learn', short: 'Learn', label: 'To learn' },
  { key: 'started', short: 'Started', label: 'Started' },
  { key: 'remembered', short: 'Remember', label: 'Remembered' },
  { key: 'with_author', short: 'w/ Author', label: 'With author' },
  { key: 'mastered', short: 'Mastered', label: 'Mastered' },
] as const;

type SongStatus = (typeof STAGES)[number]['key'];

const STATUS_COLORS: Record<SongStatus, { filled: string; text: string }> = {
  to_learn: { filled: 'bg-muted-foreground', text: 'text-muted-foreground' },
  started: { filled: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  remembered: { filled: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  with_author: { filled: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  mastered: { filled: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

interface StageStepperProps {
  status: string;
  onStatusChange?: (status: string) => void;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
}

export function StageStepper({
  status,
  onStatusChange,
  readOnly = false,
  compact = false,
  className,
}: StageStepperProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === status);
  const validIdx = currentIdx >= 0 ? currentIdx : 0;
  const currentKey = STAGES[validIdx].key;
  const colors = STATUS_COLORS[currentKey];
  const isInteractive = !readOnly && !!onStatusChange;

  return (
    <div className={cn('flex flex-col w-full', compact ? 'gap-0' : 'gap-1.5', className)}>
      {/* Bar segments */}
      <div className="flex gap-[3px] items-center">
        {STAGES.map((stage, i) => {
          const isReached = i <= validIdx;
          return (
            <button
              key={stage.key}
              type="button"
              disabled={!isInteractive}
              onClick={() => isInteractive && onStatusChange(stage.key)}
              title={stage.label}
              className={cn(
                'flex-1 rounded-sm transition-colors',
                compact ? 'h-1.5' : 'h-2',
                isReached ? colors.filled : 'bg-border',
                isInteractive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
              )}
            />
          );
        })}
      </div>

      {/* Labels (hidden in compact mode) */}
      {!compact && (
        <div className="flex justify-between">
          {STAGES.map((stage) => {
            const isActive = stage.key === currentKey;
            return (
              <button
                key={stage.key}
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onStatusChange(stage.key)}
                className={cn(
                  'font-mono uppercase tracking-[.06em]',
                  compact ? 'text-[9px]' : 'text-[10px]',
                  isActive ? cn(colors.text, 'font-medium') : 'text-muted-foreground',
                  isInteractive ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                {stage.short}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SELF_RATING_LABELS } from '@/schemas/SelfRatingSchema';
import type { SongProgressStatus } from '@/types/StudentRepertoire';

/** Maps teacher status to a rough numeric scale for divergence comparison */
const STATUS_TO_NUMERIC: Record<SongProgressStatus, number> = {
  to_learn: 1,
  started: 2,
  remembered: 3,
  with_author: 4,
  mastered: 5,
};

const STATUS_LABELS: Record<SongProgressStatus, string> = {
  to_learn: 'To Learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
  mastered: 'Mastered',
};

interface AssessmentComparisonProps {
  teacherStatus: SongProgressStatus;
  selfRating: number | null;
  selfRatingUpdatedAt: string | null;
}

export function AssessmentComparison({
  teacherStatus,
  selfRating,
  selfRatingUpdatedAt,
}: AssessmentComparisonProps) {
  if (selfRating === null) {
    return (
      <span className="text-[10px] text-muted-foreground/50 italic">
        No self-assessment
      </span>
    );
  }

  const teacherNumeric = STATUS_TO_NUMERIC[teacherStatus];
  const divergence = Math.abs(teacherNumeric - selfRating);
  const hasDivergence = divergence >= 2;

  const formattedDate = selfRatingUpdatedAt
    ? new Date(selfRatingUpdatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const tooltipText = hasDivergence
    ? `Divergence detected: Teacher says "${STATUS_LABELS[teacherStatus]}" but student feels "${SELF_RATING_LABELS[selfRating]}"`
    : `Teacher: ${STATUS_LABELS[teacherStatus]} | Student: ${SELF_RATING_LABELS[selfRating]}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-3 w-3',
                  star <= selfRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-none text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          {hasDivergence && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 border-orange-300 text-orange-600 dark:text-orange-400 gap-0.5"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              Gap
            </Badge>
          )}
          {formattedDate && (
            <span className="text-[10px] text-muted-foreground/50">{formattedDate}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span>{tooltipText}</span>
      </TooltipContent>
    </Tooltip>
  );
}

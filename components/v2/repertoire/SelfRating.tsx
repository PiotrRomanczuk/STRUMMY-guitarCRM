'use client';

import { useCallback, useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateSelfRatingAction } from '@/app/actions/self-rating';
import { SELF_RATING_LABELS } from '@/schemas/SelfRatingSchema';
import { toast } from 'sonner';

interface SelfRatingProps {
  repertoireId: string;
  currentRating: number | null;
  updatedAt: string | null;
  isReadOnly?: boolean;
}

/**
 * Touch-friendly star rating component with 48px touch targets.
 * Calls updateSelfRatingAction on tap, with optimistic update.
 */
export function SelfRating({
  repertoireId,
  currentRating,
  updatedAt,
  isReadOnly = false,
}: SelfRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [optimisticRating, setOptimisticRating] = useState(currentRating);
  const [isPending, startTransition] = useTransition();

  const displayRating = hoveredStar ?? optimisticRating ?? 0;
  const label = displayRating > 0 ? SELF_RATING_LABELS[displayRating] : 'Tap to rate';

  const handleRate = useCallback(
    (rating: number) => {
      if (isReadOnly || isPending) return;

      setOptimisticRating(rating);
      startTransition(async () => {
        const result = await updateSelfRatingAction(repertoireId, rating);
        if ('error' in result) {
          setOptimisticRating(currentRating);
          toast.error(result.error);
        }
      });
    },
    [isReadOnly, isPending, repertoireId, currentRating]
  );

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-1">
      <div
        className={cn('flex items-center gap-1', !isReadOnly && 'cursor-pointer')}
        onMouseLeave={() => setHoveredStar(null)}
        role={isReadOnly ? undefined : 'radiogroup'}
        aria-label="Self-assessment rating"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isReadOnly || isPending}
            className={cn(
              'w-12 h-12 flex items-center justify-center',
              'rounded-lg transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isReadOnly && 'cursor-default',
              isPending && 'opacity-50'
            )}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !isReadOnly && setHoveredStar(star)}
            aria-label={`${star} - ${SELF_RATING_LABELS[star]}`}
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                star <= displayRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pl-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {isReadOnly && formattedDate && (
          <span className="text-xs text-muted-foreground/60">({formattedDate})</span>
        )}
      </div>
    </div>
  );
}

export default SelfRating;

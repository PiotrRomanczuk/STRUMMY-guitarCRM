'use client';

import { cn } from '@/lib/utils';

interface SparklineBarProps {
  /** Value between 0 and max */
  value: number;
  /** Maximum value for scale */
  max: number;
  /** Bar color class */
  color?: string;
  className?: string;
}

/**
 * Minimal inline horizontal bar chart (sparkline-style).
 * Used in cohort cards to show relative metric values.
 */
export function SparklineBar({
  value,
  max,
  color = 'bg-primary',
  className,
}: SparklineBarProps) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      className={cn('h-2 w-full rounded-full bg-muted overflow-hidden', className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} of ${max}`}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

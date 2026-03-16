'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** Value between 0 and 100 */
  value: number;
  /** Size in pixels (width and height) */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Color class for the progress arc */
  color?: string;
  /** Label inside the ring */
  label?: string;
  className?: string;
}

/**
 * Circular progress indicator (SVG-based).
 * Used in student stats to visualize attendance rate, completion rate, etc.
 */
export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = 'text-primary',
  label,
  className,
}: ProgressRingProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`${normalizedValue}% progress`}
        role="img"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out will-change-[stroke-dashoffset]', color)}
          style={{ stroke: 'currentColor' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold">{normalizedValue}%</span>
        {label && (
          <span className="text-[10px] text-muted-foreground leading-tight">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

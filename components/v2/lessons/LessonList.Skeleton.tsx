'use client';

/**
 * Loading skeleton for the v2 lesson list.
 * Renders 5 card skeletons matching the v2 design system pattern.
 */
export function LessonListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-full bg-muted animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-5 bg-muted rounded-full w-16" />
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

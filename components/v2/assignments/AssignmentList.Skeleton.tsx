/**
 * Skeleton loader for the assignment list
 * Renders 5 card skeletons in space-y-2
 */
export function AssignmentListSkeleton() {
  return (
    <div className="px-4 space-y-4">
      {/* Filter chips skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 h-9 w-24 rounded-full bg-muted animate-pulse"
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
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-5 bg-muted rounded-full w-20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

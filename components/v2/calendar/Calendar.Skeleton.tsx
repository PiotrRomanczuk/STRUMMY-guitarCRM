/**
 * Calendar loading skeleton for v2.
 * Shows week strip placeholder + event card placeholders.
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Week strip skeleton */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex justify-between mb-3">
          <div className="h-5 w-5 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="flex justify-between px-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-3 bg-muted rounded w-7" />
              <div className="h-5 bg-muted rounded w-5" />
            </div>
          ))}
        </div>
      </div>

      {/* Date header skeleton */}
      <div className="px-4">
        <div className="h-3 bg-muted rounded w-40" />
      </div>

      {/* Event card skeletons */}
      <div className="px-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for the admin dashboard.
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Status banner skeleton */}
      <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>

      {/* Service cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-3 animate-pulse"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
            <div className="h-3 bg-muted rounded w-1/3 mt-1" />
          </div>
        ))}
      </div>

      {/* Quick links skeleton */}
      <div className="space-y-2">
        <div className="h-5 bg-muted rounded w-1/4 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

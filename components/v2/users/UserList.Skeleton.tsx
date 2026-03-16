/**
 * Loading skeleton for the user list.
 * Renders 5 card skeletons for mobile, table skeleton for desktop.
 */
export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-full bg-muted animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

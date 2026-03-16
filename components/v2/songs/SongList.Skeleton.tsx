export function SongListSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search bar skeleton */}
      <div className="h-11 bg-muted rounded-lg animate-pulse" />

      {/* Filter chips skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-muted rounded-full animate-pulse shrink-0" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 animate-pulse"
          >
            <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-5 w-16 bg-muted rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

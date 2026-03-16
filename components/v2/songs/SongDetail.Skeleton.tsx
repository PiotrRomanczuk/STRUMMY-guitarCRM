export function SongDetailSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>

      {/* Cover image skeleton */}
      <div className="w-full aspect-[3/2] bg-muted rounded-xl" />

      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b border-border pb-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
      </div>

      {/* Metadata grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Chords skeleton */}
      <div className="bg-card rounded-lg border border-border p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-full" />
      </div>
    </div>
  );
}

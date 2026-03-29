export function LessonDetailSkeleton() {
  return (
    <div className="px-6 lg:px-8 py-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-8 w-56 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-muted rounded" />
          <div className="h-10 w-20 bg-muted rounded" />
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notes skeleton */}
          <div className="bg-card rounded-xl p-6 space-y-3">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
          {/* Songs skeleton */}
          <div className="bg-card rounded-xl p-6 space-y-3">
            <div className="h-3 w-20 bg-muted rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 space-y-4">
            <div className="h-3 w-16 bg-muted rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

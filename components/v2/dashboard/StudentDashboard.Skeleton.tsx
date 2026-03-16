export function StudentDashboardSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      {/* Stat pills skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-xl bg-card border border-border px-3 py-2.5 h-[40px]"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-muted" />
              <div className="h-3 bg-muted rounded w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* What's Next skeleton */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div className="h-3.5 bg-muted rounded w-24" />
        <div className="rounded-lg bg-muted/50 p-3 h-[60px]" />
        <div className="rounded-lg bg-muted/50 p-3 h-[60px]" />
      </div>

      {/* Practice songs skeleton */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 bg-muted rounded w-28" />
          <div className="h-3 bg-muted rounded w-14" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <div className="w-7 h-7 rounded-md bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links skeleton */}
      <div className="space-y-2">
        <div className="h-3.5 bg-muted rounded w-20 mx-1" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-card border border-border px-4 py-3
                         min-w-[76px] h-[58px]"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-muted" />
                <div className="h-2.5 bg-muted rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeacherDashboardSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 h-[72px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-5 bg-muted rounded w-10" />
                <div className="h-3 bg-muted rounded w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agenda skeleton */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted rounded-lg" />
        ))}
      </div>

      {/* Attention skeleton */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-28" />
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}

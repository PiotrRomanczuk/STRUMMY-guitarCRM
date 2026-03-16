export function CourseListSkeleton() {
  return (
    <div className="space-y-2 px-4 py-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-5 bg-muted rounded-full w-20" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

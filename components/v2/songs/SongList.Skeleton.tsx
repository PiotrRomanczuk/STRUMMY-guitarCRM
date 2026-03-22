export function SongListSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search bar skeleton */}
      <div className="h-11 bg-card rounded-[10px] animate-pulse" />

      {/* Filter chips skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-card rounded-full animate-pulse shrink-0" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-[10px] p-4 flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <div className="w-12 h-12 rounded-[10px] bg-muted shrink-0 animate-shimmer" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-4 bg-muted rounded w-3/4 animate-shimmer" />
              <div className="h-3 bg-muted rounded w-1/2 opacity-70 animate-shimmer" />
            </div>
            <div className="h-5 w-16 bg-muted rounded-full shrink-0 animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sidebar skeleton matching the v2 AppShell nav sidebar (w-60). */
function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-background flex flex-col z-40 animate-pulse">
      {/* Logo area */}
      <div className="h-14 flex items-center gap-2.5 px-4 shrink-0">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="space-y-1">
          <div className="h-3.5 w-16 bg-muted rounded" />
          <div className="h-2.5 w-10 bg-muted/50 rounded" />
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-hidden py-3 px-2 space-y-4">
        {[4, 3, 2].map((count, gi) => (
          <div key={gi}>
            <div className="h-2.5 w-14 bg-muted/40 rounded px-3 mb-2 ml-3" />
            <div className="space-y-0.5">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                  <div className="w-4 h-4 bg-muted rounded shrink-0" />
                  <div className="h-3.5 bg-muted rounded" style={{ width: `${60 + i * 12}px` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1.5 shrink-0 bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2 px-2">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="ml-auto h-5 w-14 bg-muted rounded-full" />
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-4 h-4 bg-muted rounded" />
          <div className="h-3.5 w-16 bg-muted rounded" />
        </div>
      </div>
    </aside>
  );
}

/** Content area skeleton matching the actual SongList.Desktop table layout. */
function SongListContentSkeleton() {
  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      {/* Header: title + count + button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-44 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Search input */}
      <div className="h-10 w-full max-w-sm bg-card rounded-md animate-pulse" />

      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-card rounded-full animate-pulse shrink-0" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden bg-card shadow-2xl shadow-black/20">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-4 py-3 border-b border-transparent">
          {['Song', 'Artist', 'Category', 'Level', 'Key'].map((col) => (
            <div key={col} className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-4 py-3 items-center animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Song: cover + title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-muted shrink-0" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            {/* Artist */}
            <div className="h-4 bg-muted/60 rounded w-2/3" />
            {/* Category */}
            <div className="h-4 bg-muted/60 rounded w-1/2" />
            {/* Level badge */}
            <div className="h-5 w-20 bg-muted rounded-full" />
            {/* Key */}
            <div className="h-4 bg-muted/60 rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page skeleton with sidebar + table content, matching the v2 desktop layout. */
export function SongListPageSkeleton() {
  return (
    <div className="flex min-h-screen">
      <SidebarSkeleton />
      <main className="ml-60 flex-1 min-h-screen bg-background p-6 lg:p-8">
        <SongListContentSkeleton />
      </main>
    </div>
  );
}

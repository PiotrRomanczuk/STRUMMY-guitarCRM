import { Bell } from 'lucide-react';

interface EmptyStateProps {
  filterStatus: 'all' | 'unread';
}

/**
 * Empty state for v2 notification center.
 */
export function NotificationCenterEmpty({ filterStatus }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No notifications</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {filterStatus === 'unread'
          ? "You're all caught up! No unread notifications."
          : "You don't have any notifications yet."}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for v2 notification center.
 */
export function NotificationCenterSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      <div className="h-3 bg-muted rounded w-16 mb-2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'song_added' | 'assignment_due' | 'assignment_submitted';
  message: string;
  time: string;
}

interface ActivityWidgetProps {
  activities: ActivityItem[];
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  return (
    <section className="bg-card rounded-[10px] p-6 lg:p-8 border border-border/30">
      <h2 className="text-foreground font-bold text-lg mb-6">
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activity will appear as students progress
          </p>
        </div>
      ) : (
        <div className="space-y-5" role="list" aria-label="Recent activity feed">
          {activities.slice(0, 6).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 min-h-[44px]"
              role="listitem"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20
                              flex items-center justify-center shrink-0">
                <ActivityIcon type={activity.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 opacity-50">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const iconMap: Record<string, string> = {
    lesson_completed: 'text-green-400',
    song_added: 'text-primary',
    assignment_due: 'text-yellow-400',
    assignment_submitted: 'text-green-400',
  };
  return <Activity className={`h-4 w-4 ${iconMap[type] ?? 'text-primary'}`} />;
}

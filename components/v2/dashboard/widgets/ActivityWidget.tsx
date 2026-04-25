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

const VERB_COLORS: Record<string, string> = {
  lesson_completed: 'text-emerald-600 dark:text-emerald-400',
  song_added: 'text-primary',
  assignment_due: 'text-amber-600 dark:text-amber-400',
  assignment_submitted: 'text-emerald-600 dark:text-emerald-400',
};

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      <div className="px-6 pt-5 pb-1 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">
            Activity
          </div>
          <div className="font-serif text-lg font-normal tracking-[-0.01em] mt-0.5">
            Recent across your studio
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-serif text-base italic text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-0.5">Activity will appear as students progress</p>
        </div>
      ) : (
        <div className="px-6 pb-5">
          {activities.slice(0, 6).map((activity) => (
            <div
              key={activity.id}
              className="grid grid-cols-[24px_1fr_auto] gap-3 items-center py-2.5 border-b border-border"
            >
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
                {activity.message.charAt(0).toUpperCase()}
              </div>
              <div className="text-[13px] min-w-0 truncate">
                <span className="font-medium">{activity.message.split(' ').slice(0, 2).join(' ')}</span>{' '}
                <span className={VERB_COLORS[activity.type] ?? 'text-foreground'}>
                  {activity.message.split(' ').slice(2).join(' ')}
                </span>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground shrink-0">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

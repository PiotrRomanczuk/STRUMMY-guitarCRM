'use client';

import {
  Clock,
  CheckCircle2,
  Music,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'song_added' | 'assignment_due' | 'assignment_submitted';
  message: string;
  time: string;
}

interface ActivityWidgetProps {
  activities: ActivityItem[];
}

const activityIcons = {
  lesson_completed: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  song_added: {
    icon: Music,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  assignment_due: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  assignment_submitted: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
} as const;

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-primary">Recent Activity</span>
        </h3>
      </div>

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
        <div className="p-3 space-y-1" role="list" aria-label="Recent activity feed">
          {activities.slice(0, 6).map((activity) => {
            const { icon: Icon, color, bg } = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px]"
                role="listitem"
              >
                <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', bg)}>
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

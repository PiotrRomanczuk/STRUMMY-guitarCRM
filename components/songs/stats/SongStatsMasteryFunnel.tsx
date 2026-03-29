'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MasteryFunnel } from '@/types/SongStatsEngagement';

interface Props {
  funnel: MasteryFunnel;
}

const STAGES: Array<{ key: keyof MasteryFunnel; label: string; color: string }> = [
  { key: 'toLearn', label: 'To Learn', color: 'bg-slate-500' },
  { key: 'started', label: 'Started', color: 'bg-blue-500' },
  { key: 'remembered', label: 'Remembered', color: 'bg-amber-500' },
  { key: 'withAuthor', label: 'With Author', color: 'bg-purple-500' },
  { key: 'mastered', label: 'Mastered', color: 'bg-emerald-500' },
];

export function SongStatsMasteryFunnel({ funnel }: Props) {
  const total = Object.values(funnel).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mastery Funnel</CardTitle>
          <CardDescription>No student progress data yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const maxCount = Math.max(...Object.values(funnel));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mastery Funnel</CardTitle>
        <CardDescription>{total} total song assignments across all students</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {STAGES.map((stage) => {
          const count = funnel[stage.key];
          const percent = Math.round((count / total) * 100);
          const width = maxCount > 0 ? Math.max((count / maxCount) * 100, 2) : 0;
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-24 text-sm text-muted-foreground shrink-0">{stage.label}</div>
              <div className="flex-1 h-8 bg-muted/50 rounded-md overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-md flex items-center px-2`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-white whitespace-nowrap">{count}</span>
                </div>
              </div>
              <div className="w-12 text-right text-sm text-muted-foreground">{percent}%</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

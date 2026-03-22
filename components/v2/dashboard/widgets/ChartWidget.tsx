'use client';

import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  lessons: number;
  assignments: number;
}

interface ChartWidgetProps {
  data: ChartDataPoint[];
}

const LazyChart = dynamic(
  () => import('./ChartWidget.Content').then((m) => ({ default: m.ChartContent })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-muted rounded-lg animate-pulse" />
    ),
  }
);

export function ChartWidget({ data }: ChartWidgetProps) {
  const hasData = data.some((d) => d.lessons > 0 || d.assignments > 0);

  return (
    <section className="bg-card rounded-[10px] p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekly Progress
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Lessons and assignments this week
        </p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No data yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Progress will appear once lessons are tracked
          </p>
        </div>
      ) : (
        <LazyChart data={data} />
      )}
    </section>
  );
}

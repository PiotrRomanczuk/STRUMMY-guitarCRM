'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartCarousel } from './ChartCarousel';
import type { AdvancedLessonStats } from '@/components/lessons/hooks/useLessonStatsAdvanced';
import type { SongStatsAdvanced } from '@/types/SongStatsAdvanced';

interface StatsChartsProps {
  lessonStats?: AdvancedLessonStats;
  songStats?: SongStatsAdvanced;
}

function MiniBarChart({ data, dataKey, fill }: {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  fill: string;
}) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsCharts({ lessonStats, songStats }: StatsChartsProps) {
  const slides = useMemo(() => {
    const items = [];

    if (lessonStats?.monthlyTrend && lessonStats.monthlyTrend.length > 0) {
      const monthlyData = lessonStats.monthlyTrend.slice(-6).map((m) => ({
        name: m.month.slice(0, 3),
        completed: m.completed,
      }));

      items.push({
        id: 'monthly-lessons',
        title: 'Monthly Lessons',
        content: (
          <MiniBarChart
            data={monthlyData}
            dataKey="completed"
            fill="hsl(var(--primary))"
          />
        ),
      });
    }

    if (lessonStats?.studentGrowth && lessonStats.studentGrowth.length > 0) {
      const growthData = lessonStats.studentGrowth.slice(-6).map((g) => ({
        name: g.month.slice(0, 3),
        students: g.cumulativeStudents,
      }));

      items.push({
        id: 'student-growth',
        title: 'Student Growth',
        content: (
          <MiniBarChart
            data={growthData}
            dataKey="students"
            fill="hsl(142, 76%, 36%)"
          />
        ),
      });
    }

    if (lessonStats?.scheduleDistribution?.byDayOfWeek) {
      const dayData = lessonStats.scheduleDistribution.byDayOfWeek.map((d) => ({
        name: d.day.slice(0, 3),
        count: d.count,
      }));

      items.push({
        id: 'day-distribution',
        title: 'Lessons by Day',
        content: (
          <MiniBarChart
            data={dayData}
            dataKey="count"
            fill="hsl(38, 92%, 50%)"
          />
        ),
      });
    }

    if (songStats?.libraryGrowth && songStats.libraryGrowth.length > 0) {
      const songGrowthData = songStats.libraryGrowth.slice(-6).map((g) => ({
        name: g.month.slice(0, 3),
        songs: g.cumulative,
      }));

      items.push({
        id: 'song-growth',
        title: 'Song Library Growth',
        content: (
          <MiniBarChart
            data={songGrowthData}
            dataKey="songs"
            fill="hsl(350, 75%, 45%)"
          />
        ),
      });
    }

    return items;
  }, [lessonStats, songStats]);

  if (slides.length === 0) return null;

  return <ChartCarousel slides={slides} />;
}

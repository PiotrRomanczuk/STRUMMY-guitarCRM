'use client';

import { motion } from 'framer-motion';
import { useLessonStatsAdvanced } from '@/components/lessons/hooks/useLessonStatsAdvanced';
import { useSongStatsAdvanced } from '@/components/songs/hooks/useSongStatsAdvanced';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { StatsKPICards } from './StatsOverview.KPIs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export default function StatsOverviewDesktop() {
  const { data: lessonStats, isLoading: lessonsLoading } = useLessonStatsAdvanced();
  const { data: songStats, isLoading: songsLoading } = useSongStatsAdvanced();

  const isLoading = lessonsLoading || songsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lessonStats && !songStats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">No statistics yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Statistics will appear once you have lesson and song data.
        </p>
      </div>
    );
  }

  const monthlyData = lessonStats?.monthlyTrend?.slice(-8).map((m) => ({
    name: m.month,
    completed: m.completed,
    cancelled: m.cancelled,
  })) ?? [];

  const growthData = lessonStats?.studentGrowth?.slice(-8).map((g) => ({
    name: g.month,
    students: g.cumulativeStudents,
  })) ?? [];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">Teaching analytics overview</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={listItem}>
          <StatsKPICards lessonStats={lessonStats} songStats={songStats} />
        </motion.div>

        <motion.div variants={listItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthlyData.length > 0 && (
            <ChartCard title="Monthly Lessons">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {growthData.length > 0 && (
            <ChartCard title="Student Growth">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="students" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

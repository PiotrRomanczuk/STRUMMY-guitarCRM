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
    <div className="bg-card rounded-[10px] border border-border p-6 space-y-4">
      <h3 className="font-serif text-xl font-normal tracking-[-0.01em]">{title}</h3>
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
      <div className="space-y-6 px-8 pt-7 pb-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-[10px]" />
          <Skeleton className="h-[300px] rounded-[10px]" />
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
        <h3 className="font-serif text-xl font-normal tracking-[-0.01em] mb-1">No statistics yet</h3>
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
    <div className="flex flex-col h-full min-h-0">
      <div className="px-8 pt-7 pb-5 max-w-7xl mx-auto w-full">
        <div className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">Analytics</div>
        <h1 className="mt-1 font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">Studio Overview</h1>
        <div className="text-muted-foreground text-[13px] mt-1.5">Teaching analytics and performance metrics</div>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-10 max-w-7xl mx-auto w-full">
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
    </div>
  );
}

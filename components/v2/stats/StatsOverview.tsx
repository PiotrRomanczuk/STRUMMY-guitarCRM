'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useLessonStatsAdvanced } from '@/components/lessons/hooks/useLessonStatsAdvanced';
import { useSongStatsAdvanced } from '@/components/songs/hooks/useSongStatsAdvanced';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StatsKPICards } from './StatsOverview.KPIs';
import { StatsCharts } from './StatsOverview.Charts';
import { BarChart3 } from 'lucide-react';

const StatsOverviewDesktop = lazy(() => import('./StatsOverview.Desktop'));

function StatsOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-[200px] bg-muted rounded" />
      </div>
    </div>
  );
}

function MobileStatsOverview() {
  const { data: lessonStats, isLoading: lessonsLoading } = useLessonStatsAdvanced();
  const { data: songStats, isLoading: songsLoading } = useSongStatsAdvanced();

  const isLoading = lessonsLoading || songsLoading;

  if (isLoading) {
    return (
      <MobilePageShell title="Statistics" subtitle="Teaching analytics at a glance">
        <StatsOverviewSkeleton />
      </MobilePageShell>
    );
  }

  if (!lessonStats && !songStats) {
    return (
      <MobilePageShell title="Statistics" subtitle="Teaching analytics at a glance">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No statistics yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Statistics will appear once you have lesson and song data.
          </p>
        </div>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title="Statistics" subtitle="Teaching analytics at a glance">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={listItem}>
          <StatsKPICards lessonStats={lessonStats} songStats={songStats} />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCharts lessonStats={lessonStats} songStats={songStats} />
        </motion.div>
      </motion.div>
    </MobilePageShell>
  );
}

export function StatsOverview() {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <MobileStatsOverview />;

  return (
    <Suspense fallback={<MobileStatsOverview />}>
      <StatsOverviewDesktop />
    </Suspense>
  );
}

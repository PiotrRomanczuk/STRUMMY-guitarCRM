'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  Music,
  Layers,
} from 'lucide-react';
import type { AdvancedLessonStats } from '@/components/lessons/hooks/useLessonStatsAdvanced';
import type { SongStatsAdvanced } from '@/types/SongStatsAdvanced';

interface StatsKPICardsProps {
  lessonStats?: AdvancedLessonStats;
  songStats?: SongStatsAdvanced;
}

interface KPIItem {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

export function StatsKPICards({ lessonStats, songStats }: StatsKPICardsProps) {
  const kpis: KPIItem[] = [];

  if (lessonStats?.overview) {
    kpis.push(
      {
        label: 'Total Lessons',
        value: lessonStats.overview.totalLessons.toLocaleString(),
        icon: BookOpen,
        color: 'text-blue-500',
      },
      {
        label: 'Students',
        value: lessonStats.overview.uniqueStudents.toLocaleString(),
        icon: Users,
        color: 'text-purple-500',
      },
      {
        label: 'Avg / Week',
        value: lessonStats.overview.avgLessonsPerWeek.toFixed(1),
        icon: TrendingUp,
        color: 'text-emerald-500',
      },
      {
        label: 'Completion',
        value: `${lessonStats.overview.completionRate}%`,
        icon: CheckCircle,
        color: 'text-green-500',
      },
    );
  }

  if (songStats?.overview) {
    kpis.push(
      {
        label: 'Total Songs',
        value: songStats.overview.totalSongs.toLocaleString(),
        icon: Music,
        color: 'text-primary',
      },
      {
        label: 'Categories',
        value: songStats.overview.uniqueCategories.toLocaleString(),
        icon: Layers,
        color: 'text-amber-500',
      },
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {kpis.map((kpi) => (
        <motion.div
          key={kpi.label}
          variants={listItem}
          className="bg-card rounded-xl border border-border p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </span>
            <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
          </div>
          <div className="text-xl font-bold">{kpi.value}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

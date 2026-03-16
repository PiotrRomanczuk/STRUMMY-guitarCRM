'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { StatsWidget } from './widgets/StatsWidget';
import { AgendaWidget } from './widgets/AgendaWidget';
import { AttentionWidget } from './widgets/AttentionWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { StudentsWidget } from './widgets/StudentsWidget';
import { SongsWidget } from './widgets/SongsWidget';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import type { TeacherDashboardV2Props } from './TeacherDashboard';

export default function TeacherDashboardDesktop({
  data,
  fullName,
  email,
  isAdmin,
  sotw,
}: TeacherDashboardV2Props) {
  const displayName = fullName || email || 'Coach';

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back,{' '}
          <span className="text-primary">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your guitar students today.
        </p>
      </div>

      {/* Stats row */}
      <StatsWidget
        totalStudents={data.stats.totalStudents}
        songsInLibrary={data.stats.songsInLibrary}
        lessonsThisWeek={data.stats.lessonsThisWeek}
        pendingAssignments={data.stats.pendingAssignments}
      />

      {/* Two-column: Agenda + Attention */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={listItem}>
          <AgendaWidget items={data.agenda} />
        </motion.div>
        <motion.div variants={listItem}>
          <AttentionWidget items={data.needsAttention} />
        </motion.div>
      </motion.div>

      {/* Song of the Week */}
      {sotw && <SOTWCard sotw={sotw} isAdmin={isAdmin} />}

      {/* Three-column: Students + Songs + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StudentsWidget students={data.students} />
          <SongsWidget songs={data.songs} />
        </div>
        <div>
          <ActivityWidget activities={data.activities} />
        </div>
      </div>

      {/* Chart */}
      <ChartWidget data={data.chartData} />
    </div>
  );
}

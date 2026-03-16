'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { SongOfTheWeekCard } from '@/components/song-of-the-week';
import { StatPills } from './student-widgets/StatPills';
import { WhatsNextCard } from './student-widgets/WhatsNextCard';
import { PracticeSongList } from './student-widgets/PracticeSongList';
import { QuickLinks } from './student-widgets/QuickLinks';
import type { StudentDashboardV2Props } from './StudentDashboard';

export default function StudentDashboardDesktop({
  data,
  email,
  sotw,
  sotwInRepertoire = false,
}: StudentDashboardV2Props) {
  const displayName = data.studentName || email?.split('@')[0] || 'Student';

  return (
    <div className="w-full max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back,{' '}
          <span className="text-primary">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your guitar journey at a glance.
        </p>
      </div>

      {/* Stats row */}
      <StatPills stats={data.stats} />

      {/* Two-column: What's Next + SOTW */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={listItem}>
          <WhatsNextCard
            nextLesson={data.nextLesson}
            topAssignment={data.assignments[0] ?? null}
          />
        </motion.div>

        {sotw ? (
          <motion.div variants={listItem}>
            <SongOfTheWeekCard
              sotw={sotw}
              sotwInRepertoire={sotwInRepertoire}
              isStudent
            />
          </motion.div>
        ) : (
          <div />
        )}
      </motion.div>

      {/* Practice songs */}
      <PracticeSongList songs={data.recentSongs.slice(0, 6)} />

      {/* Quick links */}
      <QuickLinks totalAssignments={data.stats.activeAssignments} />
    </div>
  );
}

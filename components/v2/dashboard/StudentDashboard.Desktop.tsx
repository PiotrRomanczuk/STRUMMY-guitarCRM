'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import { StatPills } from './student-widgets/StatPills';
import { WhatsNextCard } from './student-widgets/WhatsNextCard';
import { PracticeSongList } from './student-widgets/PracticeSongList';
import { QuickLinks } from './student-widgets/QuickLinks';
import { StreakTracker } from './student-widgets/StreakTracker';
import { AchievementBadges } from './student-widgets/AchievementBadges';
import type { StudentDashboardV2Props } from './StudentDashboard';

export default function StudentDashboardDesktop({
  data,
  email,
  sotw,
  sotwInRepertoire = false,
}: StudentDashboardV2Props) {
  const displayName = data.studentName || email?.split('@')[0] || 'Student';

  return (
    <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">
            Hey, {displayName}!
          </h1>
          <div className="flex items-center gap-2 text-primary font-medium">
            <Flame className="h-5 w-5" fill="currentColor" />
            <span className="tracking-wide uppercase text-xs font-bold">
              Keep practicing!
            </span>
          </div>
        </div>
        <StatPills stats={data.stats} />
      </div>

      {/* Bento Grid: Streak + Next Lesson */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StreakTracker streakDays={data.stats.completedLessons} />
        </div>
        <WhatsNextCard
          nextLesson={data.nextLesson}
          topAssignment={data.assignments[0] ?? null}
        />
      </div>

      {/* Practice songs */}
      <PracticeSongList songs={data.recentSongs.slice(0, 6)} repertoire={data.repertoire} />

      {/* Achievements + SOTW */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <motion.div variants={listItem}>
          <AchievementBadges />
        </motion.div>
        {sotw ? (
          <motion.div variants={listItem}>
            <SOTWCard sotw={sotw} sotwInRepertoire={sotwInRepertoire} isStudent />
          </motion.div>
        ) : (
          <div />
        )}
      </motion.div>

      {/* Quick links */}
      <QuickLinks totalAssignments={data.stats.activeAssignments} />
    </div>
  );
}

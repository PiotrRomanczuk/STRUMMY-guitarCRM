'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem, cardEntrance, safeVariants } from '@/lib/animations/variants';
import { Flame } from 'lucide-react';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import { StatPills } from './student-widgets/StatPills';
import { WhatsNextCard } from './student-widgets/WhatsNextCard';
import { PracticeSongList } from './student-widgets/PracticeSongList';
import { QuickLinks } from './student-widgets/QuickLinks';
import { StreakTracker } from './student-widgets/StreakTracker';
import { AchievementBadges } from './student-widgets/AchievementBadges';
import type { StudentDashboardV2Props } from './StudentDashboard';

export function StudentDashboardMobile({
  data,
  sotw,
  sotwInRepertoire = false,
}: StudentDashboardV2Props) {
  const greeting = getGreeting();
  const displayName = data.studentName?.split(' ')[0] || 'Student';

  return (
    <MobilePageShell
      title={`${greeting}, ${displayName}!`}
      subtitle="Your guitar journey at a glance"
      showBack={false}
    >
      <motion.div
        variants={safeVariants(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Streak banner */}
        <motion.div variants={safeVariants(listItem)}>
          <div className="flex items-center gap-2 text-primary font-medium">
            <Flame className="h-5 w-5" fill="currentColor" />
            <span className="tracking-wide uppercase text-xs font-bold">
              Keep practicing!
            </span>
          </div>
        </motion.div>

        {/* Stat pills */}
        <motion.div variants={safeVariants(listItem)}>
          <StatPills stats={data.stats} />
        </motion.div>

        {/* Streak tracker */}
        <motion.div variants={safeVariants(listItem)}>
          <StreakTracker streakDays={data.stats.completedLessons} />
        </motion.div>

        {/* What's Next card */}
        <motion.div variants={safeVariants(cardEntrance)}>
          <WhatsNextCard
            nextLesson={data.nextLesson}
            topAssignment={data.assignments[0] ?? null}
          />
        </motion.div>

        {/* Practice songs */}
        <motion.div variants={safeVariants(listItem)}>
          <PracticeSongList songs={data.recentSongs.slice(0, 4)} />
        </motion.div>

        {/* Song of the Week */}
        {sotw && (
          <motion.div variants={safeVariants(listItem)}>
            <SOTWCard sotw={sotw} sotwInRepertoire={sotwInRepertoire} isStudent />
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div variants={safeVariants(listItem)}>
          <AchievementBadges />
        </motion.div>

        {/* Quick links */}
        <motion.div variants={safeVariants(listItem)}>
          <QuickLinks totalAssignments={data.stats.activeAssignments} />
        </motion.div>
      </motion.div>
    </MobilePageShell>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem, cardEntrance, safeVariants } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import { StatPills } from './student-widgets/StatPills';
import { WhatsNextCard } from './student-widgets/WhatsNextCard';
import { RepertoireProgress } from './student-widgets/RepertoireProgress';
import { QuickLinks } from './student-widgets/QuickLinks';
import { StreakTracker } from './student-widgets/StreakTracker';
import { AchievementBadges } from './student-widgets/AchievementBadges';
import { LastLessonCard } from './student-widgets/LastLessonCard';
import { PracticeToday } from './student-widgets/PracticeToday';
import { AssignmentsList } from './student-widgets/AssignmentsList';
import { PracticeLogButton } from '@/components/v2/practice';
import type { StudentDashboardV2Props } from './StudentDashboard';

export function StudentDashboardMobile({
  data,
  sotw,
  sotwInRepertoire = false,
}: StudentDashboardV2Props) {
  const greeting = getGreeting();
  const displayName = data.studentName?.split(' ')[0] || 'Student';
  const streakDays = data.practiceStreakDays ?? 0;

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
        {/* Stat pills */}
        <motion.div variants={safeVariants(listItem)}>
          <StatPills stats={data.stats} />
        </motion.div>

        {/* Streak tracker */}
        <motion.div variants={safeVariants(listItem)}>
          <StreakTracker streakDays={streakDays} />
        </motion.div>

        {/* What's Next card */}
        <motion.div variants={safeVariants(cardEntrance)}>
          <WhatsNextCard nextLesson={data.nextLesson} topAssignment={data.assignments[0] ?? null} />
        </motion.div>

        {/* Practice Today */}
        <motion.div variants={safeVariants(listItem)}>
          <PracticeToday repertoire={data.repertoire} recentSongs={data.recentSongs} />
        </motion.div>

        {/* Last Lesson */}
        {data.lastLesson && (
          <motion.div variants={safeVariants(listItem)}>
            <LastLessonCard lesson={data.lastLesson} />
          </motion.div>
        )}

        {/* Assignments */}
        <motion.div variants={safeVariants(listItem)}>
          <AssignmentsList assignments={data.assignments} />
        </motion.div>

        {/* Repertoire progress */}
        <motion.div variants={safeVariants(listItem)}>
          <RepertoireProgress items={data.repertoire} maxItems={4} />
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

      {/* Floating practice log button */}
      <PracticeLogButton />
    </MobilePageShell>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

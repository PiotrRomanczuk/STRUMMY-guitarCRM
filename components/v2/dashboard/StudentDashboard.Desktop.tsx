'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { staggerContainer, listItem } from '@/lib/animations/variants';
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

export default function StudentDashboardDesktop({
  data,
  email,
  sotw,
  sotwInRepertoire = false,
}: StudentDashboardV2Props) {
  const displayName = data.studentName || email?.split('@')[0] || 'Student';
  const streakDays = data.practiceStreakDays ?? 0;
  const subtitle = buildSubtitle(streakDays, data.lastLesson?.scheduled_at ?? null);

  return (
    <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header + StatPills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground">
            Hey, {displayName}!
          </h1>
          <div className="flex items-center gap-2 text-primary font-medium">
            <Flame className="h-5 w-5" fill="currentColor" aria-hidden="true" />
            <span className="tracking-wide uppercase text-xs font-bold">{subtitle}</span>
          </div>
        </div>
        <StatPills stats={data.stats} />
      </div>

      {/* 2. Bento: StreakTracker | WhatsNextCard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StreakTracker streakDays={streakDays} />
        </div>
        <WhatsNextCard nextLesson={data.nextLesson} topAssignment={data.assignments[0] ?? null} />
      </div>

      {/* 3. PracticeToday */}
      <PracticeToday repertoire={data.repertoire} recentSongs={data.recentSongs} />

      {/* 4. LastLessonCard (when present) */}
      {data.lastLesson && <LastLessonCard lesson={data.lastLesson} />}

      {/* 5. AssignmentsList */}
      <AssignmentsList assignments={data.assignments} />

      {/* 6. RepertoireProgress */}
      <RepertoireProgress items={data.repertoire} maxItems={6} />

      {/* 7. Achievements + SOTW */}
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

      {/* 8. QuickLinks */}
      <QuickLinks totalAssignments={data.stats.activeAssignments} />

      {/* 9. Floating PracticeLogButton */}
      <PracticeLogButton />
    </div>
  );
}

function buildSubtitle(streakDays: number, lastPracticeAt: string | null): string {
  if (streakDays >= 3) return `${streakDays}-day streak — keep it up!`;

  if (lastPracticeAt) {
    const daysSince = Math.floor((Date.now() - new Date(lastPracticeAt).getTime()) / 86_400_000);
    if (daysSince <= 1) return 'Nice work yesterday';
    if (daysSince <= 4) return 'Time to pick up the guitar';
  }

  return 'Welcome back';
}

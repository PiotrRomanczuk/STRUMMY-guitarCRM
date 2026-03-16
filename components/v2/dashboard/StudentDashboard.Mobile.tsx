'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem, cardEntrance, safeVariants } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import { StatPills } from './student-widgets/StatPills';
import { WhatsNextCard } from './student-widgets/WhatsNextCard';
import { PracticeSongList } from './student-widgets/PracticeSongList';
import { QuickLinks } from './student-widgets/QuickLinks';
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
        className="space-y-4"
      >
        {/* Section 1: Stat pills */}
        <motion.div variants={safeVariants(listItem)}>
          <StatPills stats={data.stats} />
        </motion.div>

        {/* Section 2: What's Next card */}
        <motion.div variants={safeVariants(cardEntrance)}>
          <WhatsNextCard
            nextLesson={data.nextLesson}
            topAssignment={data.assignments[0] ?? null}
          />
        </motion.div>

        {/* Section 3: Practice Focus */}
        {sotw && (
          <motion.div variants={safeVariants(listItem)}>
            <SOTWCard
              sotw={sotw}
              sotwInRepertoire={sotwInRepertoire}
              isStudent
            />
          </motion.div>
        )}

        <motion.div variants={safeVariants(listItem)}>
          <PracticeSongList songs={data.recentSongs.slice(0, 4)} />
        </motion.div>

        {/* Section 4: Quick links */}
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

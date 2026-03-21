'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem, safeVariants } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StatsWidget } from './widgets/StatsWidget';
import { AgendaWidget } from './widgets/AgendaWidget';
import { AttentionWidget } from './widgets/AttentionWidget';
import { SwipeableWidgets } from './widgets/SwipeableWidgets';
import { QuickActionsFAB } from './widgets/QuickActions';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import type { TeacherDashboardV2Props } from './TeacherDashboard';

export function TeacherDashboardMobile({
  data,
  fullName,
  email,
  isAdmin,
  sotw,
}: TeacherDashboardV2Props) {
  const greeting = getGreeting();
  const displayName = fullName?.split(' ')[0] || email?.split('@')[0] || 'Coach';

  return (
    <MobilePageShell
      title={`${greeting}, ${displayName}`}
      subtitle="Here's your day at a glance"
      showBack={false}
      fab={<QuickActionsFAB />}
    >
      <motion.div
        variants={safeVariants(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Stats overview */}
        <motion.div variants={safeVariants(listItem)}>
          <StatsWidget
            totalStudents={data.stats.totalStudents}
            songsInLibrary={data.stats.songsInLibrary}
            lessonsThisWeek={data.stats.lessonsThisWeek}
            pendingAssignments={data.stats.pendingAssignments}
          />
        </motion.div>

        {/* Swipeable: Agenda + Attention */}
        <motion.div variants={safeVariants(listItem)}>
          <SwipeableWidgets labels={['Agenda', 'Needs Attention']}>
            <AgendaWidget items={data.agenda} />
            <AttentionWidget items={data.needsAttention} />
          </SwipeableWidgets>
        </motion.div>

        {/* Song of the Week */}
        {sotw && (
          <motion.div variants={safeVariants(listItem)}>
            <SOTWCard sotw={sotw} isAdmin={isAdmin} />
          </motion.div>
        )}

        {/* Recent students - compact card list */}
        {data.students.length > 0 && (
          <motion.div variants={safeVariants(listItem)}>
            <StudentCards students={data.students.slice(0, 5)} />
          </motion.div>
        )}
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

function StudentCards({
  students,
}: {
  students: { id: string; name: string; level: string; nextLesson: string }[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        Your Students
      </h3>
      <div className="space-y-2">
        {students.map((student) => (
          <a
            key={student.id}
            href={`/dashboard/users/${student.id}`}
            className="block bg-card rounded-xl border border-border/50 p-4
                       active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student.level} &middot; Next: {student.nextLesson}
                </p>
              </div>
              <LevelBadge level={student.level} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const styles =
    level === 'Advanced'
      ? 'bg-primary/10 text-primary border-primary/20'
      : level === 'Intermediate'
        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
        : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5
                  text-[11px] font-medium border shrink-0 ${styles}`}
    >
      {level}
    </span>
  );
}

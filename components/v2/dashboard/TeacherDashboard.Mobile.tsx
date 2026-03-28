'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem, safeVariants } from '@/lib/animations/variants';
import { PlayCircle, UserPlus, Library, BarChart3 } from 'lucide-react';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StatsWidget } from './widgets/StatsWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
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
  const lessonCount = data.agenda.filter((a) => a.type === 'lesson').length;

  return (
    <MobilePageShell
      title={`${greeting}, ${displayName}`}
      subtitle={`You have ${lessonCount} lesson${lessonCount !== 1 ? 's' : ''} today`}
      showBack={false}
      fab={<QuickActionsFAB />}
    >
      <motion.div
        variants={safeVariants(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats chips */}
        <motion.div variants={safeVariants(listItem)}>
          <StatsWidget
            totalStudents={data.stats.totalStudents}
            songsInLibrary={data.stats.songsInLibrary}
            lessonsThisWeek={data.stats.lessonsThisWeek}
            pendingAssignments={data.stats.pendingAssignments}
          />
        </motion.div>

        {/* Today's Lessons */}
        {data.agenda.length > 0 && (
          <motion.div variants={safeVariants(listItem)}>
            <LessonCards items={data.agenda.slice(0, 4)} />
          </motion.div>
        )}

        {/* Quick Actions 2x2 */}
        <motion.div variants={safeVariants(listItem)}>
          <MobileQuickActions />
        </motion.div>

        {/* Song of the Week */}
        {sotw && (
          <motion.div variants={safeVariants(listItem)}>
            <SOTWCard sotw={sotw} isAdmin={isAdmin} />
          </motion.div>
        )}

        {/* Activity feed */}
        <motion.div variants={safeVariants(listItem)}>
          <ActivityWidget activities={data.activities} />
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

function LessonCards({ items }: {
  items: { id: string; title: string; time?: string; status: string }[];
}) {
  const badgeStyle: Record<string, string> = {
    completed: 'bg-secondary text-muted-foreground/40',
    overdue: 'bg-emerald-500/10 text-emerald-400',
    upcoming: 'bg-primary/10 text-primary',
  };
  const badgeLabel: Record<string, string> = {
    completed: 'Completed', overdue: 'In Progress', upcoming: 'Upcoming',
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold text-foreground">Today&apos;s Lessons</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}
            className="bg-card p-4 rounded-[10px] flex items-center justify-between
                       active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              {item.time && (
                <>
                  <p className="text-xs font-bold text-muted-foreground min-w-[50px] text-center">{item.time}</p>
                  <div className="h-8 w-px bg-border/30" />
                </>
              )}
              <h4 className="font-bold text-foreground text-sm truncate">{item.title}</h4>
            </div>
            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${badgeStyle[item.status] ?? badgeStyle.upcoming}`}>
              {badgeLabel[item.status] ?? 'Upcoming'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileQuickActions() {
  const actions = [
    { label: 'Start\nLesson', href: '/dashboard/lessons/new', Icon: PlayCircle },
    { label: 'Add\nStudent', href: '/dashboard/users/invite', Icon: UserPlus },
    { label: 'Song\nLibrary', href: '/dashboard/songs', Icon: Library },
    { label: 'Teacher\nReports', href: '/dashboard/stats', Icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          className="bg-card p-5 rounded-[10px] flex flex-col gap-3
                     border border-border/30
                     active:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <action.Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground leading-tight whitespace-pre-line">
            {action.label}
          </span>
        </a>
      ))}
    </div>
  );
}

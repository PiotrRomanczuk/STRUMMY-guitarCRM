'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { ProgressRing } from './ProgressRing';
import {
  BookOpen,
  Music,
  ClipboardList,
  Calendar,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';

interface RecentLesson {
  id: string;
  scheduled_at: string;
  status: string;
  lesson_teacher_number: number;
}

interface StudentStatsProps {
  stats: {
    totalSongs: number;
    completedLessons: number;
    totalLessons: number;
    attendanceRate: number;
    assignmentCompletionRate: number;
    recentLessons: RecentLesson[];
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}

/**
 * v2 mobile student stats page with progress rings and KPI cards.
 * Reuses stats data from the server-side page (no new API calls).
 */
export function StudentStats({ stats }: StudentStatsProps) {
  return (
    <MobilePageShell title="My Stats" subtitle="Track your learning progress">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Progress rings */}
        <motion.div variants={listItem} className="flex justify-center gap-6 py-2">
          <ProgressRing
            value={stats.attendanceRate}
            size={96}
            strokeWidth={8}
            color="text-green-500"
            label="Attend."
          />
          <ProgressRing
            value={stats.assignmentCompletionRate}
            size={96}
            strokeWidth={8}
            color="text-primary"
            label="Assign."
          />
        </motion.div>

        {/* KPI cards */}
        <motion.div variants={listItem} className="grid grid-cols-2 gap-3">
          <StatCard
            icon={BookOpen}
            label="Lessons"
            value={stats.completedLessons}
            subtitle={`of ${stats.totalLessons} total`}
          />
          <StatCard
            icon={Music}
            label="Songs"
            value={stats.totalSongs}
            subtitle="in repertoire"
          />
          <StatCard
            icon={Target}
            label="Attendance"
            value={`${stats.attendanceRate}%`}
          />
          <StatCard
            icon={ClipboardList}
            label="Assignments"
            value={`${stats.assignmentCompletionRate}%`}
          />
        </motion.div>

        {/* Recent lessons */}
        {stats.recentLessons.length > 0 && (
          <motion.div variants={listItem} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              Recent Lessons
            </h3>
            <div className="space-y-2">
              {stats.recentLessons.slice(0, 5).map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      Lesson #{lesson.lesson_teacher_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lesson.scheduled_at), 'PPP')}
                    </p>
                  </div>
                  <span
                    className={
                      lesson.status === 'COMPLETED'
                        ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border bg-muted text-muted-foreground border-border'
                    }
                  >
                    {lesson.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </MobilePageShell>
  );
}

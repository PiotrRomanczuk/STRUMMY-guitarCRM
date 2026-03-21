'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { Users, Music, BookOpen, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface StatsWidgetProps {
  totalStudents: number;
  songsInLibrary: number;
  lessonsThisWeek: number;
  pendingAssignments: number;
}

export function StatsWidget({
  totalStudents,
  songsInLibrary,
  lessonsThisWeek,
  pendingAssignments,
}: StatsWidgetProps) {
  const stats: StatItem[] = [
    {
      label: 'Students',
      value: totalStudents,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Songs',
      value: songsInLibrary,
      icon: Music,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'This Week',
      value: lessonsThisWeek,
      icon: BookOpen,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Pending',
      value: pendingAssignments,
      icon: ClipboardList,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            variants={listItem}
            className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3 dark:shadow-[0_0_20px_hsl(38_92%_50%/0.06)]"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}
            >
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground truncate">
                {stat.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { Users, Music, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsWidgetProps {
  totalStudents: number;
  songsInLibrary: number;
  lessonsThisWeek: number;
  pendingAssignments: number;
}

const stats = [
  { label: 'Active Students', key: 'totalStudents', icon: Users, accent: 'border-l-primary' },
  { label: 'Songs', key: 'songsInLibrary', icon: Music, accent: 'border-l-emerald-400' },
  { label: 'This Week', key: 'lessonsThisWeek', icon: BookOpen, accent: 'border-l-sky-400' },
  { label: 'Pending', key: 'pendingAssignments', icon: ClipboardList, accent: 'border-l-amber-400' },
] as const;

export function StatsWidget(props: StatsWidgetProps) {
  const valueMap: Record<string, number> = {
    totalStudents: props.totalStudents,
    songsInLibrary: props.songsInLibrary,
    lessonsThisWeek: props.lessonsThisWeek,
    pendingAssignments: props.pendingAssignments,
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          label={stat.label}
          value={valueMap[stat.key]}
          icon={stat.icon}
          accent={stat.accent}
        />
      ))}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <motion.div
      variants={listItem}
      className={cn(
        'bg-card rounded-[10px] p-5 flex flex-col justify-between',
        'border-l-4 group hover:bg-muted/50 transition-colors',
        accent
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
        <Icon className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
      </div>
      <span className="text-foreground text-4xl font-black leading-none">
        {value}
      </span>
    </motion.div>
  );
}

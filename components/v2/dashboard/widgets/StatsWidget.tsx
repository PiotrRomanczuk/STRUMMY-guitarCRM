'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';

interface StatsWidgetProps {
  totalStudents: number;
  songsInLibrary: number;
  lessonsThisWeek: number;
  pendingAssignments: number;
}

const stats = [
  {
    label: 'Active students',
    key: 'totalStudents',
    href: '/dashboard/users?role=student&status=active',
  },
  {
    label: 'Lessons this week',
    key: 'lessonsThisWeek',
    href: '/dashboard/lessons?range=this-week',
  },
  {
    label: 'Songs in library',
    key: 'songsInLibrary',
    href: '/dashboard/songs?scope=mine',
  },
  {
    label: 'Pending assignments',
    key: 'pendingAssignments',
    href: '/dashboard/assignments?status=pending',
  },
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
        <Link key={stat.key} href={stat.href} className="block">
          <motion.div
            variants={listItem}
            className="bg-card border border-border rounded-[14px] p-5 relative overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200"
          >
            <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.12em] font-medium">
              {stat.label}
            </div>
            <div className="flex items-baseline gap-2.5 mt-1.5">
              <span className="font-serif text-[40px] font-normal tracking-[-0.03em] leading-none">
                {valueMap[stat.key]}
              </span>
            </div>
            {/* Subtle decorative staff lines */}
            <div className="absolute right-[-6px] top-4 w-16 h-9 opacity-[0.15]">
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 36">
                {[1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 6}
                    x2="100"
                    y2={i * 6}
                    stroke="currentColor"
                    strokeWidth="0.7"
                    className="text-muted-foreground"
                  />
                ))}
              </svg>
            </div>
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
}

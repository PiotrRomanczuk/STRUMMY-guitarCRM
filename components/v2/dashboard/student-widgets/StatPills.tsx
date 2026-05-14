import Link from 'next/link';
import { Music, BookOpen, ClipboardList, Timer } from 'lucide-react';

interface StatPillsProps {
  stats: {
    totalSongs: number;
    completedLessons: number;
    activeAssignments: number;
    practiceHours?: number;
  };
}

interface PillConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

export function StatPills({ stats }: StatPillsProps) {
  const pills: PillConfig[] = [
    {
      icon: Music,
      label: `${stats.totalSongs} ${stats.totalSongs === 1 ? 'song' : 'songs'}`,
      href: '/dashboard/repertoire',
    },
    {
      icon: BookOpen,
      label: `${stats.completedLessons} ${stats.completedLessons === 1 ? 'lesson' : 'lessons'}`,
      href: '/dashboard/lessons',
    },
    {
      icon: ClipboardList,
      label: `${stats.activeAssignments} ${stats.activeAssignments === 1 ? 'task' : 'tasks'}`,
      href: '/dashboard/assignments',
    },
    ...(stats.practiceHours !== undefined && stats.practiceHours > 0
      ? [
          {
            icon: Timer,
            label: `${stats.practiceHours}h practice`,
            href: '/dashboard/stats',
          } satisfies PillConfig,
        ]
      : []),
  ];

  return (
    <div className="flex gap-3">
      {pills.map((pill) => (
        <Link
          key={pill.label}
          href={pill.href}
          className="flex-1 flex items-center gap-2 rounded-[10px] bg-card px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors border border-transparent"
        >
          <pill.icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs font-bold text-foreground truncate">{pill.label}</span>
        </Link>
      ))}
    </div>
  );
}

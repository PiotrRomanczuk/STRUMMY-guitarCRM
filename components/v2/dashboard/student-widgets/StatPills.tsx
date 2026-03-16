import { Music, BookOpen, ClipboardList } from 'lucide-react';

interface StatPillsProps {
  stats: {
    totalSongs: number;
    completedLessons: number;
    activeAssignments: number;
  };
}

export function StatPills({ stats }: StatPillsProps) {
  const pills = [
    { icon: Music, label: `${stats.totalSongs} ${stats.totalSongs === 1 ? 'song' : 'songs'}`, color: 'text-primary' },
    {
      icon: BookOpen,
      label: `${stats.completedLessons} ${stats.completedLessons === 1 ? 'lesson' : 'lessons'}`,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: ClipboardList,
      label: `${stats.activeAssignments} ${stats.activeAssignments === 1 ? 'task' : 'tasks'}`,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="flex gap-2">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className="flex-1 flex items-center gap-1.5 rounded-xl
                     bg-card border border-border px-3 py-2.5"
        >
          <pill.icon className={`h-4 w-4 shrink-0 ${pill.color}`} />
          <span className="text-xs font-medium text-foreground truncate">
            {pill.label}
          </span>
        </div>
      ))}
    </div>
  );
}

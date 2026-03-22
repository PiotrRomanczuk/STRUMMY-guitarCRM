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
    { icon: Music, label: `${stats.totalSongs} ${stats.totalSongs === 1 ? 'song' : 'songs'}` },
    {
      icon: BookOpen,
      label: `${stats.completedLessons} ${stats.completedLessons === 1 ? 'lesson' : 'lessons'}`,
    },
    {
      icon: ClipboardList,
      label: `${stats.activeAssignments} ${stats.activeAssignments === 1 ? 'task' : 'tasks'}`,
    },
  ];

  return (
    <div className="flex gap-3">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className="flex-1 flex items-center gap-2 rounded-[10px]
                     bg-card px-4 py-3"
        >
          <pill.icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs font-bold text-foreground truncate">
            {pill.label}
          </span>
        </div>
      ))}
    </div>
  );
}

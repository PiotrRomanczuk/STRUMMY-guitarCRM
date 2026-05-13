import { Card, CardContent } from '@/components/ui/card';
import { Users, CalendarDays, Music, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TeacherStats {
  myStudents: number;
  activeLessons: number;
  songsLibrary: number;
  studentProgress: number;
}

interface TeacherDashboardStatsProps {
  stats: TeacherStats;
}

interface StatCardConfig {
  icon: LucideIcon;
  value: string;
  label: string;
  colorClass: string;
}

function TeacherStatCard({ icon: Icon, value, label, colorClass }: StatCardConfig) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <div className={`mb-1 sm:mb-2 ${colorClass}`}>
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-1">{value}</h3>
        <p className="text-xs sm:text-base text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Teacher Dashboard Statistics
 * Shows teacher-specific metrics with Lucide icons and color coding.
 */
export function TeacherDashboardStats({ stats }: TeacherDashboardStatsProps) {
  const cards: StatCardConfig[] = [
    {
      icon: Users,
      value: stats.myStudents.toString(),
      // Note: this counts students the teacher has ever had a lesson with
      // (from the teacher_students view), not students currently active per
      // student_status. Label kept honest. See #327. The companion
      // 'Needs Attention' widget surfaces who's gone quiet.
      label: 'Students Taught',
      colorClass: 'text-blue-500',
    },
    {
      icon: CalendarDays,
      value: stats.activeLessons.toString(),
      label: "This Week's Lessons",
      colorClass: 'text-green-500',
    },
    {
      icon: Music,
      value: stats.songsLibrary.toString(),
      label: 'Song Library',
      colorClass: 'text-amber-500',
    },
    {
      icon: TrendingUp,
      value: stats.studentProgress.toString(),
      label: 'Avg. Progress',
      colorClass: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((card) => (
        <TeacherStatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

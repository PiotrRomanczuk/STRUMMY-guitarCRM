'use client';

import { format } from 'date-fns';
import { StatsWidget } from './widgets/StatsWidget';
import { AgendaWidget } from './widgets/AgendaWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { StudentsWidget } from './widgets/StudentsWidget';
import { QuickActionsGrid } from './widgets/QuickActions';
import { MiniCalendar } from './widgets/MiniCalendar';
import { ChartWidget } from './widgets/ChartWidget';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import type { TeacherDashboardV2Props } from './TeacherDashboard';

export default function TeacherDashboardDesktop({
  data,
  fullName,
  email,
  isAdmin,
  sotw,
}: TeacherDashboardV2Props) {
  const displayName = fullName?.split(' ')[0] || email?.split('@')[0] || 'Coach';
  const greeting = getGreeting();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-12 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-xs text-muted-foreground font-medium opacity-70 uppercase tracking-tighter">
          {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats row */}
      <StatsWidget
        totalStudents={data.stats.totalStudents}
        songsInLibrary={data.stats.songsInLibrary}
        lessonsThisWeek={data.stats.lessonsThisWeek}
        pendingAssignments={data.stats.pendingAssignments}
      />

      {/* Content Grid: 60/40 split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column (60%) */}
        <div className="lg:col-span-6 space-y-8">
          <AgendaWidget items={data.agenda} />
          <ActivityWidget activities={data.activities} />
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-4 space-y-8">
          <QuickActionsGrid />
          <StudentsWidget students={data.students} />
          <MiniCalendar />
        </div>
      </div>

      {/* Song of the Week */}
      {sotw && <SOTWCard sotw={sotw} isAdmin={isAdmin} />}

      {/* Chart */}
      <ChartWidget data={data.chartData} />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

'use client';

import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatsWidget } from './widgets/StatsWidget';
import { AgendaWidget } from './widgets/AgendaWidget';
import { ActivityWidget } from './widgets/ActivityWidget';
import { StudentsWidget } from './widgets/StudentsWidget';
import { AttentionWidget } from './widgets/AttentionWidget';
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
    <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-12 py-7 space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.16em] mb-1.5">
            {format(new Date(), 'EEEE · MMMM d, yyyy')}
          </div>
          <h1 className="font-serif font-normal text-[38px] tracking-[-0.02em] leading-[1.05]">
            {greeting}, <em className="italic text-primary">{displayName}</em>.
          </h1>
          {data.needsAttention.length > 0 && (
            <p className="text-muted-foreground text-sm mt-2 max-w-xl">
              {data.needsAttention.length}{' '}
              {data.needsAttention.length === 1 ? 'student needs' : 'students need'} attention
              today.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/songs/new">Add song</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/lessons/new">
              <Plus className="h-3 w-3" /> New lesson
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsWidget
        totalStudents={data.stats.totalStudents}
        songsInLibrary={data.stats.songsInLibrary}
        lessonsThisWeek={data.stats.lessonsThisWeek}
        pendingAssignments={data.stats.pendingAssignments}
      />

      {/* Main grid: 1.6fr / 1fr */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          <AgendaWidget items={data.agenda} />
          {data.needsAttention.length > 0 && <AttentionWidget items={data.needsAttention} />}
          <ActivityWidget activities={data.activities} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <QuickActionsGrid />
          <MiniCalendar />
          <StudentsWidget students={data.students} />
          {sotw && <SOTWCard sotw={sotw} isAdmin={isAdmin} />}
        </div>
      </div>

      {/* Chart */}
      <ChartWidget
        data={data.chartData.map((d) => ({
          day: d.name,
          lessons: d.lessons,
          assignmentsCreated: d.assignments,
        }))}
      />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

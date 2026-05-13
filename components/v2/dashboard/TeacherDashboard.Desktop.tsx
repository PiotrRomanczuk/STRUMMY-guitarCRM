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
import { WeeklySummaryWidget } from './widgets/WeeklySummaryWidget';
import { SOTWCard } from '@/components/v2/song-of-the-week';
import type { TeacherDashboardV2Props } from './TeacherDashboard';
import type { StudentV2, ChartDataPoint, WeeklySummary } from '@/types/teacher-dashboard-v2';

// Safe coercions — until Alpha populates the new fields the UI degrades gracefully
function toStudentV2(raw: TeacherDashboardV2Props['data']['students'][number]): StudentV2 {
  return {
    id: raw.id,
    name: raw.name,
    level: raw.level,
    lessonsCompleted: raw.lessonsCompleted,
    lastLessonAt: (raw as unknown as StudentV2).lastLessonAt ?? null,
    nextLessonAt: (raw as unknown as StudentV2).nextLessonAt ?? null,
    overdueAssignmentCount: (raw as unknown as StudentV2).overdueAssignmentCount ?? 0,
    repertoireCount: (raw as unknown as StudentV2).repertoireCount ?? 0,
    avatar: raw.avatar,
  };
}

function toChartDataPoints(raw: TeacherDashboardV2Props['data']['chartData']): ChartDataPoint[] {
  return raw.map((d) => ({
    day: (d as unknown as ChartDataPoint).day ?? (d as unknown as { name?: string }).name ?? '',
    lessons: d.lessons,
    assignmentsCreated:
      (d as unknown as ChartDataPoint).assignmentsCreated ??
      (d as unknown as { assignments?: number }).assignments ??
      0,
  }));
}

const DEFAULT_WEEKLY_SUMMARY: WeeklySummary = {
  lessonsTaught: 0,
  lessonsScheduled: 0,
  assignmentsCreated: 0,
  assignmentsCompleted: 0,
};

function buildPulseLine(
  lessonsToday: number,
  needsAttentionCount: number,
  pendingAssignments: number
): string {
  const parts: string[] = [];
  if (lessonsToday > 0)
    parts.push(`${lessonsToday} ${lessonsToday === 1 ? 'lesson' : 'lessons'} today`);
  if (needsAttentionCount > 0)
    parts.push(
      `${needsAttentionCount} ${needsAttentionCount === 1 ? 'student needs' : 'students need'} attention`
    );
  if (pendingAssignments > 0) parts.push(`${pendingAssignments} pending`);
  return parts.length > 0 ? parts.join(' · ') : 'Quiet day. Plan ahead.';
}

export default function TeacherDashboardDesktop({
  data,
  fullName,
  email,
  isAdmin,
  sotw,
}: TeacherDashboardV2Props) {
  const displayName = fullName?.split(' ')[0] || email?.split('@')[0] || 'Coach';
  const greeting = getGreeting();

  const studentsV2 = data.students.map(toStudentV2);
  const chartPoints = toChartDataPoints(data.chartData);
  const weeklySummary: WeeklySummary =
    (data as unknown as { weeklySummary?: WeeklySummary }).weeklySummary ?? DEFAULT_WEEKLY_SUMMARY;

  const lessonsToday = data.agenda.filter((a) => a.type === 'lesson').length;
  const pulseLine = buildPulseLine(
    lessonsToday,
    data.needsAttention.length,
    data.stats.pendingAssignments
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-12 py-7 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.16em] mb-1.5">
            {format(new Date(), 'EEEE · MMMM d, yyyy')}
          </div>
          <h1 className="font-serif font-normal text-[38px] tracking-[-0.02em] leading-[1.05]">
            {greeting}, <em className="italic text-primary">{displayName}</em>.
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">{pulseLine}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/songs/new">Add song</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/lessons/new">
              <Plus className="h-3 w-3" aria-hidden /> New lesson
            </Link>
          </Button>
        </div>
      </div>

      {/* Weekly summary strip */}
      <WeeklySummaryWidget summary={weeklySummary} />

      {/* Stats */}
      <StatsWidget
        totalStudents={data.stats.totalStudents}
        songsInLibrary={data.stats.songsInLibrary}
        lessonsThisWeek={data.stats.lessonsThisWeek}
        pendingAssignments={data.stats.pendingAssignments}
      />

      {/* Main grid: 60% / 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          <AgendaWidget items={data.agenda} />
          <ActivityWidget activities={data.activities} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <QuickActionsGrid />
          {data.needsAttention.length > 0 && <AttentionWidget items={data.needsAttention} />}
          <StudentsWidget students={studentsV2} />
          <MiniCalendar />
          {sotw && <SOTWCard sotw={sotw} isAdmin={isAdmin} />}
        </div>
      </div>

      {/* Chart */}
      <ChartWidget data={chartPoints} />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

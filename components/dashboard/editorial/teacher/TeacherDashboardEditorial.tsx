import type {
  AtRiskStudent,
  OverdueAssignmentRow,
  RosterStudent,
  Utilization,
  WeekDensityDay,
} from '@/lib/services/teacher-dashboard-backfill-queries';
import type { StudioActivityItem } from '@/lib/services/teacher-dashboard-activity';
import type { DayLesson, TeacherDayStats } from '@/lib/services/teacher-dashboard-queries';

import {
  NeedsAttentionCard,
  OverdueAssignmentsCard,
  StudentRosterCard,
  UtilizationCard,
  WeekDensityCard,
} from './BackfillCards';
import { ActivityFeedCard, QuickActionsCard, SongOfWeekCard } from './TeacherDeltaCards';
import type { SongOfWeekView } from './TeacherDeltaCards';
import { TeacherDaySpine } from './TeacherDaySpine';
import { TeacherGreeting } from './TeacherGreeting';

type Props = {
  fullName: string | null;
  email: string;
  now: Date;
  lessons: DayLesson[];
  stats: TeacherDayStats;
  atRisk: AtRiskStudent[];
  overdueAssignments?: OverdueAssignmentRow[];
  weekDensity: WeekDensityDay[];
  utilization: Utilization;
  roster: RosterStudent[];
  activity: StudioActivityItem[];
  songOfWeek: SongOfWeekView | null;
};

export const TeacherDashboardEditorial = ({
  fullName,
  email,
  now,
  lessons,
  stats,
  atRisk,
  overdueAssignments = [],
  weekDensity,
  utilization,
  roster,
  activity,
  songOfWeek,
}: Props) => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '24px 32px 64px',
    }}
  >
    <TeacherGreeting fullName={fullName} email={email} now={now} stats={stats} />
    <div className="ed-grid-hero">
      <TeacherDaySpine lessons={lessons} now={now} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <QuickActionsCard />
        <OverdueAssignmentsCard rows={overdueAssignments} />
        <NeedsAttentionCard rows={atRisk} />
        <WeekDensityCard days={weekDensity} />
        <UtilizationCard utilization={utilization} />
      </div>
    </div>
    <div className="ed-grid-2" style={{ marginTop: 20 }}>
      <StudentRosterCard rows={roster} />
      <SongOfWeekCard song={songOfWeek} />
    </div>
    <div style={{ marginTop: 20 }}>
      <ActivityFeedCard items={activity} now={now} />
    </div>
  </div>
);

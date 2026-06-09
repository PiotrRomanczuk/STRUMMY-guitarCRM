import type { DayLesson, TeacherDayStats } from '@/lib/services/teacher-dashboard-queries';

import {
  NeedsAttentionCardPlaceholder,
  SongLibraryCardPlaceholder,
  StudentRosterCardPlaceholder,
  UtilizationCardPlaceholder,
  WeekDensityCardPlaceholder,
} from './PlaceholderCards';
import { TeacherDaySpine } from './TeacherDaySpine';
import { TeacherGreeting } from './TeacherGreeting';

type Props = {
  fullName: string | null;
  email: string;
  now: Date;
  lessons: DayLesson[];
  stats: TeacherDayStats;
};

export const TeacherDashboardEditorial = ({ fullName, email, now, lessons, stats }: Props) => (
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
        gap: 20,
      }}
    >
      <TeacherDaySpine lessons={lessons} now={now} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <NeedsAttentionCardPlaceholder />
        <WeekDensityCardPlaceholder />
        <UtilizationCardPlaceholder />
      </div>
    </div>
    <div
      style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}
    >
      <StudentRosterCardPlaceholder />
      <SongLibraryCardPlaceholder />
    </div>
  </div>
);

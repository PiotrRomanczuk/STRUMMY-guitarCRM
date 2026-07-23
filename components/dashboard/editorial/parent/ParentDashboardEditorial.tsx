import Link from 'next/link';

import type { ParentChild, ParentChildOverview } from '@/lib/services/parent-dashboard-queries';
import { formatPracticeMinutes } from '@/lib/services/student-health.helpers';

import { StudentInitials } from '../primitives';
import { ParentNoteCard } from './ParentDashboardEditorial.Note';
import { ParentPracticeCard } from './ParentDashboardEditorial.Practice';
import { ParentBillingCard, ParentUpcomingLessonsCard } from './ParentDashboardEditorial.Sidebar';
import { SectionLabel, StatChip } from './ParentDashboardEditorial.shared';

type Props = {
  childrenList: ParentChild[];
  activeChildId: string | null;
  child: ParentChildOverview | null;
};

const PAGE_STYLE = {
  background: 'var(--ivory)',
  color: 'var(--ink)',
  fontSize: 13,
  lineHeight: 1.4,
  minHeight: '100%',
  padding: '28px 32px 64px',
} as const;

const EmptyState = () => (
  <div style={PAGE_STYLE}>
    <div style={{ maxWidth: 460, margin: '48px auto', textAlign: 'center' }}>
      <SectionLabel>Family portal</SectionLabel>
      <h1
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 30,
          fontWeight: 500,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          margin: '10px 0 10px',
        }}
      >
        No child linked yet
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        Ask your teacher to connect your account to your child, and their practice, lessons, and
        notes will show up here.
      </p>
    </div>
  </div>
);

const ChildSwitcher = ({
  childrenList,
  activeChildId,
}: {
  childrenList: ParentChild[];
  activeChildId: string | null;
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
    {childrenList.map((child) => (
      <Link
        key={child.id}
        href={`/dashboard?view=parent&child=${child.id}`}
        className="ed-parent-tab"
        aria-current={child.id === activeChildId ? 'true' : undefined}
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-4)',
          textDecoration: 'none',
          border: '1px solid var(--rule)',
          borderRadius: 999,
          padding: '6px 14px',
        }}
      >
        {child.name}
      </Link>
    ))}
  </div>
);

export const ParentDashboardEditorial = ({ childrenList, activeChildId, child }: Props) => {
  if (!child) return <EmptyState />;

  const subtitle = [child.skillLevel, child.teacherName ? `with ${child.teacherName}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={PAGE_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <StudentInitials name={child.name} email={null} size={64} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <SectionLabel style={{ marginBottom: 6 }}>Checking in on</SectionLabel>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 32,
              fontWeight: 500,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {child.name}
          </h1>
          {subtitle && (
            <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatChip value={String(child.streakDays)} label="day streak" tone="gold" />
          <StatChip value={String(child.songCount)} label="songs" />
          <StatChip
            value={formatPracticeMinutes(child.practiceWeek.totalMinutes)}
            label="this week"
            tone="success"
          />
        </div>
      </div>

      {childrenList.length > 1 && (
        <ChildSwitcher childrenList={childrenList} activeChildId={activeChildId} />
      )}

      <div className="ed-grid-hero" style={{ marginTop: 20 }}>
        <ParentPracticeCard days={child.practiceDays} week={child.practiceWeek} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ParentUpcomingLessonsCard lessons={child.upcomingLessons} />
          <ParentBillingCard />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <ParentNoteCard note={child.latestNote} childName={child.name} />
      </div>
    </div>
  );
};

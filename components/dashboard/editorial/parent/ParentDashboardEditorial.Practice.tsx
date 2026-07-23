import type { PracticeDay, PracticeWeek } from '@/lib/services/student-health.helpers';
import { formatPracticeMinutes } from '@/lib/services/student-health.helpers';

import { Card } from '../primitives';
import { Badge, SectionLabel } from './ParentDashboardEditorial.shared';

const relativeLabel = (day: PracticeDay, indexFromNewest: number): string => {
  if (indexFromNewest === 0) return 'Today';
  if (indexFromNewest === 1) return 'Yesterday';
  return day.label;
};

const PracticeBars = ({ days, goalPerDay }: { days: PracticeDay[]; goalPerDay: number }) => {
  const max = Math.max(goalPerDay, ...days.map((d) => d.minutes), 1);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${days.length}, 1fr)`,
        gap: 8,
        alignItems: 'end',
        height: 120,
      }}
    >
      {days.map((d) => (
        <div
          key={d.date}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            height: '100%',
          }}
        >
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column-reverse' }}>
            <div
              style={{
                height: `${(d.minutes / max) * 100}%`,
                minHeight: d.hasPractice ? 6 : 2,
                background: d.hasPractice ? 'var(--gold-2)' : 'var(--rule)',
                borderRadius: '3px 3px 0 0',
              }}
            />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ParentPracticeCard = ({ days, week }: { days: PracticeDay[]; week: PracticeWeek }) => {
  const newestFirst = days.slice().reverse();
  return (
    <Card>
      <div
        style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500 }}>
          Recent practice
        </span>
        <Badge tone={week.onTrack ? 'success' : 'warn'}>
          {week.onTrack ? 'On track this week' : 'Needs attention'}
        </Badge>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--rule-2)' }}>
        <PracticeBars days={days} goalPerDay={week.goalPerDay} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 10,
            fontSize: 12,
            color: 'var(--ink-4)',
          }}
        >
          <span>{formatPracticeMinutes(week.totalMinutes)} logged</span>
          <span style={{ fontFamily: 'var(--mono)' }}>Goal · {week.goalPerDay} min/day</span>
        </div>
      </div>

      <div>
        {newestFirst.map((d, i) => (
          <div
            key={d.date}
            className="ed-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 22px',
              borderBottom: i < newestFirst.length - 1 ? '1px solid var(--rule-2)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: d.hasPractice ? 'var(--ink)' : 'var(--ink-4)',
                }}
              >
                {d.hasPractice ? 'Practice logged' : 'No practice logged'}
              </div>
              <SectionLabel style={{ marginTop: 2, letterSpacing: '.08em' }}>
                {relativeLabel(d, i)}
              </SectionLabel>
            </div>
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                fontWeight: 500,
                color: d.hasPractice ? 'var(--ink)' : 'var(--ink-5)',
              }}
            >
              {d.minutes}
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}> min</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

import Link from 'next/link';

import type {
  AtRiskStudent,
  RosterStudent,
  SongLibrarySummary,
  Utilization,
  WeekDensityDay,
} from '@/lib/services/teacher-dashboard-backfill-queries';

import { Card, CardHeader, StudentInitials } from '../primitives';

const formatDate = (iso: string | null): string =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const NeedsAttentionCard = ({ rows }: { rows: AtRiskStudent[] }) => (
  <Card>
    <CardHeader eyebrow="Watch closely" title="Needs attention" />
    {rows.length === 0 ? (
      <Empty>Everyone’s on track this week.</Empty>
    ) : (
      <div>
        {rows.map((r, i) => (
          <Link
            key={r.studentId}
            href={`/dashboard/users/${r.studentId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              gap: 10,
              padding: '12px 22px',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
              textDecoration: 'none',
              color: 'inherit',
              alignItems: 'center',
            }}
          >
            <StudentInitials name={r.name} email={r.email} size={32} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.name ?? r.email ?? 'Student'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                last practiced {formatDate(r.lastPracticedAt)}
              </div>
            </div>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: r.daysSincePractice > 14 ? 'var(--danger)' : 'var(--warn)',
                fontWeight: 600,
              }}
            >
              {r.daysSincePractice}d
            </span>
          </Link>
        ))}
      </div>
    )}
  </Card>
);

export const WeekDensityCard = ({ days }: { days: WeekDensityDay[] }) => {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <Card>
      <CardHeader eyebrow="The week ahead" title="Week density" />
      <div
        style={{
          padding: '18px 22px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          alignItems: 'end',
        }}
      >
        {days.map((d) => (
          <div
            key={d.weekday}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                height: 60,
                display: 'flex',
                flexDirection: 'column-reverse',
                width: '100%',
              }}
            >
              <div
                style={{
                  height: `${(d.count / max) * 100}%`,
                  background: d.count === 0 ? 'var(--rule)' : 'var(--gold-2)',
                  borderRadius: '3px 3px 0 0',
                  minHeight: d.count === 0 ? 2 : 6,
                }}
              />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
              {d.weekday}
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                fontWeight: 500,
              }}
            >
              {d.count}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const UtilizationCard = ({ utilization }: { utilization: Utilization }) => (
  <Card>
    <CardHeader eyebrow="Studio time" title="Utilization" />
    <div style={{ padding: '20px 24px 22px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 500 }}>
          {utilization.pct}%
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
          {utilization.bookedHours.toFixed(1)}h / {utilization.nominalHours}h
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--rule)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, utilization.pct)}%`,
            background:
              utilization.pct > 90
                ? 'var(--danger)'
                : utilization.pct > 70
                  ? 'var(--gold-2)'
                  : 'var(--success)',
          }}
        />
      </div>
      <div
        style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}
      >
        Booked vs an 8-hour weekday baseline (5-day week).
      </div>
    </div>
  </Card>
);

export const StudentRosterCard = ({ rows }: { rows: RosterStudent[] }) => (
  <Card>
    <CardHeader eyebrow="Your students" title="Roster" />
    {rows.length === 0 ? (
      <Empty>No active students yet.</Empty>
    ) : (
      <div>
        {rows.map((r, i) => (
          <Link
            key={r.studentId}
            href={`/dashboard/users/${r.studentId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              gap: 10,
              padding: '12px 22px',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
              textDecoration: 'none',
              color: 'inherit',
              alignItems: 'center',
            }}
          >
            <StudentInitials name={r.name} email={r.email} size={32} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.name ?? r.email ?? 'Student'}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
              {formatDate(r.lastLessonAt)}
            </span>
          </Link>
        ))}
      </div>
    )}
  </Card>
);

export const SongLibraryCard = ({ summary }: { summary: SongLibrarySummary }) => (
  <Card>
    <CardHeader
      eyebrow="Library"
      title="Songs"
      action={
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
          {summary.total} total
        </span>
      }
    />
    {summary.recent.length === 0 ? (
      <Empty>Library is empty.</Empty>
    ) : (
      <div>
        {summary.recent.map((s, i) => (
          <Link
            key={s.id}
            href={`/dashboard/songs/${s.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 22px',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.title}
            </span>
            {s.author && (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  marginLeft: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.author}
              </span>
            )}
          </Link>
        ))}
      </div>
    )}
  </Card>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '24px',
      textAlign: 'center',
      color: 'var(--ink-4)',
      fontStyle: 'italic',
      fontFamily: 'var(--serif)',
      fontSize: 14,
    }}
  >
    {children}
  </div>
);

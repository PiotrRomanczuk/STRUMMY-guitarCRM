import { Card, CardHeader, StageStepper } from './primitives';

import { firstNameWithInitial, minutesLabel, monthYear } from './format';
import type {
  RelatedSongRow,
  SongLearner,
  SongUsageStats,
} from '@/lib/services/song-detail-queries';

const SidebarStat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingBottom: 10,
      borderBottom: '1px solid var(--rule-2)',
    }}
  >
    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500 }}>{value}</span>
      {unit && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
          {unit}
        </span>
      )}
    </span>
  </div>
);

export const UsageCard = ({ stats }: { stats: SongUsageStats }) => (
  <Card>
    <CardHeader eyebrow="In your library" title="Usage" />
    <div
      style={{
        padding: '0 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <SidebarStat label="Assigned to" value={String(stats.assignedTo)} unit="students" />
      <SidebarStat label="Lessons featured in" value={String(stats.usedInLessons)} unit="lessons" />
      <SidebarStat label="In library since" value={monthYear(stats.inLibrarySince)} />
      <SidebarStat label="Avg. mastery" value={String(stats.avgMastery)} unit="%" />
    </div>
  </Card>
);

export const LearnersCard = ({ learners }: { learners: SongLearner[] }) => (
  <Card>
    <CardHeader
      eyebrow="Currently learning"
      title="Students"
      action={
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
          {learners.length}
        </span>
      }
    />
    <div style={{ padding: '0 24px 22px' }}>
      {learners.length === 0 ? (
        <div
          style={{
            fontStyle: 'italic',
            color: 'var(--ink-4)',
            fontFamily: 'var(--serif)',
            fontSize: 14,
            padding: '4px 0 8px',
          }}
        >
          No active learners yet.
        </div>
      ) : (
        learners.map((row, i) => {
          const displayName = firstNameWithInitial(row.fullName, row.email ?? 'Student');
          return (
            <div
              key={row.studentId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 60px',
                gap: 10,
                padding: '10px 0',
                alignItems: 'center',
                borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
              <StageStepper status={row.status} size="sm" />
              <span
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                }}
              >
                {minutesLabel(row.totalPracticeMinutes)}
              </span>
            </div>
          );
        })
      )}
    </div>
  </Card>
);

export const RelatedCard = ({ related }: { related: RelatedSongRow[] }) => {
  if (related.length === 0) return null;
  return (
    <Card>
      <CardHeader eyebrow="Similar level" title="Related" />
      <div
        style={{
          padding: '0 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {related.map((r, i) => (
          <a
            key={r.id}
            href={`/dashboard/songs/${r.id}`}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: i < related.length - 1 ? '1px solid var(--rule-2)' : 'none',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontFamily: 'var(--serif)',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {r.songKey ?? '·'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 14,
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                {r.title}
              </div>
              {r.author && (
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--ink-4)',
                  }}
                >
                  {r.author}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
};

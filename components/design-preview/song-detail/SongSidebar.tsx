import { Avatar } from '@/components/design-preview/primitives/atoms';
import { Icon } from '@/components/design-preview/lib/icons';
import { STUDENTS } from '@/components/design-preview/lib/mock-data';

import { RELATED_SONGS, SONG_LEARNERS } from './data';
import { btnPrimary, Card, CardHeader, LI } from './helpers';
import { StageStepper } from './StageStepper';
import type { SongDetailData } from './types';

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

export const SongSidebarStats = ({ s }: { s: SongDetailData }) => (
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
      <SidebarStat label="Assigned to" value={String(s.assignedTo)} unit="students" />
      <SidebarStat label="Lessons featured in" value={String(s.usedInLessons)} unit="lessons" />
      <SidebarStat label="In library since" value={s.inLibrarySince} />
      <SidebarStat label="Avg. mastery" value="62" unit="%" />
    </div>
  </Card>
);

export const SongAssignPanel = () => (
  <Card>
    <CardHeader eyebrow="Assign as homework" title="Quick assign" />
    <div style={{ padding: '0 24px 22px' }}>
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-4)',
            marginBottom: 8,
            fontFamily: 'var(--mono)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
          }}
        >
          To students
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STUDENTS.slice(0, 3).map((st) => (
            <span
              key={st.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px 4px 4px',
                background: 'var(--card)',
                border: '1px solid var(--rule)',
                borderRadius: 99,
                fontSize: 12,
              }}
            >
              <Avatar s={st} size={18} />
              {st.name.split(' ')[0]}
              <Icon d={LI.close} size={10} stroke="var(--ink-4)" />
            </span>
          ))}
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              border: '1px dashed var(--rule)',
              background: 'transparent',
              fontSize: 12,
              color: 'var(--ink-4)',
            }}
          >
            + Add
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              marginBottom: 4,
            }}
          >
            Due
          </div>
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid var(--rule)',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'var(--mono)',
            }}
          >
            Apr 30, 2026
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              marginBottom: 4,
            }}
          >
            Goal
          </div>
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid var(--rule)',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            Memorise intro
          </div>
        </div>
      </div>

      <div
        style={{
          ...btnPrimary,
          width: '100%',
          justifyContent: 'center',
          padding: '12px',
        }}
      >
        Assign to 3 students
      </div>
    </div>
  </Card>
);

export const SongStudentsList = () => (
  <Card>
    <CardHeader
      eyebrow="Currently learning"
      title="Students"
      action={
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>4</span>
      }
    />
    <div style={{ padding: '0 24px 22px' }}>
      {SONG_LEARNERS.map((row, i) => {
        const st = STUDENTS[row.studentIndex];
        if (!st) return null;
        const [first, last] = st.name.split(' ');
        return (
          <div
            key={st.id}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <Avatar s={st} size={22} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {first} {last ? `${last[0]}.` : ''}
              </span>
            </div>
            <StageStepper status={row.stage} size="sm" />
            <span
              style={{
                textAlign: 'right',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-4)',
              }}
            >
              {row.mins}m
            </span>
          </div>
        );
      })}
    </div>
  </Card>
);

export const SongRelated = () => (
  <Card>
    <CardHeader eyebrow="Similar level + style" title="Related" />
    <div
      style={{
        padding: '0 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {RELATED_SONGS.map((r, i) => (
        <div
          key={r.title}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: '6px 0',
            borderBottom: i < RELATED_SONGS.length - 1 ? '1px solid var(--rule-2)' : 'none',
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
            {r.songKey}
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
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
              }}
            >
              {r.author}
            </div>
          </div>
          <Icon d={LI.chev} size={12} stroke="var(--ink-4)" />
        </div>
      ))}
    </div>
  </Card>
);

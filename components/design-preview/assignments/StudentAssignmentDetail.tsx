import { Icon, I } from '../lib/icons';

import { AssignmentStatusPill, Card, CardHeader, ChordGrid, btnPrimary } from './primitives';
import { PRACTICE_LOG_LABELS, PRACTICE_LOG_MINUTES } from './data';
import type { Assignment, ChordName } from './types';

const PRACTICE_TARGET_MINUTES = 70;
const PRACTICE_TOTAL_MINUTES = PRACTICE_LOG_MINUTES.reduce((sum, m) => sum + m, 0);
const REFERENCE_CHORDS: ChordName[] = ['G', 'Em', 'C'];

const PracticeLog = () => (
  <Card>
    <CardHeader eyebrow="How you’re doing" title="Practice log" />
    <div style={{ padding: '0 24px 22px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginBottom: 14,
        }}
      >
        {PRACTICE_LOG_MINUTES.map((m, i) => (
          <div key={`${PRACTICE_LOG_LABELS[i]}-${i}`}>
            <div style={{ height: 60, display: 'flex', flexDirection: 'column-reverse' }}>
              <div
                style={{
                  height: `${Math.min(100, m * 3)}%`,
                  background: m === 0 ? 'var(--rule)' : 'var(--gold-2)',
                  borderRadius: '3px 3px 0 0',
                  minHeight: m === 0 ? 2 : undefined,
                }}
              />
            </div>
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
                marginTop: 4,
              }}
            >
              {PRACTICE_LOG_LABELS[i]}
            </div>
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-2)',
                fontWeight: 500,
              }}
            >
              {m}m
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
        <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
          {PRACTICE_TOTAL_MINUTES}m
        </strong>{' '}
        of {PRACTICE_TARGET_MINUTES}m target this week. Keep going.
      </div>
    </div>
  </Card>
);

const SubmitTake = () => (
  <Card>
    <CardHeader eyebrow="Submit your take" title="Add a recording or note" />
    <div style={{ padding: '0 24px 24px' }}>
      <div
        style={{
          padding: '24px',
          border: '2px dashed var(--rule)',
          borderRadius: 10,
          textAlign: 'center',
          background: 'var(--paper)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 12px',
            borderRadius: '50%',
            background: 'var(--gold-2)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <Icon d={I.mic} size={20} stroke="#fff" />
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 18,
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          Record audio
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>or drop a .wav / .mp3 / .mov here</div>
      </div>
      <textarea
        placeholder="Anything to tell Sarah about this take? (optional)"
        style={{
          marginTop: 12,
          width: '100%',
          minHeight: 72,
          padding: '10px 12px',
          border: '1px solid var(--rule)',
          borderRadius: 6,
          background: 'var(--paper)',
          fontFamily: 'var(--sans)',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />
      <div
        style={{
          ...btnPrimary,
          marginTop: 12,
          width: '100%',
          justifyContent: 'center',
          padding: '12px',
        }}
      >
        Submit assignment
      </div>
    </div>
  </Card>
);

const ReferenceChords = () => (
  <Card>
    <CardHeader eyebrow="Reference" title="Chord chart" />
    <div
      style={{
        padding: '0 24px 22px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      {REFERENCE_CHORDS.map((c) => (
        <div
          key={c}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 500 }}>{c}</div>
          <ChordGrid name={c} size={56} />
        </div>
      ))}
    </div>
  </Card>
);

const TeacherHint = () => (
  <Card>
    <CardHeader eyebrow="Tip from Sarah" title="Hint" />
    <div
      style={{
        padding: '0 24px 22px',
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--ink-2)',
        fontStyle: 'italic',
        fontFamily: 'var(--serif)',
      }}
    >
      “Keep the thumb steady — the bass should never speed up when the melody gets tricky. If you
      can, practice with just the bass note + open strings first, then add the melody.”
    </div>
  </Card>
);

export const StudentAssignmentDetail = ({ cur }: { cur: Assignment }) => (
  <div style={{ overflow: 'auto', padding: '28px 36px 60px' }}>
    <div style={{ marginBottom: 18 }}>
      <AssignmentStatusPill status={cur.status} />
      <h2
        style={{
          margin: '10px 0 4px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 36,
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
        }}
      >
        {cur.song}
      </h2>
      <div
        style={{
          display: 'flex',
          gap: 14,
          fontSize: 12,
          fontFamily: 'var(--mono)',
          color: 'var(--ink-4)',
        }}
      >
        <span>Assigned by Sarah Chen</span>
        <span>·</span>
        <span style={{ color: cur.status === 'overdue' ? 'var(--danger)' : 'var(--ink-3)' }}>
          Due {cur.due}
        </span>
        <span>·</span>
        <span>10 min/day target</span>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <CardHeader eyebrow="What to do" title="Task" />
          <div
            style={{
              padding: '0 24px 22px',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--ink-2)',
            }}
          >
            {cur.task}
          </div>
        </Card>
        <PracticeLog />
        <SubmitTake />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ReferenceChords />
        <TeacherHint />
      </div>
    </div>
  </div>
);

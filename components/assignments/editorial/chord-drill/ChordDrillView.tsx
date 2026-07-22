import Link from 'next/link';

import { getVoicingById } from '@/lib/music-theory/chord-voicings';
import type { ChordDrill, ChordDrillResult } from '@/schemas/AssignmentSchema';

type Props = {
  assignmentId: string;
  drill: ChordDrill;
  result: ChordDrillResult | null;
  /** Owning student (or manager) — sees the "start drill" action. */
  canAct: boolean;
};

const startLink: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 12,
  padding: '7px 14px',
  borderRadius: 6,
  background: 'var(--gold-2)',
  color: 'var(--ivory)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '.1em',
  textDecoration: 'none',
};

const formatDay = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Detail-view chord drill (ASG-4): the chord set, the student's start action, and the captured score. */
export const ChordDrillView = ({ assignmentId, drill, result, canAct }: Props) => {
  const names = drill.chord_ids.map((id) => getVoicingById(id)?.name ?? id);

  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color: 'var(--ink-4)',
          marginBottom: 6,
        }}
      >
        Chord drill · {names.length} chord{names.length === 1 ? '' : 's'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {names.map((name, i) => (
          <span
            key={`${name}-${i}`}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid var(--rule)',
              color: 'var(--ink-2)',
            }}
          >
            {name}
          </span>
        ))}
      </div>

      {result ? (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-2)' }}>
          Scored{' '}
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {result.score}/{result.total}
          </strong>{' '}
          <span style={{ color: 'var(--ink-4)' }}>· {formatDay(result.completed_at)}</span>
        </div>
      ) : canAct ? (
        <Link href={`/dashboard/skills/chord-quiz?drill=${assignmentId}`} style={startLink}>
          Start chord drill →
        </Link>
      ) : (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-4)' }}>
          Awaiting the student&rsquo;s result.
        </div>
      )}
    </div>
  );
};

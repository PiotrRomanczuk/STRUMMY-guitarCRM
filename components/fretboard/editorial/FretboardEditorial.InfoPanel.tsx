import {
  formatNote,
  getSemitoneDistance,
  getIntervalName,
  SCALE_DEFINITIONS,
  CHORD_DEFINITIONS,
  type NoteName,
} from '@/lib/music-theory';

import { type FretMode } from './fretboard.helpers';
import { sectionLabel } from './fretboard.styles';

interface InfoPanelProps {
  fbKey: NoteName;
  mode: FretMode;
  scaleKey: string;
  chordKey: string;
  activeNotes: NoteName[];
  useFlats: boolean;
}

export const FretboardInfoPanel = ({
  fbKey,
  mode,
  scaleKey,
  chordKey,
  activeNotes,
  useFlats,
}: InfoPanelProps) => {
  const description =
    mode === 'scale'
      ? SCALE_DEFINITIONS[scaleKey]?.description
      : mode === 'chord'
        ? CHORD_DEFINITIONS[chordKey]?.description
        : 'Every chromatic note across the neck.';

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionLabel}>{mode === 'chord' ? 'Chord tones' : 'Scale notes'}</div>
        <div
          data-testid="fb-info-notes"
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
          }}
        >
          {activeNotes.map((note, i) => (
            <NoteChip
              key={`${note}-${i}`}
              note={note}
              isRoot={note === fbKey}
              interval={getIntervalName(getSemitoneDistance(fbKey, note))}
              useFlats={useFlats}
            />
          ))}
          {activeNotes.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 16,
                color: 'var(--ink-4)',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              No notes selected.
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={sectionLabel}>About</div>
        <p
          data-testid="fb-info-description"
          style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}
        >
          {description}
        </p>
      </div>
    </aside>
  );
};

const NoteChip = ({
  note,
  isRoot,
  interval,
  useFlats,
}: {
  note: NoteName;
  isRoot: boolean;
  interval: string;
  useFlats: boolean;
}) => (
  <div
    data-testid="fb-note-chip"
    style={{
      padding: '10px 4px',
      background: isRoot ? 'var(--gold)' : 'var(--card)',
      border: isRoot ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
      borderRadius: 6,
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        letterSpacing: '.08em',
        color: isRoot ? 'rgba(255,255,255,.75)' : 'var(--ink-4)',
      }}
    >
      {interval}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 20,
        fontWeight: 500,
        marginTop: 2,
        color: isRoot ? '#fff' : 'var(--ink)',
      }}
    >
      {formatNote(note, useFlats)}
    </div>
  </div>
);

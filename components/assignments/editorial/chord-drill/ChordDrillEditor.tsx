'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { CHORD_VOICINGS } from '@/lib/music-theory/chord-voicings';

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

const chip = (on: boolean): React.CSSProperties => ({
  border: `1px solid ${on ? 'var(--gold-2)' : 'var(--rule)'}`,
  background: on ? 'var(--gold-2)' : 'var(--card)',
  color: on ? 'var(--ivory)' : 'var(--ink-3)',
  borderRadius: 999,
  padding: '5px 12px',
  fontSize: 12,
  fontFamily: 'var(--mono)',
  cursor: 'pointer',
});

/** Teacher-facing chord-drill authoring (ASG-4): toggle which chords to quiz. */
export const ChordDrillEditor = ({ selected, onChange, disabled }: Props) => {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div style={s.field}>
      <label style={s.label}>Chord drill (optional)</label>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--ink-4)' }}>
        Pick chords for the student to identify. Their score comes back on this assignment.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CHORD_VOICINGS.map((v) => {
          const on = selected.includes(v.id);
          return (
            <button
              type="button"
              key={v.id}
              onClick={() => toggle(v.id)}
              disabled={disabled}
              aria-pressed={on}
              style={chip(on)}
            >
              {v.name}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
          {selected.length} chord{selected.length === 1 ? '' : 's'} selected
        </div>
      )}
    </div>
  );
};

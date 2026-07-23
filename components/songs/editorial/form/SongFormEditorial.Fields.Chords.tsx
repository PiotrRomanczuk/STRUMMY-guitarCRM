'use client';

import { useState } from 'react';
import { ALL_CHORD_NAMES, CHORD_VOICINGS } from '@/lib/music-theory/chord-voicings';
import { ChordDiagram } from '@/components/skills/ChordQuiz/ChordDiagram';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--ink)',
} as const;

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  borderRadius: 10,
  padding: '6px 8px 6px 10px',
  fontSize: 12,
  fontFamily: 'var(--mono)',
};

/** Chord name text → the diagram to preview, when the app recognizes it. */
export const voicingForChordName = (name: string) =>
  CHORD_VOICINGS.find((v) => v.name.toLowerCase() === name.trim().toLowerCase());

/** Parses the DB's comma-separated `chords` string into a chip list. */
export const parseChordsString = (chords: string): string[] =>
  chords
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

type Props = {
  chords: string[];
  onChange: (chords: string[]) => void;
};

/** Chip-based chord picker: type a name (autocompletes against the app's
 * curated voicing set), add it, see a real fretboard diagram inline. Falls
 * back to a plain text chip for names outside the curated set. */
export const SongFormEditorialFieldsChords = ({ chords, onChange }: Props) => {
  const [draft, setDraft] = useState('');

  const addChord = () => {
    const name = draft.trim();
    if (!name || chords.includes(name)) return;
    onChange([...chords, name]);
    setDraft('');
  };
  const removeChord = (name: string) => onChange(chords.filter((c) => c !== name));

  return (
    <div>
      <datalist id="song-chord-suggestions">
        {ALL_CHORD_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          list="song-chord-suggestions"
          value={draft}
          placeholder="e.g. Bm"
          style={inputStyle}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addChord();
            }
          }}
        />
        <button
          type="button"
          onClick={addChord}
          style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>
      {chords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {chords.map((name) => {
            const voicing = voicingForChordName(name);
            return (
              <div key={name} style={chipStyle}>
                {voicing ? <ChordDiagram voicing={voicing} size="sm" hideName /> : null}
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeChord(name)}
                  aria-label={`Remove ${name}`}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--ink-4)',
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

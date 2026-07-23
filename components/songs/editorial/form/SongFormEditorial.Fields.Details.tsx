import { Field } from './Field';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];

const KEYS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bm',
] as const;

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
};
const monoInputStyle = { ...inputStyle, fontFamily: 'var(--mono)', fontSize: 13 };

const toNumberOrNull = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

type Props = {
  level: Level;
  key_: string;
  capoFret: number | null;
  tempo: number | null;
  chords: string;
  levelError?: string;
  keyError?: string;
  capoError?: string;
  tempoError?: string;
  chordsError?: string;
  onLevel: (v: Level) => void;
  onKey: (v: string) => void;
  onCapoFret: (v: number | null) => void;
  onTempo: (v: number | null) => void;
  onChords: (v: string) => void;
};

/** Section II — level, key, capo, tempo, chords. */
export const SongFormEditorialFieldsDetails = ({
  level,
  key_,
  capoFret,
  tempo,
  chords,
  levelError,
  keyError,
  capoError,
  tempoError,
  chordsError,
  onLevel,
  onKey,
  onCapoFret,
  onTempo,
  onChords,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="Level" error={levelError} fieldId="level">
        <select
          name="level"
          required
          style={inputStyle}
          value={level}
          onChange={(e) => onLevel(e.target.value as Level)}
          aria-describedby={levelError ? 'error-level' : undefined}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Key" error={keyError} fieldId="key">
        <select
          name="key"
          required
          style={inputStyle}
          value={key_}
          onChange={(e) => onKey(e.target.value)}
          aria-describedby={keyError ? 'error-key' : undefined}
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="Capo (fret)" error={capoError} optional>
        <input
          name="capo_fret"
          type="number"
          min={0}
          max={20}
          placeholder="0"
          style={monoInputStyle}
          value={capoFret ?? ''}
          onChange={(e) => onCapoFret(toNumberOrNull(e.target.value))}
        />
      </Field>
      <Field label="Tempo (BPM)" error={tempoError} optional>
        <input
          name="tempo"
          type="number"
          min={0}
          max={300}
          placeholder="120"
          style={monoInputStyle}
          value={tempo ?? ''}
          onChange={(e) => onTempo(toNumberOrNull(e.target.value))}
        />
      </Field>
    </div>
    <Field label="Chords" error={chordsError} optional>
      <input
        name="chords"
        maxLength={500}
        placeholder="C, G, Am, F"
        style={monoInputStyle}
        value={chords}
        onChange={(e) => onChords(e.target.value)}
      />
    </Field>
  </div>
);

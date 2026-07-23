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

const stepperBtnStyle: React.CSSProperties = {
  width: 32,
  height: 38,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink)',
  fontSize: 16,
  cursor: 'pointer',
  flexShrink: 0,
};

const levelBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '9px 8px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: active ? 'var(--ink)' : 'var(--card)',
  color: active ? 'var(--paper)' : 'var(--ink-3)',
  fontSize: 13,
  fontWeight: active ? 500 : 400,
  cursor: 'pointer',
  textTransform: 'capitalize',
});

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
  timeSignature: number | null;
  releaseYear: number | null;
  levelError?: string;
  keyError?: string;
  onLevel: (v: Level) => void;
  onKey: (v: string) => void;
  onCapoFret: (v: number | null) => void;
  onTempo: (v: number | null) => void;
  onTimeSignature: (v: number | null) => void;
  onReleaseYear: (v: number | null) => void;
};

/** Section II — difficulty (button group), key, capo (stepper), tempo, meter, year. */
export const SongFormEditorialFieldsDetails = ({
  level,
  key_,
  capoFret,
  tempo,
  timeSignature,
  releaseYear,
  levelError,
  keyError,
  onLevel,
  onKey,
  onCapoFret,
  onTempo,
  onTimeSignature,
  onReleaseYear,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="Difficulty" error={levelError} fieldId="level">
        <input type="hidden" name="level" value={level} />
        <div style={{ display: 'flex', gap: 6 }}>
          {LEVELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => onLevel(l)}
              aria-pressed={level === l}
              style={levelBtnStyle(level === l)}
            >
              {l}
            </button>
          ))}
        </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      <Field label="Capo (fret)" optional>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => onCapoFret(Math.max(0, (capoFret ?? 0) - 1))}
            style={stepperBtnStyle}
            aria-label="Decrease capo fret"
          >
            −
          </button>
          <input
            name="capo_fret"
            type="number"
            min={0}
            max={20}
            placeholder="0"
            style={{ ...monoInputStyle, textAlign: 'center' }}
            value={capoFret ?? ''}
            onChange={(e) => onCapoFret(toNumberOrNull(e.target.value))}
          />
          <button
            type="button"
            onClick={() => onCapoFret(Math.min(20, (capoFret ?? 0) + 1))}
            style={stepperBtnStyle}
            aria-label="Increase capo fret"
          >
            +
          </button>
        </div>
      </Field>
      <Field label="Tempo (BPM)" optional>
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
      <Field label="Time sig." optional>
        <input
          name="time_signature"
          type="number"
          min={1}
          max={16}
          placeholder="4"
          style={monoInputStyle}
          value={timeSignature ?? ''}
          onChange={(e) => onTimeSignature(toNumberOrNull(e.target.value))}
        />
      </Field>
    </div>
    <Field label="Release year" optional>
      <input
        name="release_year"
        type="number"
        min={1500}
        max={2100}
        placeholder="2024"
        style={{ ...monoInputStyle, maxWidth: 160 }}
        value={releaseYear ?? ''}
        onChange={(e) => onReleaseYear(toNumberOrNull(e.target.value))}
      />
    </Field>
  </div>
);

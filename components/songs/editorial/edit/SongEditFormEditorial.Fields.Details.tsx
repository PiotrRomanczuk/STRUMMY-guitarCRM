const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
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
} as const;
const monoStyle = { ...inputStyle, fontFamily: 'var(--mono)', fontSize: 13 } as const;

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

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      {children}
    </span>
    {optional && (
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--ink-5)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}
      >
        Optional
      </span>
    )}
  </div>
);

type Props = {
  level: string;
  keyName: string;
  capoFret: number | null;
  tempo: number | null;
  timeSignature: number | null;
  releaseYear: number | null;
  onLevel: (v: string) => void;
  onKey: (v: string) => void;
  onCapoFret: (v: number | null) => void;
  onTempo: (v: number | null) => void;
  onTimeSignature: (v: number | null) => void;
  onReleaseYear: (v: number | null) => void;
};

/** Difficulty (button group), key, capo (stepper), tempo, meter, year — all controlled. */
export const SongEditFormEditorialFieldsDetails = ({
  level,
  keyName,
  capoFret,
  tempo,
  timeSignature,
  releaseYear,
  onLevel,
  onKey,
  onCapoFret,
  onTempo,
  onTimeSignature,
  onReleaseYear,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <Label>Difficulty</Label>
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
      </div>
      <div>
        <Label>Key</Label>
        <select
          name="key"
          required
          value={keyName}
          onChange={(e) => onKey(e.target.value)}
          style={inputStyle}
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      <div>
        <Label optional>Capo (fret)</Label>
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
            style={{ ...monoStyle, textAlign: 'center' }}
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
      </div>
      <div>
        <Label optional>Tempo (BPM)</Label>
        <input
          name="tempo"
          type="number"
          min={0}
          max={300}
          style={monoStyle}
          value={tempo ?? ''}
          onChange={(e) => onTempo(toNumberOrNull(e.target.value))}
        />
      </div>
      <div>
        <Label optional>Time sig.</Label>
        <input
          name="time_signature"
          type="number"
          min={1}
          max={16}
          style={monoStyle}
          value={timeSignature ?? ''}
          onChange={(e) => onTimeSignature(toNumberOrNull(e.target.value))}
        />
      </div>
    </div>
    <div>
      <Label optional>Release year</Label>
      <input
        name="release_year"
        type="number"
        min={1500}
        max={2100}
        style={{ ...monoStyle, maxWidth: 160 }}
        value={releaseYear ?? ''}
        onChange={(e) => onReleaseYear(toNumberOrNull(e.target.value))}
      />
    </div>
  </div>
);

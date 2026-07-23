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
  chords: string | null;
  onLevel: (v: string) => void;
  onKey: (v: string) => void;
};

/** Section II — level, key (controlled, for the preview) + capo/tempo/chords (uncontrolled). */
export const SongEditFormEditorialFieldsDetails = ({
  level,
  keyName,
  capoFret,
  tempo,
  chords,
  onLevel,
  onKey,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <Label>Level</Label>
        <select
          name="level"
          required
          value={level}
          onChange={(e) => onLevel(e.target.value)}
          style={inputStyle}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <Label optional>Capo (fret)</Label>
        <input
          name="capo_fret"
          type="number"
          min={0}
          max={20}
          defaultValue={capoFret ?? ''}
          style={monoStyle}
        />
      </div>
      <div>
        <Label optional>Tempo (BPM)</Label>
        <input
          name="tempo"
          type="number"
          min={0}
          max={300}
          defaultValue={tempo ?? ''}
          style={monoStyle}
        />
      </div>
    </div>
    <div>
      <Label optional>Chords</Label>
      <input
        name="chords"
        maxLength={500}
        defaultValue={chords ?? ''}
        placeholder="C, G, Am, F"
        style={monoStyle}
      />
    </div>
  </div>
);

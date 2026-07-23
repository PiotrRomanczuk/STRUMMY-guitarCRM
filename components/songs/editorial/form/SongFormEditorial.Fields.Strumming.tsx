'use client';

type Beat = 'D' | 'U' | '-';

const CYCLE: Record<Beat, Beat> = { D: 'U', U: '-', '-': 'D' };
const MAX_BEATS = 16;

/** Parse the DB's space-separated `strumming_pattern` string into beats. */
export const parseStrummingPattern = (value: string): Beat[] =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t): Beat => (t === 'D' || t === 'U' ? t : '-'))
    .slice(0, MAX_BEATS);

const beatLabel = (beat: Beat): string => (beat === 'D' ? 'down' : beat === 'U' ? 'up' : 'rest');

const beatBoxStyle = (beat: Beat): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 6,
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: beat === 'D' ? 'var(--ink)' : beat === 'U' ? 'var(--gold-2)' : 'transparent',
  color: beat === '-' ? 'var(--ink-4)' : '#fff',
  border: beat === '-' ? '1px dashed var(--rule)' : 'none',
});

const stepBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 6,
  cursor: disabled ? 'default' : 'pointer',
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink-3)',
  fontSize: 14,
  lineHeight: 1,
  opacity: disabled ? 0.4 : 1,
});

type Props = { value: string; onChange: (v: string) => void };

/** Visual strumming-pattern editor: click a beat to cycle Down → Up → rest;
 * +/− add or remove beats. Serialises to the space-separated `strumming_pattern`
 * string (e.g. "D D U - U D"). */
export const SongFormEditorialFieldsStrumming = ({ value, onChange }: Props) => {
  const beats = parseStrummingPattern(value);
  const commit = (next: Beat[]) => onChange(next.join(' '));
  const cycle = (index: number) => commit(beats.map((b, i) => (i === index ? CYCLE[b] : b)));
  const add = () => commit([...beats, 'D' as Beat].slice(0, MAX_BEATS));
  const removeLast = () => commit(beats.slice(0, -1));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        padding: '8px 12px',
        border: '1px solid var(--rule)',
        borderRadius: 6,
        background: 'var(--paper)',
      }}
    >
      {beats.length === 0 && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-4)' }}>
          No pattern yet — add beats →
        </span>
      )}
      {beats.map((beat, i) => (
        <button
          type="button"
          key={i}
          onClick={() => cycle(i)}
          style={beatBoxStyle(beat)}
          aria-label={`Beat ${i + 1}: ${beatLabel(beat)} (click to change)`}
        >
          {beat === '-' ? '·' : beat}
        </button>
      ))}
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        <button
          type="button"
          onClick={removeLast}
          disabled={beats.length === 0}
          style={stepBtnStyle(beats.length === 0)}
          aria-label="Remove last beat"
        >
          −
        </button>
        <button
          type="button"
          onClick={add}
          disabled={beats.length >= MAX_BEATS}
          style={stepBtnStyle(beats.length >= MAX_BEATS)}
          aria-label="Add beat"
        >
          +
        </button>
      </div>
    </div>
  );
};

const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'] as const;
const FRET_COUNT = 12;
const STRING_NOTES: Record<string, number> = { E: 4, B: 11, G: 7, D: 2, A: 9 };
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const noteAt = (stringNote: string, fret: number): string => {
  const open = STRING_NOTES[stringNote] ?? 0;
  return CHROMATIC[(open + fret) % 12];
};

const FRET_MARKERS = new Set([3, 5, 7, 9]);
const DOUBLE_MARKER = 12;

export const FretboardEditorial = () => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '32px 32px 64px',
    }}
  >
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.16em',
          }}
        >
          Theory
        </div>
        <h1
          style={{
            margin: '4px 0 8px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 44,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Fretboard
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          A reference map of the first 12 frets across all six strings.
        </p>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--rule)',
          borderRadius: 14,
          padding: '24px 28px',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `48px repeat(${FRET_COUNT}, minmax(60px, 1fr))`,
            gap: 0,
            alignItems: 'center',
          }}
        >
          <div />
          {Array.from({ length: FRET_COUNT }).map((_, i) => (
            <div
              key={`fret-num-${i}`}
              style={{
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
                paddingBottom: 8,
              }}
            >
              {i + 1}
            </div>
          ))}
          {STRINGS.map((str, sIdx) => (
            <Row key={`str-${sIdx}`} str={str} sIdx={sIdx} />
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--ink-4)',
          fontStyle: 'italic',
          fontFamily: 'var(--serif)',
        }}
      >
        Click-through note exploration, scale overlays, and chord shapes coming next.
      </div>
    </div>
  </div>
);

const Row = ({ str, sIdx }: { str: string; sIdx: number }) => (
  <>
    <div
      style={{
        textAlign: 'right',
        paddingRight: 14,
        fontFamily: 'var(--serif)',
        fontSize: 18,
        color: 'var(--ink-3)',
        fontStyle: 'italic',
      }}
    >
      {str}
    </div>
    {Array.from({ length: FRET_COUNT }).map((_, fIdx) => {
      const fret = fIdx + 1;
      const note = noteAt(str, fret);
      const isMarker = FRET_MARKERS.has(fret) || fret === DOUBLE_MARKER;
      const tinted = isMarker;
      return (
        <div
          key={`cell-${sIdx}-${fIdx}`}
          style={{
            position: 'relative',
            height: 44,
            display: 'grid',
            placeItems: 'center',
            background: tinted ? 'rgba(200,149,35,.06)' : 'transparent',
            borderRight: '1px solid var(--rule)',
            borderBottom: sIdx < STRINGS.length - 1 ? '1px solid var(--rule)' : 'none',
            borderLeft: fIdx === 0 ? '2px solid var(--ink-2)' : 'none',
          }}
        >
          {sIdx === 2 && fret === DOUBLE_MARKER && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--gold-2)',
                opacity: 0.18,
                fontFamily: 'var(--serif)',
                fontSize: 32,
              }}
            >
              ●●
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: note.includes('#') ? 400 : 500,
              color: note.includes('#') ? 'var(--ink-4)' : 'var(--ink-2)',
            }}
          >
            {note}
          </span>
        </div>
      );
    })}
  </>
);

import { type ChordVoicing } from '@/lib/music-theory/chord-voicings';

type Size = 'sm' | 'md' | 'lg';

interface ChordDiagramProps {
  voicing: ChordVoicing;
  size?: Size;
  /** When true, hides the chord name above the diagram (used during quiz). */
  hideName?: boolean;
}

const SIZE_PX: Record<Size, number> = { sm: 110, md: 160, lg: 220 };
const FRETS_VISIBLE = 5;
const STRINGS = 6;

/**
 * Pure SVG chord-box diagram. No client state, no interactivity.
 * Strings are drawn left (low E, index 0) to right (high e, index 5).
 */
export function ChordDiagram({ voicing, size = 'md', hideName = false }: ChordDiagramProps) {
  const width = SIZE_PX[size];
  const height = Math.round(width * 1.25);

  // Layout
  const padX = width * 0.12;
  const padTop = height * 0.16;
  const padBottom = height * 0.08;
  const gridW = width - padX * 2;
  const gridH = height - padTop - padBottom;
  const stringGap = gridW / (STRINGS - 1);
  const fretGap = gridH / FRETS_VISIBLE;
  const dotR = stringGap * 0.32;

  const stringX = (i: number) => padX + i * stringGap;
  const fretY = (n: number) => padTop + n * fretGap;

  const baseFret = voicing.baseFret;

  return (
    <div className="flex flex-col items-center gap-1">
      {!hideName && (
        <div className="text-base font-semibold tracking-tight text-foreground">{voicing.name}</div>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${voicing.name} chord diagram`}
        className="block"
      >
        {/* Nut (thicker top line if showing from open position) */}
        {baseFret === 1 && (
          <rect
            x={stringX(0) - 1}
            y={fretY(0) - 3}
            width={stringGap * (STRINGS - 1) + 2}
            height={4}
            className="fill-foreground"
          />
        )}

        {/* Fret lines */}
        {Array.from({ length: FRETS_VISIBLE + 1 }, (_, n) => (
          <line
            key={`fret-${n}`}
            x1={stringX(0)}
            y1={fretY(n)}
            x2={stringX(STRINGS - 1)}
            y2={fretY(n)}
            className="stroke-muted-foreground/60"
            strokeWidth={1}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={stringX(i)}
            y1={fretY(0)}
            x2={stringX(i)}
            y2={fretY(FRETS_VISIBLE)}
            className="stroke-muted-foreground/70"
            strokeWidth={1}
          />
        ))}

        {/* Base-fret label (e.g. "4fr") for chords that don't start at the nut */}
        {baseFret > 1 && (
          <text
            x={stringX(STRINGS - 1) + 6}
            y={fretY(0) + fretGap * 0.6}
            className="fill-muted-foreground"
            fontSize={Math.round(width * 0.09)}
          >
            {baseFret}fr
          </text>
        )}

        {/* Mute / open markers above the nut */}
        {voicing.frets.map((fret, i) => {
          const cx = stringX(i);
          const cy = padTop - dotR * 1.2;
          if (fret === null) {
            const r = dotR * 0.7;
            return (
              <g key={`mute-${i}`}>
                <line
                  x1={cx - r}
                  y1={cy - r}
                  x2={cx + r}
                  y2={cy + r}
                  className="stroke-muted-foreground"
                  strokeWidth={1.5}
                />
                <line
                  x1={cx + r}
                  y1={cy - r}
                  x2={cx - r}
                  y2={cy + r}
                  className="stroke-muted-foreground"
                  strokeWidth={1.5}
                />
              </g>
            );
          }
          if (fret === 0) {
            return (
              <circle
                key={`open-${i}`}
                cx={cx}
                cy={cy}
                r={dotR * 0.65}
                className="fill-none stroke-foreground"
                strokeWidth={1.5}
              />
            );
          }
          return null;
        })}

        {/* Barre */}
        {voicing.barre &&
          (() => {
            const visualFret = voicing.barre.fret - baseFret + 1;
            if (visualFret < 1 || visualFret > FRETS_VISIBLE) return null;
            const y = fretY(visualFret) - fretGap / 2;
            const x1 = stringX(voicing.barre.fromString);
            const x2 = stringX(voicing.barre.toString);
            return (
              <rect
                key="barre"
                x={Math.min(x1, x2) - dotR}
                y={y - dotR}
                width={Math.abs(x2 - x1) + dotR * 2}
                height={dotR * 2}
                rx={dotR}
                className="fill-foreground"
              />
            );
          })()}

        {/* Finger dots */}
        {voicing.frets.map((fret, i) => {
          if (fret === null || fret === 0) return null;
          const visualFret = fret - baseFret + 1;
          if (visualFret < 1 || visualFret > FRETS_VISIBLE) return null;
          const cx = stringX(i);
          const cy = fretY(visualFret) - fretGap / 2;
          const finger = voicing.fingers[i];
          return (
            <g key={`dot-${i}`}>
              <circle cx={cx} cy={cy} r={dotR} className="fill-foreground" />
              {finger != null && finger > 0 && (
                <text
                  x={cx}
                  y={cy + dotR * 0.4}
                  textAnchor="middle"
                  className="fill-background"
                  fontSize={dotR * 1.3}
                  fontWeight={600}
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

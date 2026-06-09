// Local re-port of ChordGrid from /tmp/strummy-design/.../primitives.jsx.
// The foundation does not export a full chord-diagram primitive yet, so it
// lives inside this section per the agent brief.

type ChordShape = {
  frets: number[];
  open: number[];
  muted: number[];
  start: number;
};

const CHORD_SHAPES: Record<string, ChordShape> = {
  G: { frets: [3, 2, 0, 0, 0, 3], open: [2, 3, 4], muted: [], start: 1 },
  D: { frets: [0, 0, 0, 2, 3, 2], open: [], muted: [0, 1], start: 1 },
  Em: { frets: [0, 2, 2, 0, 0, 0], open: [0, 3, 4, 5], muted: [], start: 1 },
  C: { frets: [0, 3, 2, 0, 1, 0], open: [0, 3, 5], muted: [], start: 1 },
  Am: { frets: [0, 0, 2, 2, 1, 0], open: [0, 1, 5], muted: [], start: 1 },
  F: { frets: [1, 3, 3, 2, 1, 1], open: [], muted: [], start: 1 },
  // Hotel California chords (approximated shapes; visual-only in preview).
  Bm: { frets: [2, 2, 4, 4, 3, 2], open: [], muted: [], start: 2 },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], open: [], muted: [], start: 2 },
  A: { frets: [0, 0, 2, 2, 2, 0], open: [0, 1, 5], muted: [], start: 1 },
  E: { frets: [0, 2, 2, 1, 0, 0], open: [0, 4, 5], muted: [], start: 1 },
};

export const ChordGrid = ({
  name,
  size = 48,
  color = 'var(--ink-2)',
}: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const shape = CHORD_SHAPES[name] ?? CHORD_SHAPES.G;
  const w = size;
  const h = size * 1.28;
  const padL = size * 0.18;
  const padR = size * 0.12;
  const padT = size * 0.28;
  const padB = size * 0.14;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const strings = 6;
  const frets = 4;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <text
        x={w / 2}
        y={padT - 10}
        textAnchor="middle"
        fontFamily="var(--serif)"
        fontSize={size * 0.28}
        fill={color}
        fontWeight="500"
      >
        {name}
      </text>
      <rect x={padL} y={padT} width={innerW} height={shape.start === 1 ? 2.5 : 1} fill={color} />
      {shape.start > 1 && (
        <text
          x={padL - 4}
          y={padT + (innerH / frets) * 0.6 + 3}
          textAnchor="end"
          fontSize={size * 0.18}
          fontFamily="var(--mono)"
          fill={color}
        >
          {shape.start}fr
        </text>
      )}
      {Array.from({ length: strings }).map((_, i) => (
        <line
          key={`s${i}`}
          x1={padL + (innerW * i) / (strings - 1)}
          y1={padT}
          x2={padL + (innerW * i) / (strings - 1)}
          y2={padT + innerH}
          stroke={color}
          strokeWidth="0.8"
          opacity=".55"
        />
      ))}
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line
          key={`f${i}`}
          x1={padL}
          y1={padT + (innerH * i) / frets}
          x2={padL + innerW}
          y2={padT + (innerH * i) / frets}
          stroke={color}
          strokeWidth="0.8"
          opacity=".55"
        />
      ))}
      {shape.frets.map((f, i) => {
        if (f === 0) return null;
        const stringX = padL + (innerW * i) / (strings - 1);
        const fretOffset = shape.start === 1 ? f : f - shape.start + 1;
        const y = padT + (innerH * (fretOffset - 0.5)) / frets;
        return <circle key={i} cx={stringX} cy={y} r={size * 0.08} fill={color} />;
      })}
      {shape.open.map((i) => (
        <circle
          key={`o${i}`}
          cx={padL + (innerW * i) / (strings - 1)}
          cy={padT - 5}
          r={size * 0.06}
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
};

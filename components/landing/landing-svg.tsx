'use client';

// ── SVG Primitives for landing page ─────────────────────────

export function StaffLines({
  width = '100%',
  height = 40,
  color = 'var(--l-rule)',
  count = 5,
}: {
  width?: string | number;
  height?: number;
  color?: string;
  count?: number;
}) {
  return (
    <svg width={width} height={height} preserveAspectRatio="none" viewBox={`0 0 100 ${height}`}>
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1={(height * (i + 1)) / (count + 1)}
          x2="100"
          y2={(height * (i + 1)) / (count + 1)}
          stroke={color}
          strokeWidth={0.7}
        />
      ))}
    </svg>
  );
}

export function ChordGrid({
  name,
  size = 48,
  color = 'var(--l-ink-2)',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const SHAPES: Record<string, { frets: number[]; open: number[]; start: number }> = {
    G: { frets: [3, 2, 0, 0, 0, 3], open: [2, 3, 4], start: 1 },
    C: { frets: [0, 3, 2, 0, 1, 0], open: [0, 3, 5], start: 1 },
    Am: { frets: [0, 0, 2, 2, 1, 0], open: [0, 1, 5], start: 1 },
    Em: { frets: [0, 2, 2, 0, 0, 0], open: [0, 3, 4, 5], start: 1 },
    D: { frets: [0, 0, 0, 2, 3, 2], open: [2], start: 1 },
  };
  const shape = SHAPES[name] || SHAPES['G'];
  const w = size;
  const h = size * 1.28;
  const padL = size * 0.18;
  const padR = size * 0.12;
  const padT = size * 0.28;
  const innerW = w - padL - padR;
  const innerH = h - padT - size * 0.14;
  const strings = 6;
  const frets = 4;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <text
        x={w / 2}
        y={padT - 10}
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize={size * 0.28}
        fill={color}
        fontWeight="500"
      >
        {name}
      </text>
      <rect x={padL} y={padT} width={innerW} height={shape.start === 1 ? 2.5 : 1} fill={color} />
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
        return <circle key={`d${i}`} cx={stringX} cy={y} r={size * 0.08} fill={color} />;
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
}

export function FretboardSVG({
  frets = 12,
  width = '100%',
  height = 44,
  color = 'var(--l-ink-2)',
}: {
  frets?: number;
  width?: string | number;
  height?: number;
  color?: string;
}) {
  const strings = 6;
  return (
    <svg
      viewBox={`0 0 ${frets * 40} ${height}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
      style={{ display: 'block' }}
    >
      <rect
        x="0"
        y="2"
        width={frets * 40}
        height={height - 4}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity=".35"
      />
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line
          key={i}
          x1={i * 40}
          y1="2"
          x2={i * 40}
          y2={height - 2}
          stroke={color}
          strokeWidth={i === 0 ? 1.5 : 0.5}
          opacity={i === 0 ? 0.9 : 0.4}
        />
      ))}
      {Array.from({ length: strings }).map((_, i) => (
        <line
          key={`s${i}`}
          x1="0"
          y1={4 + ((height - 8) * i) / (strings - 1)}
          x2={frets * 40}
          y2={4 + ((height - 8) * i) / (strings - 1)}
          stroke={color}
          strokeWidth="0.5"
          opacity=".5"
        />
      ))}
      {[3, 5, 7, 9].map((f) => (
        <circle key={f} cx={f * 40 - 20} cy={height / 2} r="2" fill={color} opacity=".5" />
      ))}
      <circle cx={12 * 40 - 25} cy={height / 2 - 8} r="2" fill={color} opacity=".5" />
      <circle cx={12 * 40 - 15} cy={height / 2 + 8} r="2" fill={color} opacity=".5" />
    </svg>
  );
}

import type { CSSProperties, ReactNode } from 'react';

import type { AssignmentStatusKey, ChordName } from './types';
import { ASSIGNMENT_STATUS } from './data';

// Locally re-ported Card / CardHeader from prototype lesson-detail.jsx.
export const Card = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

export const CardHeader = ({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
}) => (
  <div
    style={{
      padding: '20px 24px 12px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}
  >
    <div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          fontWeight: 500,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          marginTop: 2,
        }}
      >
        {title}
      </div>
    </div>
    {action}
  </div>
);

// Locally re-ported btnPrimary from prototype lesson-list.jsx.
export const btnPrimary: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--ink)',
  color: 'var(--paper)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

// Extra LI icons not in the foundation `I` dictionary.
export const LI_EXTRA = {
  close: 'M18 6L6 18M6 6l12 12',
  plusSmall: 'M12 5v14M5 12h14',
} as const;

// Status pill specific to assignments (different colour map than the song pill).
export const AssignmentStatusPill = ({
  status,
  compact = false,
}: {
  status: AssignmentStatusKey;
  compact?: boolean;
}) => {
  const s = ASSIGNMENT_STATUS[status] || ASSIGNMENT_STATUS.open;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '2px 8px' : '3px 10px',
        borderRadius: 4,
        background: s.tint,
        color: s.color,
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        fontFamily: 'var(--mono)',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
};

// Locally re-ported ChordGrid from prototype primitives.jsx (not yet in foundation).
type ChordShape = { frets: number[]; open: number[]; muted: number[]; start: number };

const CHORD_SHAPES: Record<ChordName, ChordShape> = {
  Bm: { frets: [2, 2, 4, 4, 4, 2], open: [], muted: [], start: 2 },
  A: { frets: [0, 0, 2, 2, 2, 0], open: [0, 1, 5], muted: [], start: 1 },
  E: { frets: [0, 2, 2, 1, 0, 0], open: [0, 4, 5], muted: [], start: 1 },
  G: { frets: [3, 2, 0, 0, 0, 3], open: [2, 3, 4], muted: [], start: 1 },
  D: { frets: [0, 0, 0, 2, 3, 2], open: [2], muted: [0, 1], start: 1 },
  Em: { frets: [0, 2, 2, 0, 0, 0], open: [0, 3, 4, 5], muted: [], start: 1 },
  C: { frets: [0, 3, 2, 0, 1, 0], open: [0, 3, 5], muted: [], start: 1 },
  Am: { frets: [0, 0, 2, 2, 1, 0], open: [0, 1, 5], muted: [], start: 1 },
  F: { frets: [1, 3, 3, 2, 1, 1], open: [], muted: [], start: 1 },
};

export const ChordGrid = ({
  name,
  size = 48,
  color = 'var(--ink-2)',
}: {
  name: ChordName;
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

// Small label-above-control field used in the composer.
export const AsgField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
        marginBottom: 5,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

export const asgInput: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--ink)',
};

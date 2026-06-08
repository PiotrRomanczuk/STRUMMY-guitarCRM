import type { CSSProperties, ReactNode } from 'react';

// Local re-port of StaffLines from prototype primitives.jsx — foundation does not export it yet.
type StaffLinesProps = {
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
  count?: number;
};

export const StaffLines = ({
  width = '100%',
  height = 40,
  color = 'var(--rule)',
  strokeWidth = 0.7,
  count = 5,
}: StaffLinesProps) => {
  const numH = typeof height === 'number' ? height : 100;
  return (
    <svg width={width} height={height} preserveAspectRatio="none" viewBox={`0 0 100 ${numH}`}>
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1={(numH * (i + 1)) / (count + 1)}
          x2="100"
          y2={(numH * (i + 1)) / (count + 1)}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </svg>
  );
};

type AuthBgProps = {
  width: number;
  height: number;
  children: ReactNode;
};

export const AuthBg = ({ width, height, children }: AuthBgProps) => (
  <div
    style={{
      width,
      height,
      background: 'var(--ivory)',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      fontFamily: 'var(--sans)',
      color: 'var(--ink)',
      position: 'relative',
    }}
  >
    {/* faint staff lines decorative */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }}>
      <StaffLines width="100%" height={height} count={5} color="var(--rule-2)" />
    </div>
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
);

type AuthCardProps = {
  children: ReactNode;
  width?: number;
};

export const AuthCard = ({ children, width = 440 }: AuthCardProps) => (
  <div
    style={{
      width,
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 14,
      padding: '40px 36px',
      boxShadow: '0 24px 60px -28px rgba(26,22,19,.15)',
    }}
  >
    {/* brand */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.15)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 19c0-3 2-5 4-6s2-4 5-4 5 3 5 3-2 2-5 2-3 2-5 3-4 2-4 2z" />
        </svg>
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 21,
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        Strummy
      </div>
    </div>
    {children}
  </div>
);

export const authLabel: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

export const authInput: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--rule)',
  borderRadius: 8,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
  boxSizing: 'border-box',
};

export const authBtnSecondary: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink-2)',
  fontSize: 13,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontFamily: 'var(--sans)',
};

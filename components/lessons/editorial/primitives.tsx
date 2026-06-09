import type { CSSProperties, ReactNode } from 'react';

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const LessonStatusPill = ({ label, colour }: { label: string; colour: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 10px',
      borderRadius: 4,
      background: 'rgba(0,0,0,.03)',
      color: colour,
      fontSize: 11,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      fontFamily: 'var(--mono)',
    }}
  >
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: colour,
      }}
    />
    {label}
  </span>
);

export const StudentInitials = ({
  name,
  email,
  size = 32,
}: {
  name: string | null;
  email: string | null;
  size?: number;
}) => {
  const source = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0] ?? '?')[0];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
        color: 'var(--ink-2)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--serif)',
        fontSize: Math.round(size * 0.4),
        fontWeight: 500,
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

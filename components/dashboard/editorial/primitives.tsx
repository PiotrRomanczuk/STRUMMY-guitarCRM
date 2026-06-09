import type { CSSProperties, ReactNode } from 'react';

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 18,
      boxShadow: '0 1px 2px rgba(26,22,19,.04), 0 10px 40px -20px rgba(26,22,19,.08)',
      overflow: 'hidden',
      ...style,
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
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) => (
  <div
    style={{
      padding: '20px 24px 12px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--rule)',
    }}
  >
    <div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--gold-2)',
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
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          marginTop: 2,
        }}
      >
        {title}
      </div>
    </div>
    {action}
  </div>
);

export const ComingSoonBody = ({ note }: { note: string }) => (
  <div
    style={{
      padding: '22px 24px 24px',
      fontFamily: 'var(--serif)',
      fontSize: 14,
      fontStyle: 'italic',
      color: 'var(--ink-4)',
      lineHeight: 1.5,
    }}
  >
    {note}
  </div>
);

export const StudentInitials = ({
  name,
  email,
  size = 36,
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

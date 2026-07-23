import type { ReactNode } from 'react';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED: 'var(--info)',
  IN_PROGRESS: 'var(--gold-2)',
  COMPLETED: 'var(--success)',
  CANCELLED: 'var(--ink-4)',
};

export const lessonStatusLabel = (s: string): string =>
  STATUS_LABELS[s] ?? STATUS_LABELS[s.toUpperCase()] ?? s;
export const lessonStatusColour = (s: string): string =>
  STATUS_COLOURS[s] ?? STATUS_COLOURS[s.toUpperCase()] ?? 'var(--ink-4)';

export const formatLong = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

export const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const Card = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
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
      padding: '20px 24px 14px',
      borderBottom: '1px solid var(--rule)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
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

export const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'start', gap: 12 }}>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
        paddingTop: 2,
      }}
    >
      {label}
    </div>
    <div>{children}</div>
  </div>
);

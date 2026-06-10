import type { CSSProperties, ReactNode } from 'react';

import { Icon } from '../lib/icons';
import { SONG_STATUS } from '../primitives/StatusPill';

import { formatLessonDate } from './data';
import type { LessonStatus } from './types';
import type { SongStatusKey } from '../lib/types';

// ─── Extra icons not in the foundation `I` dictionary ─────────────
export const LI = {
  email: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2L12 13 2 6',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  plusSmall: 'M12 5v14M5 12h14',
  live: 'M6 4l14 8-14 8z',
  check2: 'M5 12l5 5L20 7',
  chev: 'M9 6l6 6-6 6',
};

// ─── Button styles ─────────────────────────────────────────────────
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

export const btnGhost: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink-2)',
  fontSize: 12,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

// ─── Card shell ────────────────────────────────────────────────────
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
  title: string;
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

export const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '88px 1fr',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      {label}
    </div>
    <div>{children}</div>
  </div>
);

// ─── Lesson status pill ────────────────────────────────────────────
const LESSON_STATUS: Record<LessonStatus, { label: string; color: string; tint: string }> = {
  scheduled: { label: 'Scheduled', color: 'var(--info)', tint: '#3a5a7d18' },
  in_progress: { label: 'In progress', color: 'var(--gold-2)', tint: '#c8952322' },
  completed: { label: 'Completed', color: 'var(--success)', tint: '#3a7d3a18' },
  cancelled: { label: 'Cancelled', color: 'var(--ink-4)', tint: 'var(--rule-2)' },
};

export const LessonStatusPill = ({
  status,
  compact = false,
}: {
  status: LessonStatus;
  compact?: boolean;
}) => {
  const s = LESSON_STATUS[status];
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

// ─── Stage stepper ─────────────────────────────────────────────────
const STAGES: { key: SongStatusKey; short: string; label: string }[] = [
  { key: 'to_learn', short: 'Learn', label: 'To learn' },
  { key: 'started', short: 'Started', label: 'Started' },
  { key: 'remembered', short: 'Remember', label: 'Remembered' },
  { key: 'with_author', short: 'w/ Author', label: 'With author' },
  { key: 'mastered', short: 'Mastered', label: 'Mastered' },
];

export const StageStepper = ({
  status,
  size = 'md',
}: {
  status: SongStatusKey;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const idx = STAGES.findIndex((s) => s.key === status);
  const meta = SONG_STATUS[status];
  const h = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: size === 'lg' ? 8 : 6,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {STAGES.map((st, i) => {
          const reached = i <= idx;
          return (
            <div
              key={st.key}
              title={st.label}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: reached ? meta.color : 'var(--rule)',
                transition: 'background .15s',
              }}
            />
          );
        })}
      </div>
      {size !== 'sm' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: size === 'lg' ? 11 : 10,
            color: 'var(--ink-4)',
            fontFamily: 'var(--mono)',
          }}
        >
          {STAGES.map((st) => (
            <span
              key={st.key}
              style={{
                color: st.key === status ? meta.color : 'var(--ink-4)',
                fontWeight: st.key === status ? 500 : 400,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              {st.short}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Date block ────────────────────────────────────────────────────
export const DateBlock = ({ iso, size = 'md' }: { iso: string; size?: 'md' | 'lg' }) => {
  const d = formatLessonDate(iso);
  const big = size === 'lg';
  return (
    <div
      style={{
        width: big ? 72 : 56,
        flex: `0 0 ${big ? 72 : 56}px`,
        textAlign: 'center',
        border: '1px solid var(--rule)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          background: 'var(--rule-2)',
          fontFamily: 'var(--mono)',
          fontSize: big ? 10 : 9,
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          color: 'var(--gold-2)',
          padding: big ? '4px 0' : '3px 0',
          fontWeight: 500,
        }}
      >
        {d.mon}
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: big ? 30 : 22,
          fontWeight: 500,
          lineHeight: 1,
          padding: big ? '6px 0 2px' : '4px 0 2px',
        }}
      >
        {d.day}
      </div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: big ? 10 : 9,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          paddingBottom: big ? 6 : 4,
        }}
      >
        {d.wday}
      </div>
    </div>
  );
};

// ─── Small stat tile ───────────────────────────────────────────────
export const StatTile = ({
  label,
  value,
  unit,
  sub,
  trendUp,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trendUp?: boolean;
}) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {unit && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-4)' }}>
          {unit}
        </span>
      )}
    </div>
    {sub && (
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: trendUp ? 'var(--success)' : 'var(--ink-4)',
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

// Re-export Icon for convenience in section files
export { Icon };

/**
 * Presentation-only primitives for the parent Family portal. No server imports,
 * so they stay safe to render in the component test and (if ever needed) a
 * client bundle. Interaction/responsive concerns live in editorial-tokens.css.
 */

import type { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'success' | 'gold' | 'warn' | 'danger' | 'neutral';

const TONE_COLOR: Record<BadgeTone, string> = {
  success: 'var(--success)',
  gold: 'var(--gold-2)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  neutral: 'var(--ink-4)',
};

export const Badge = ({ tone, children }: { tone: BadgeTone; children: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--mono)',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '.04em',
      color: TONE_COLOR[tone],
      border: '1px solid var(--rule)',
      borderRadius: 999,
      padding: '3px 10px',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      aria-hidden
      style={{ width: 6, height: 6, borderRadius: '50%', background: TONE_COLOR[tone] }}
    />
    {children}
  </span>
);

export const SectionLabel = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      fontFamily: 'var(--mono)',
      fontSize: 10,
      color: 'var(--ink-4)',
      textTransform: 'uppercase',
      letterSpacing: '.16em',
      ...style,
    }}
  >
    {children}
  </div>
);

export const StatChip = ({
  value,
  label,
  tone = 'neutral',
}: {
  value: string;
  label: string;
  tone?: BadgeTone;
}) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 12,
      padding: '14px 20px',
      textAlign: 'center',
      minWidth: 104,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 26,
        fontWeight: 500,
        lineHeight: 1,
        color: TONE_COLOR[tone],
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>{label}</div>
  </div>
);

export const formatLessonDate = (
  iso: string
): { mo: string; day: string; time: string; weekday: string } => {
  const d = new Date(iso);
  return {
    mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  };
};

export const formatNoteDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

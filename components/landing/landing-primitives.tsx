'use client';

import type { CSSProperties, ReactNode } from 'react';

// Re-export SVG primitives from dedicated file
export { StaffLines, ChordGrid, FretboardSVG } from './landing-svg';

// ── Typography ──────────────────────────────────────────────

export function SectionKicker({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em]"
      style={{
        color: 'var(--l-gold-2)',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      <span className="h-px w-[18px]" style={{ background: 'var(--l-gold)' }} />
      <span>{children}</span>
      <span className="h-px w-[18px]" style={{ background: 'var(--l-gold)' }} />
    </div>
  );
}

export function Display({
  children,
  size = 72,
  align = 'left',
  className = '',
  style,
}: {
  children: ReactNode;
  size?: number;
  align?: 'left' | 'center';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <h2
      className={`m-0 font-serif font-normal ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.028em',
        textAlign: align,
        color: 'var(--l-ink)',
        textWrap: 'balance',
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="font-mono text-[11px] uppercase tracking-[0.22em]"
      style={{ color: 'var(--l-ink-4)', ...style }}
    >
      {children}
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────

export function BtnPrimary({
  children,
  size = 'md',
  style,
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}) {
  const pad = size === 'lg' ? '14px 26px' : size === 'sm' ? '8px 14px' : '11px 20px';
  return (
    <button
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border-none font-medium"
      style={{
        background: 'var(--l-ink)',
        color: 'var(--l-paper)',
        padding: pad,
        fontSize: size === 'lg' ? 15 : 13,
        fontWeight: 500,
        boxShadow: '0 1px 2px rgba(26,22,19,.1), inset 0 1px 0 rgba(255,255,255,.08)',
        letterSpacing: '-0.005em',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function BtnGhost({
  children,
  size = 'md',
  style,
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}) {
  const pad = size === 'lg' ? '13px 24px' : size === 'sm' ? '7px 12px' : '10px 18px';
  return (
    <button
      className="inline-flex cursor-pointer items-center gap-2 rounded-full font-medium"
      style={{
        border: '1px solid var(--l-rule)',
        background: 'transparent',
        color: 'var(--l-ink-2)',
        padding: pad,
        fontSize: size === 'lg' ? 15 : 13,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── BrowserFrame ────────────────────────────────────────────

export function BrowserFrame({
  children,
  url = 'app.strummy.app',
  height,
  style,
}: {
  children: ReactNode;
  url?: string;
  height?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="overflow-hidden rounded-[14px]"
      style={{
        background: 'var(--l-card)',
        border: '1px solid var(--l-rule)',
        boxShadow: 'var(--l-shadow-lg)',
        ...style,
      }}
    >
      <div
        className="flex h-[34px] items-center gap-2.5 px-3.5"
        style={{ borderBottom: '1px solid var(--l-rule)', background: 'var(--l-paper)' }}
      >
        <div className="flex gap-1.5">
          {['#e0726a', '#e6b64b', '#7abf7a'].map((c) => (
            <span
              key={c}
              className="h-2.5 w-2.5 rounded-full opacity-85"
              style={{ background: c }}
            />
          ))}
        </div>
        <div
          className="mx-auto flex h-[22px] max-w-[340px] flex-1 items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px]"
          style={{
            background: 'var(--l-card)',
            border: '1px solid var(--l-rule)',
            color: 'var(--l-ink-4)',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>{url}</span>
        </div>
        <div className="w-11" />
      </div>
      <div style={{ height, background: 'var(--l-ivory)' }}>{children}</div>
    </div>
  );
}

// ── Placeholder ─────────────────────────────────────────────

export function Placeholder({
  label,
  height = 400,
  note = 'screenshot',
}: {
  label: string;
  height?: number;
  note?: string;
}) {
  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded-xl"
      style={{
        height,
        background: `repeating-linear-gradient(135deg, var(--l-rule-2) 0px, var(--l-rule-2) 1px, transparent 1px, transparent 9px)`,
        backgroundColor: 'var(--l-paper)',
        border: '1px solid var(--l-rule)',
      }}
    >
      <div
        className="flex flex-col items-center gap-0.5 rounded-lg px-4 py-2.5 font-mono text-xs text-center"
        style={{
          border: '1px solid var(--l-rule)',
          background: 'var(--l-card)',
          color: 'var(--l-ink-3)',
        }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.1em]"
          style={{ color: 'var(--l-gold-2)' }}
        >
          {note}
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}

// ── Small UI atoms ──────────────────────────────────────────

const HEALTH_COLORS: Record<string, string> = {
  excellent: 'var(--l-success)',
  good: 'var(--l-success)',
  needs_attention: 'var(--l-warn)',
  at_risk: 'var(--l-danger)',
};

export function HealthDot({ health, size = 8 }: { health: string; size?: number }) {
  const c = HEALTH_COLORS[health] || 'var(--l-ink-4)';
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, background: c, boxShadow: `0 0 0 3px ${c}22` }}
    />
  );
}

export function Avatar({
  initials,
  color,
  size = 32,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="grid flex-shrink-0 place-items-center rounded-full font-sans font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────────

export function LandingContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-[1440px] px-6 md:px-12 lg:px-24 ${className}`}>{children}</div>
  );
}

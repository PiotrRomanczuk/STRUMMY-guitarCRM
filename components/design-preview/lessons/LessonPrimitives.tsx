'use client';

import type { CSSProperties, ReactNode } from 'react';

import { SONG_STATUS } from '../primitives/StatusPill';

import { formatLessonDate } from './data';
import type { LessonStatusKey } from './types';

const LESSON_STATUS_META: Record<LessonStatusKey, { label: string; color: string; tint: string }> =
  {
    scheduled: { label: 'Scheduled', color: 'var(--info)', tint: '#3a5a7d18' },
    in_progress: { label: 'In progress', color: 'var(--gold-2)', tint: '#c8952322' },
    completed: { label: 'Completed', color: 'var(--success)', tint: '#3a7d3a18' },
    cancelled: { label: 'Cancelled', color: 'var(--ink-4)', tint: 'var(--rule-2)' },
  };

export const LessonStatusPill = ({
  status,
  compact = false,
}: {
  status: LessonStatusKey;
  compact?: boolean;
}) => {
  const s = LESSON_STATUS_META[status] || LESSON_STATUS_META.scheduled;
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

type StageKey = 'to_learn' | 'started' | 'remembered' | 'with_author' | 'mastered';

const STAGES: Array<{ key: StageKey; short: string; label: string }> = [
  { key: 'to_learn', short: 'Learn', label: 'To learn' },
  { key: 'started', short: 'Started', label: 'Started' },
  { key: 'remembered', short: 'Remember', label: 'Remembered' },
  { key: 'with_author', short: 'w/ Author', label: 'With author' },
  { key: 'mastered', short: 'Mastered', label: 'Mastered' },
];

type StageStepperProps = {
  status: StageKey;
  onChange?: (k: StageKey) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export const StageStepper = ({
  status,
  onChange,
  readOnly = false,
  size = 'md',
}: StageStepperProps) => {
  const idx = STAGES.findIndex((st) => st.key === status);
  const s = SONG_STATUS[status];
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
              onClick={() => !readOnly && onChange && onChange(st.key)}
              title={st.label}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: reached ? s.color : 'var(--rule)',
                cursor: readOnly ? 'default' : 'pointer',
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
              onClick={() => !readOnly && onChange && onChange(st.key)}
              style={{
                color: st.key === status ? s.color : 'var(--ink-4)',
                fontWeight: st.key === status ? 500 : 400,
                cursor: readOnly ? 'default' : 'pointer',
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

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
};

export const FilterChip = ({ active, onClick, children, color }: FilterChipProps) => {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 6,
    border: active ? `1px solid ${color || 'var(--ink)'}` : '1px solid var(--rule)',
    background: active ? (color ? `${color}12` : 'var(--ink)') : 'var(--card)',
    color: active ? color || 'var(--paper)' : 'var(--ink-3)',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: active ? 500 : 400,
  };
  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export const StatusBar = () => (
  <div
    style={{
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px 0 28px',
      fontFamily: 'var(--sans)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)',
      background: 'var(--paper)',
      position: 'relative',
      zIndex: 5,
    }}
  >
    <span>9:41</span>
    <span style={{ width: 110 }} />
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
      <svg width="16" height="10" viewBox="0 0 16 10">
        <path
          d="M1 9V7m3 2V5m3 4V3m3 6V1m3 8V4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <svg width="14" height="10" viewBox="0 0 14 10">
        <path
          d="M1 7.5c1.8-1.5 3.5-2.2 6-2.2s4.2.7 6 2.2M3 5.3c1.3-1 2.5-1.5 4-1.5s2.7.5 4 1.5M5 3.2c.9-.6 1.6-.8 2-.8s1.1.2 2 .8"
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <svg width="22" height="10" viewBox="0 0 22 10">
        <rect x=".5" y=".5" width="18" height="9" rx="2" stroke="currentColor" fill="none" />
        <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor" />
        <rect x="19.2" y="3.5" width="1.8" height="3" rx=".5" fill="currentColor" opacity=".5" />
      </svg>
    </span>
  </div>
);

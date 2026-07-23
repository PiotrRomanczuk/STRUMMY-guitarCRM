import Link from 'next/link';

import type { LessonsBreakdown } from '@/lib/services/lessons-queries';
import { lessonStatusColour, lessonStatusLabel } from '@/lib/services/lessons-queries';

import {
  STATUS_KEYS,
  statusHref,
  sortHref,
  yearHref,
  type LessonsListState,
} from './LessonsListEditorial.helpers';

export const eyebrowStyle = {
  fontSize: 11,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  fontFamily: 'var(--mono)',
  marginRight: 4,
} as const;

const chip = (active: boolean) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 99,
    border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
    background: active ? 'var(--ink)' : 'transparent',
    fontSize: 12,
    color: active ? 'var(--paper)' : 'var(--ink-3)',
    textDecoration: 'none',
    fontFamily: 'var(--sans)',
  }) as const;

const StatusChips = ({
  breakdown,
  state,
}: {
  breakdown: LessonsBreakdown;
  state: LessonsListState;
}) => (
  <>
    <span style={eyebrowStyle}>Status</span>
    {STATUS_KEYS.map((k) => {
      const active = state.statuses.includes(k);
      return (
        <Link
          key={k}
          href={statusHref(state, k)}
          role="button"
          aria-pressed={active}
          style={chip(active)}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: lessonStatusColour(k) }}
          />
          {lessonStatusLabel(k)}
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: active ? 'rgba(255,255,255,.6)' : 'var(--ink-4)',
            }}
          >
            {breakdown.byStatus[k] ?? 0}
          </span>
        </Link>
      );
    })}
  </>
);

const YearChips = ({ years, state }: { years: number[]; state: LessonsListState }) => (
  <>
    <span style={eyebrowStyle}>Year</span>
    <Link
      href={yearHref(state, undefined)}
      role="button"
      aria-pressed={state.year === undefined}
      style={chip(state.year === undefined)}
    >
      All
    </Link>
    {years.map((y) => {
      const active = state.year === y;
      return (
        <Link
          key={y}
          href={yearHref(state, y)}
          role="button"
          aria-pressed={active}
          style={chip(active)}
        >
          {y}
        </Link>
      );
    })}
  </>
);

const SortToggle = ({ state }: { state: LessonsListState }) => (
  <Link
    href={sortHref(state)}
    role="button"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 8,
      border: '1px solid var(--rule)',
      background: 'var(--card)',
      color: 'var(--ink-2)',
      fontSize: 12,
      textDecoration: 'none',
      fontFamily: 'var(--sans)',
    }}
  >
    {state.sort === 'newest' ? 'Newest first' : 'Oldest first'}
  </Link>
);

export const FilterRow = ({
  breakdown,
  state,
  years,
}: {
  breakdown: LessonsBreakdown;
  state: LessonsListState;
  years: number[];
}) => (
  <div
    style={{
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '10px 14px',
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
    }}
  >
    <StatusChips breakdown={breakdown} state={state} />
    <div style={{ width: 1, height: 20, background: 'var(--rule)', margin: '0 2px' }} />
    <YearChips years={years} state={state} />
    <div style={{ flex: 1, minWidth: 8 }} />
    <SortToggle state={state} />
  </div>
);

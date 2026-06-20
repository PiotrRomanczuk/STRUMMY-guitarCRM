import Link from 'next/link';

import type { SongsListFilters, SongsListResult } from '@/lib/services/songs-list-queries';

import { levelLabel } from './format';
import { buildHref, KEYS, LEVELS, SORTS, SORT_LABEL } from './songs-list.helpers';

type Props = {
  total: number;
  canCreate: boolean;
  breakdown: SongsListResult['breakdown'];
  filters: SongsListFilters;
};

const chipStyle = (active: boolean) => ({
  padding: '4px 10px',
  borderRadius: 99,
  border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
  background: active ? 'var(--ink)' : 'transparent',
  fontSize: 12,
  color: active ? 'var(--paper)' : 'var(--ink-3)',
  textDecoration: 'none',
  fontFamily: 'var(--sans)',
});

const fieldLabel = {
  fontSize: 11,
  color: 'var(--ink-4)',
  textTransform: 'uppercase' as const,
  letterSpacing: '.12em',
  fontFamily: 'var(--mono)',
};

const controlStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  fontSize: 12,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  color: 'var(--ink)',
};

export const SongsListFiltersBar = ({ total, canCreate, breakdown, filters }: Props) => (
  <div style={{ padding: '0 0 18px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <div>
        <div
          style={{
            color: 'var(--ink-4)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.16em',
            fontFamily: 'var(--mono)',
          }}
        >
          Repertoire
        </div>
        <h1
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Songs
        </h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 6 }}>
          {total} {total === 1 ? 'song' : 'songs'}
          {filters.search ? ` matching “${filters.search}”` : ''}
        </div>
      </div>
      {canCreate && (
        <Link
          href="/dashboard/songs/new"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            fontFamily: 'var(--sans)',
          }}
        >
          + New song
        </Link>
      )}
    </div>

    {/* Level + sort: navigation chips that preserve other filters via buildHref */}
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 10,
      }}
    >
      <span style={fieldLabel}>Level</span>
      {LEVELS.map((lvl) => {
        const active = filters.level === lvl;
        return (
          <Link
            key={lvl}
            href={buildHref({ level: active ? undefined : lvl }, filters)}
            role="button"
            aria-pressed={active}
            style={chipStyle(active)}
          >
            {levelLabel(lvl)}
            <span
              style={{
                marginLeft: 6,
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: active ? 'rgba(255,255,255,.6)' : 'var(--ink-4)',
              }}
            >
              {breakdown[lvl]}
            </span>
          </Link>
        );
      })}
      <span style={{ flex: 1, minWidth: 12 }} />
      {SORTS.map((s) => (
        <Link
          key={s}
          href={buildHref({ sort: s }, filters)}
          role="button"
          aria-pressed={filters.sort === s}
          style={chipStyle(filters.sort === s)}
        >
          {SORT_LABEL[s]}
        </Link>
      ))}
    </div>

    {/* Key / author / search: GET form (submitting resets to page 1) */}
    <form
      action="/dashboard/songs"
      method="GET"
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--card)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        flexWrap: 'wrap',
      }}
    >
      {filters.level && <input type="hidden" name="level" value={filters.level} />}
      {filters.sort !== 'newest' && <input type="hidden" name="sort" value={filters.sort} />}
      <span style={fieldLabel}>Key</span>
      <select name="key" defaultValue={filters.key ?? ''} style={controlStyle}>
        <option value="">Any</option>
        {KEYS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="author"
        defaultValue={filters.author ?? ''}
        placeholder="Author…"
        style={{ ...controlStyle, minWidth: 140 }}
      />
      <input
        type="search"
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search by title…"
        style={{ ...controlStyle, flex: 1, minWidth: 180 }}
      />
      <button
        type="submit"
        style={{
          padding: '6px 16px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--sans)',
        }}
      >
        Apply
      </button>
    </form>
  </div>
);

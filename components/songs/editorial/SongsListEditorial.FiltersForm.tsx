'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import type { SongsListFilters } from '@/lib/services/songs-list-queries';

import { buildHref, KEYS } from './songs-list.helpers';

type Props = {
  filters: SongsListFilters;
};

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

/** Key / author / title filters that apply as you interact — selects push
 * immediately, text inputs debounce. No Apply button needed. */
export const SongsListFiltersForm = ({ filters }: Props) => {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (next: Partial<SongsListFilters>) =>
    router.push(buildHref(next, filters), { scroll: false });

  const applyDebounced = (next: Partial<SongsListFilters>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.replace(buildHref(next, filters), { scroll: false });
    }, 350);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        const data = new FormData(e.currentTarget);
        apply({
          key: String(data.get('key') ?? '') || undefined,
          author: String(data.get('author') ?? '').trim() || undefined,
          search: String(data.get('search') ?? '').trim() || undefined,
        });
      }}
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
      <span style={fieldLabel}>Key</span>
      <select
        name="key"
        aria-label="Filter by key"
        defaultValue={filters.key ?? ''}
        onChange={(e) => apply({ key: e.target.value || undefined })}
        style={controlStyle}
      >
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
        aria-label="Filter by author"
        onChange={(e) => applyDebounced({ author: e.target.value.trim() || undefined })}
        style={{ ...controlStyle, minWidth: 140 }}
      />
      <input
        type="search"
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search by title…"
        aria-label="Search songs by title"
        onChange={(e) => applyDebounced({ search: e.target.value.trim() || undefined })}
        style={{ ...controlStyle, flex: 1, minWidth: 180 }}
      />
    </form>
  );
};

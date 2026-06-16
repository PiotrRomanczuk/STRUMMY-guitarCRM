import Link from 'next/link';

import type { SongsListFilters } from '@/lib/services/songs-list-queries';

import { buildHref } from './songs-list.helpers';

type Props = {
  page: number;
  totalPages: number;
  filters: SongsListFilters;
};

const linkStyle = (enabled: boolean) => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  fontSize: 12,
  fontFamily: 'var(--sans)',
  color: enabled ? 'var(--ink)' : 'var(--ink-5)',
  textDecoration: 'none',
  pointerEvents: enabled ? ('auto' as const) : ('none' as const),
  opacity: enabled ? 1 : 0.5,
});

export const SongsListPagination = ({ page, totalPages, filters }: Props) => {
  if (totalPages <= 1) return null;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
      }}
    >
      <Link
        href={buildHref({ page: page - 1 }, filters)}
        aria-disabled={!hasPrev}
        style={linkStyle(hasPrev)}
      >
        ← Previous
      </Link>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color: 'var(--ink-4)',
        }}
      >
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref({ page: page + 1 }, filters)}
        aria-disabled={!hasNext}
        style={linkStyle(hasNext)}
      >
        Next →
      </Link>
    </div>
  );
};

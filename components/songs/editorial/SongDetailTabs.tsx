'use client';

import { useState, type ReactNode } from 'react';

import ProductionTab from '@/components/songs/production/ProductionTab';

type Tab = 'overview' | 'production';

type Props = {
  songId: string;
  overview: ReactNode;
};

const tabButtonStyle = (active: boolean) => ({
  appearance: 'none' as const,
  background: 'transparent',
  border: 'none',
  borderBottom: `2px solid ${active ? 'var(--ink)' : 'transparent'}`,
  padding: '10px 4px',
  marginRight: 24,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  textTransform: 'uppercase' as const,
  letterSpacing: '.14em',
  color: active ? 'var(--ink)' : 'var(--ink-4)',
});

/**
 * Teacher/admin song-detail tab switcher. "Overview" is the editorial detail
 * (rendered server-side and passed as `overview`); "Production" mounts the
 * content-production tab. Only rendered at all when the caller passes
 * `canSeeProduction` (SongDetailEditorial gates on isAdmin || isTeacher), so
 * no additional role check is needed here.
 */
export const SongDetailTabs = ({ songId, overview }: Props) => {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: 'flex',
          padding: '0 32px',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          onClick={() => setTab('overview')}
          style={tabButtonStyle(tab === 'overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'production'}
          onClick={() => setTab('production')}
          style={tabButtonStyle(tab === 'production')}
        >
          Production
        </button>
      </div>

      {tab === 'overview' ? (
        overview
      ) : (
        <div style={{ padding: '24px 32px 0' }}>
          <ProductionTab songId={songId} />
        </div>
      )}
    </div>
  );
};

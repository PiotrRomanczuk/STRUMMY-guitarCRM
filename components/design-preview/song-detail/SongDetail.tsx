'use client';

import { useState } from 'react';

import { SidebarNav } from '@/components/design-preview/shell/SidebarNav';
import { TopBar } from '@/components/design-preview/shell/TopBar';

import { SONG_DETAIL } from './data';
import { SongAudio } from './SongAudio';
import { SongChordsView } from './SongChordsView';
import { SongHero } from './SongHero';
import { SongLyricsView } from './SongLyricsView';
import { SongTabView } from './SongTabView';
import { SongAssignPanel, SongRelated, SongSidebarStats, SongStudentsList } from './SongSidebar';

type Tab = 'chords' | 'tab' | 'lyrics';

const TABS: { key: Tab; label: string }[] = [
  { key: 'chords', label: 'Chords & structure' },
  { key: 'tab', label: 'Tablature' },
  { key: 'lyrics', label: 'Lyrics' },
];

const SongTabs = ({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) => (
  <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)' }}>
    {TABS.map(({ key, label }) => {
      const active = tab === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 18px',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            color: active ? 'var(--ink)' : 'var(--ink-4)',
            fontWeight: active ? 500 : 400,
            borderBottom: active ? '2px solid var(--gold-2)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

export const SongDetail = ({
  width = 1440,
  height = 1300,
}: {
  width?: number;
  height?: number;
}) => {
  const [tab, setTab] = useState<Tab>('chords');
  const s = SONG_DETAIL;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <SidebarNav active="songs" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 60px' }}>
          <SongHero s={s} />
          <div
            style={{
              padding: '0 32px',
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 24,
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                minWidth: 0,
              }}
            >
              <SongAudio s={s} />
              <SongTabs tab={tab} onSelect={setTab} />
              {tab === 'chords' && <SongChordsView s={s} />}
              {tab === 'tab' && <SongTabView />}
              {tab === 'lyrics' && <SongLyricsView />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SongSidebarStats s={s} />
              <SongAssignPanel />
              <SongStudentsList />
              <SongRelated />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

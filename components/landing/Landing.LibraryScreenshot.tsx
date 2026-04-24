'use client';

import { BrowserFrame } from './landing-primitives';

interface Song {
  title: string;
  artist: string;
  key: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  chords: string[];
  hasSpotify: boolean;
  hasTab: boolean;
}

const SONGS: Song[] = [
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    key: 'Em',
    difficulty: 'beginner',
    chords: ['Em', 'G', 'D', 'A7sus4'],
    hasSpotify: true,
    hasTab: true,
  },
  {
    title: 'Blackbird',
    artist: 'The Beatles',
    key: 'G',
    difficulty: 'intermediate',
    chords: ['G', 'Am7', 'G/B', 'C'],
    hasSpotify: true,
    hasTab: true,
  },
  {
    title: 'Classical Gas',
    artist: 'Mason Williams',
    key: 'Am',
    difficulty: 'advanced',
    chords: ['Am', 'G', 'E', 'Dm'],
    hasSpotify: true,
    hasTab: true,
  },
  {
    title: 'Dust in the Wind',
    artist: 'Kansas',
    key: 'C',
    difficulty: 'intermediate',
    chords: ['C', 'Cmaj7', 'Am', 'G'],
    hasSpotify: true,
    hasTab: false,
  },
  {
    title: 'House of the Rising Sun',
    artist: 'The Animals',
    key: 'Am',
    difficulty: 'beginner',
    chords: ['Am', 'C', 'D', 'F'],
    hasSpotify: true,
    hasTab: true,
  },
  {
    title: 'Nothing Else Matters',
    artist: 'Metallica',
    key: 'Em',
    difficulty: 'intermediate',
    chords: ['Em', 'D', 'C', 'G'],
    hasSpotify: true,
    hasTab: true,
  },
  {
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    key: 'Am',
    difficulty: 'advanced',
    chords: ['Am', 'G+', 'C/G', 'D'],
    hasSpotify: false,
    hasTab: true,
  },
];

const DIFF_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  beginner: { bg: 'var(--l-success)', color: '#fff', label: 'Beginner' },
  intermediate: { bg: 'var(--l-warn)', color: '#fff', label: 'Intermediate' },
  advanced: { bg: 'var(--l-danger)', color: '#fff', label: 'Advanced' },
};

function SpotifyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--l-success)">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.4-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.1-.9 7.6-.5 10.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.2-2.3-10.6-1.3-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.9-1.2 8.7-.6 12 1.5.3.2.5.7.2 1.1zm.1-3.4c-3.4-2-9.1-2.2-12.4-1.2-.5.2-1-.2-1.2-.7-.2-.5.2-1 .7-1.2 3.8-1.1 10-1 14 1.4.5.3.6.9.3 1.4-.3.4-.9.6-1.4.3z" />
    </svg>
  );
}

function TabIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--l-ink-4)"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}

export function LandingLibraryScreenshot() {
  return (
    <BrowserFrame url="app.strummy.app/songs" height={480}>
      <div
        className="flex h-full w-full overflow-hidden text-xs leading-snug"
        style={{ background: 'var(--l-ivory)' }}
      >
        {/* Mini sidebar */}
        <div
          className="flex w-12 shrink-0 flex-col items-center gap-2.5 border-r py-3"
          style={{ background: 'var(--l-paper)', borderColor: 'var(--l-rule)' }}
        >
          <div
            className="h-6 w-6 rounded-md"
            style={{ background: 'linear-gradient(135deg, var(--l-gold), var(--l-gold-2))' }}
          />
        </div>

        <div className="flex-1 overflow-hidden px-5 py-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{ color: 'var(--l-ink-4)' }}
              >
                Library · 1,247 songs
              </div>
              <div className="mt-0.5 font-serif text-lg font-normal tracking-[-0.02em]">
                Song Library
              </div>
            </div>
            <button
              className="rounded-md border-none px-2.5 py-1 text-[10px]"
              style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
            >
              + Add song
            </button>
          </div>

          {/* Search + filters */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5"
              style={{ borderColor: 'var(--l-rule)', background: 'var(--l-card)' }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--l-ink-4)"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span style={{ color: 'var(--l-ink-4)' }}>Search songs, artists, chords...</span>
            </div>
            {['All keys', 'All levels', 'Has tabs'].map((f) => (
              <button
                key={f}
                className="shrink-0 rounded-md border px-2 py-1.5 text-[10px]"
                style={{
                  borderColor: 'var(--l-rule)',
                  background: 'var(--l-card)',
                  color: 'var(--l-ink-3)',
                }}
              >
                {f} ▾
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--l-rule)', background: 'var(--l-card)' }}
          >
            {/* Table header */}
            <div
              className="grid border-b px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em]"
              style={{
                gridTemplateColumns: '1.4fr 1fr 44px 90px 1fr 48px',
                borderColor: 'var(--l-rule)',
                color: 'var(--l-ink-4)',
                background: 'var(--l-paper)',
              }}
            >
              <span>Title</span>
              <span>Artist</span>
              <span>Key</span>
              <span>Difficulty</span>
              <span>Chords</span>
              <span className="text-center">Media</span>
            </div>

            {/* Rows */}
            {SONGS.map((song, i) => {
              const diff = DIFF_STYLES[song.difficulty];
              return (
                <div
                  key={i}
                  className="grid items-center border-b px-3 py-2 last:border-b-0"
                  style={{
                    gridTemplateColumns: '1.4fr 1fr 44px 90px 1fr 48px',
                    borderColor: 'var(--l-rule)',
                  }}
                >
                  <span className="font-serif text-xs font-medium italic">{song.title}</span>
                  <span className="text-[10px]" style={{ color: 'var(--l-ink-3)' }}>
                    {song.artist}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--l-gold-2)' }}>
                    {song.key}
                  </span>
                  <span>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[9px] font-medium"
                      style={{ background: `${diff.bg}18`, color: diff.bg }}
                    >
                      {diff.label}
                    </span>
                  </span>
                  <div className="flex gap-1">
                    {song.chords.map((c) => (
                      <span
                        key={c}
                        className="rounded border px-1 py-px font-mono text-[8px]"
                        style={{ borderColor: 'var(--l-rule)', color: 'var(--l-ink-3)' }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    {song.hasSpotify && <SpotifyIcon />}
                    {song.hasTab && <TabIcon />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="mt-2 flex items-center justify-between font-mono text-[9px]"
            style={{ color: 'var(--l-ink-4)' }}
          >
            <span>Showing 7 of 1,247 songs</span>
            <span>Auto-enriched via Spotify · difficulty auto-tagged</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

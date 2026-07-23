'use client';

import { useEffect, useRef, useState } from 'react';

type SearchResult = {
  id: string;
  name: string;
  artist: string;
  coverUrl?: string;
  duration_ms: number;
  release_date: string;
};

export type SpotifyAutoFill = {
  title: string;
  author: string;
  spotifyLinkUrl: string;
  coverImageUrl: string | null;
  durationMs: number;
  releaseYear?: number;
  key?: string;
  tempo?: number;
  timeSignature?: number;
};

const PITCH_CLASS: Record<number, string> = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B',
};
const mapKey = (pitchClass: number, mode: number): string | undefined => {
  const note = PITCH_CLASS[pitchClass];
  return note ? (mode === 0 ? `${note}m` : note) : undefined;
};
const releaseYearOf = (date: string): number | undefined => {
  const year = parseInt(date, 10);
  return Number.isFinite(year) && year >= 1500 && year <= 2100 ? year : undefined;
};

const boxStyle: React.CSSProperties = {
  background: 'var(--gold-tint)',
  border: '1px solid var(--gold-dim)',
  borderRadius: 10,
  padding: 14,
  marginBottom: 20,
};

type Props = { onAutoFill: (draft: SpotifyAutoFill) => void };

/** Debounced Spotify track search that auto-fills the form from a selection.
 * Reuses the existing /api/spotify/search + /api/spotify/features endpoints —
 * no new backend, this is purely the interactive search-and-fill UI. */
export const SongFormEditorialSpotifyAccelerator = ({ onAutoFill }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [matched, setMatched] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (matched || query.trim().length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track`);
        if (!res.ok) return;
        const body = (await res.json()) as { results?: SearchResult[] };
        setResults(body.results ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, matched]);

  const selectResult = async (result: SearchResult) => {
    setMatched(result);
    setResults([]);
    let key: string | undefined;
    let tempo: number | undefined;
    let timeSignature: number | undefined;
    try {
      const res = await fetch(`/api/spotify/features?id=${result.id}`);
      if (res.ok) {
        const features = (await res.json()) as {
          key: number;
          mode: number;
          tempo: number;
          time_signature: number;
        };
        key = mapKey(features.key, features.mode);
        tempo = features.tempo > 0 ? Math.round(features.tempo) : undefined;
        timeSignature = features.time_signature > 0 ? features.time_signature : undefined;
      }
    } catch {
      // Audio features are a bonus — title/author/link/cover still autofill without them.
    }
    onAutoFill({
      title: result.name,
      author: result.artist,
      spotifyLinkUrl: `https://open.spotify.com/track/${result.id}`,
      coverImageUrl: result.coverUrl ?? null,
      durationMs: result.duration_ms,
      releaseYear: releaseYearOf(result.release_date),
      key,
      tempo,
      timeSignature,
    });
  };

  return (
    <div style={boxStyle}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--gold-2)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          marginBottom: 8,
        }}
      >
        Spotify accelerator — auto-fills title, artist, key, tempo, year & links
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={matched ? `${matched.name} — ${matched.artist}` : query}
          onChange={(e) => {
            setMatched(null);
            setQuery(e.target.value);
          }}
          placeholder="Search a song on Spotify…"
          style={{
            flex: 1,
            padding: '9px 12px',
            border: '1px solid var(--gold-dim)',
            borderRadius: 6,
            background: 'var(--card)',
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />
        {matched && (
          <button
            type="button"
            onClick={() => {
              setMatched(null);
              setQuery('');
            }}
            style={{
              padding: '9px 14px',
              borderRadius: 6,
              border: '1px solid var(--rule)',
              background: 'var(--card)',
              fontSize: 12,
              fontFamily: 'var(--mono)',
              cursor: 'pointer',
            }}
          >
            Search again
          </button>
        )}
      </div>
      {isSearching && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-4)' }}>Searching…</div>
      )}
      {results.length > 0 && (
        <div
          style={{
            marginTop: 10,
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {results.slice(0, 6).map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => selectResult(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--sans)',
              }}
            >
              {r.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- tiny 3rd-party thumbnail in a search dropdown
                <img src={r.coverUrl} alt="" width={28} height={28} style={{ borderRadius: 4 }} />
              )}
              <span style={{ fontSize: 13 }}>{r.name}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>— {r.artist}</span>
            </button>
          ))}
        </div>
      )}
      {matched && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
          Matched — fields below were auto-filled and can still be edited.
        </div>
      )}
    </div>
  );
};

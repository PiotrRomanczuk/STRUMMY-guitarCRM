'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Match = { id: string; title: string; author: string };

type Props = { title: string; author: string };

/** Advisory-only duplicate check — reuses the existing song search endpoint,
 * doesn't block saving (a teacher may legitimately want a second arrangement). */
export const SongFormEditorialDuplicateWarning = ({ title, author }: Props) => {
  const [match, setMatch] = useState<Match | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!title.trim() || !author.trim()) {
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/song/search?q=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=5`
        );
        if (!res.ok) return;
        const body = (await res.json()) as { songs?: Match[] };
        const found = (body.songs ?? []).find(
          (s) =>
            s.title.trim().toLowerCase() === title.trim().toLowerCase() &&
            s.author.trim().toLowerCase() === author.trim().toLowerCase()
        );
        setMatch(found ?? null);
      } catch {
        // Advisory only — a failed check just means no warning shows.
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [title, author]);

  if (!match || !title.trim() || !author.trim()) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'var(--gold-tint)',
        border: '1px solid var(--gold-dim)',
        borderRadius: 6,
        fontSize: 12,
        color: 'var(--ink-3)',
        marginBottom: 16,
      }}
    >
      <span>
        A song called &ldquo;{match.title}&rdquo; by {match.author} already exists. You can still
        save if this is a different arrangement.
      </span>
      <Link href={`/dashboard/songs/${match.id}`} style={{ color: 'var(--gold-2)', flexShrink: 0 }}>
        View existing →
      </Link>
    </div>
  );
};

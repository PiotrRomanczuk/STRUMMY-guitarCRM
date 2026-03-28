'use client';

import { X } from 'lucide-react';
import type { Song } from '@/components/lessons/hooks/useSongs';

interface SongCardsProps {
  songs: Song[];
  selectedIds: string[];
  onRemove: (id: string) => void;
}

export function SongCards({ songs, selectedIds, onRemove }: SongCardsProps) {
  if (selectedIds.length === 0) return null;

  const selected = songs.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="mt-3 space-y-2">
      {selected.map((song) => (
        <div
          key={song.id}
          className="flex items-center justify-between rounded-xl bg-stone-100 dark:bg-stone-800 border-l-4 border-[#f2b127] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
              {song.title}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {song.author}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(song.id)}
            className="shrink-0 ml-3 p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            aria-label={`Remove ${song.title}`}
          >
            <X className="h-4 w-4 text-stone-500" />
          </button>
        </div>
      ))}
    </div>
  );
}

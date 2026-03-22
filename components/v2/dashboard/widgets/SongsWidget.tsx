'use client';

import { Music, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SongSummary {
  id: string;
  title: string;
  artist: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface SongsWidgetProps {
  songs: SongSummary[];
}

const difficultyStyles: Record<string, string> = {
  Easy: 'bg-green-500/10 text-green-400',
  Medium: 'bg-primary/10 text-primary',
  Hard: 'bg-destructive/10 text-destructive',
};

export function SongsWidget({ songs }: SongsWidgetProps) {
  const displaySongs = songs.slice(0, 5);

  return (
    <section className="bg-card rounded-[10px] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground font-bold text-lg">
          Song Library ({songs.length})
        </h2>
        <Link
          href="/dashboard/songs"
          className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold"
        >
          VIEW ALL
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No songs yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add songs to your library
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {displaySongs.map((song) => (
            <Link
              key={song.id}
              href={`/dashboard/songs/${song.id}`}
              className="flex items-center justify-between p-3 rounded-lg
                         hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5
                  rounded-full ${difficultyStyles[song.difficulty] ?? difficultyStyles.Medium}`}>
                  {song.difficulty}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

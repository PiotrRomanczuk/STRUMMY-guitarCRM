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
  Easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function SongsWidget({ songs }: SongsWidgetProps) {
  const displaySongs = songs.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-primary" />
          <span className="text-primary">Song Library</span>
          <span className="text-muted-foreground">({songs.length})</span>
        </h3>
        <Link
          href="/dashboard/songs"
          className="text-xs text-primary font-medium hover:underline"
        >
          View all
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
        <div className="divide-y divide-border/30">
          {displaySongs.map((song) => (
            <Link
              key={song.id}
              href={`/dashboard/songs/${song.id}`}
              className="flex items-center justify-between px-4 py-3
                         hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {song.artist}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5
                              text-[11px] font-medium border
                              ${difficultyStyles[song.difficulty] || difficultyStyles.Medium}`}
                >
                  {song.difficulty}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

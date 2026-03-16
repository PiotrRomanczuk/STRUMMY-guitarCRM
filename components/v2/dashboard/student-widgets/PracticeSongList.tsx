import Link from 'next/link';
import { Music } from 'lucide-react';

interface PracticeSongListProps {
  songs: {
    id: string;
    title: string;
    artist: string;
    last_played: string;
  }[];
}

export function PracticeSongList({ songs }: PracticeSongListProps) {
  if (songs.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Practice Songs
        </h2>
        <p className="text-sm text-muted-foreground py-2">
          No songs in your repertoire yet. Ask your teacher to add some!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Practice Songs
        </h2>
        <Link
          href="/dashboard/songs"
          className="text-xs text-primary font-medium min-h-[44px] flex items-center"
        >
          View all
        </Link>
      </div>
      <div className="space-y-1">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/dashboard/songs/${song.id}`}
            className="flex items-center gap-3 rounded-lg p-2.5
                       active:bg-muted/50 transition-colors min-h-[44px]"
          >
            <div className="shrink-0 p-1.5 rounded-md bg-muted">
              <Music className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {song.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {song.artist}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatRelative(song.last_played)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

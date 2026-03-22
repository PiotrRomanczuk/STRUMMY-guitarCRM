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
      <section className="rounded-[10px] bg-card p-5">
        <h2 className="text-foreground font-bold text-xl mb-2">My Songs</h2>
        <p className="text-sm text-muted-foreground py-2">
          No songs in your repertoire yet. Ask your teacher to add some!
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-foreground font-bold text-xl">My Songs</h2>
        <Link
          href="/dashboard/songs"
          className="text-[10px] font-bold uppercase tracking-widest
                     text-muted-foreground hover:text-primary transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2"
           style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/dashboard/songs/${song.id}`}
            className="min-w-[200px] bg-card p-5 rounded-[10px] flex flex-col gap-3
                       shrink-0 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-bold truncate">{song.title}</p>
              <p className="text-muted-foreground text-xs truncate">{song.artist}</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {formatRelative(song.last_played)}
            </span>
          </Link>
        ))}
      </div>
    </section>
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

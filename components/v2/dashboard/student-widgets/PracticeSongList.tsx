import Link from 'next/link';
import { Music } from 'lucide-react';

type RepertoireItem = {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  current_status: string;
  self_rating: number | null;
  priority: string;
  last_practiced_at: string | null;
  total_practice_minutes: number;
};

const STATUS_COLORS: Record<string, string> = {
  to_learn: 'bg-slate-500',
  started: 'bg-blue-500',
  remembered: 'bg-amber-500',
  with_author: 'bg-purple-500',
  mastered: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  to_learn: 'To Learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
  mastered: 'Mastered',
};

interface PracticeSongListProps {
  songs: { id: string; title: string; artist: string; last_played: string }[];
  repertoire?: RepertoireItem[];
}

export function PracticeSongList({ songs, repertoire }: PracticeSongListProps) {
  const items = repertoire || songs.map((s) => ({
    id: s.id, song_id: s.id, title: s.title, artist: s.artist,
    current_status: 'to_learn', self_rating: null, priority: 'normal',
    last_practiced_at: s.last_played || null, total_practice_minutes: 0,
  }));

  if (items.length === 0) {
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
          href="/dashboard/repertoire"
          className="text-[10px] font-bold uppercase tracking-widest
                     text-muted-foreground hover:text-primary transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2"
           style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/songs/${item.song_id}`}
            className="min-w-[200px] bg-card p-5 rounded-[10px] flex flex-col gap-3
                       shrink-0 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${STATUS_COLORS[item.current_status] || 'bg-slate-500'}`}>
                {STATUS_LABELS[item.current_status] || item.current_status}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-bold truncate">{item.title}</p>
              <p className="text-muted-foreground text-xs truncate">{item.artist}</p>
            </div>
            <div className="flex items-center justify-between">
              {item.self_rating ? (
                <span className="text-[10px] text-amber-500 font-medium">
                  {'★'.repeat(item.self_rating)}{'☆'.repeat(5 - item.self_rating)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">No rating</span>
              )}
              <span className="text-[10px] text-muted-foreground font-medium">
                {item.last_practiced_at ? formatRelative(item.last_practiced_at) : 'Not practiced'}
              </span>
            </div>
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

import Link from 'next/link';
import { Music, Play } from 'lucide-react';
import type { RepertoireItem } from '@/app/actions/student/dashboard';

interface PracticeTodayProps {
  repertoire: RepertoireItem[];
  recentSongs: { id: string; title: string; artist: string; last_played: string }[];
}

type PracticeRow = {
  id: string;
  title: string;
  artist: string;
  href: string;
};

function pickPracticeSongs(
  repertoire: RepertoireItem[],
  recentSongs: PracticeTodayProps['recentSongs']
): PracticeRow[] {
  if (repertoire.length > 0) {
    return [...repertoire]
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        const ta = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
        const tb = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
        return ta - tb; // oldest first
      })
      .slice(0, 3)
      .map((r) => ({
        id: r.song_id,
        title: r.song_title,
        artist: r.song_author ?? 'Unknown',
        href: `/dashboard/songs/${r.song_id}?action=practice`,
      }));
  }
  return recentSongs.slice(0, 3).map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    href: `/dashboard/songs/${s.id}?action=practice`,
  }));
}

export function PracticeToday({ repertoire, recentSongs }: PracticeTodayProps) {
  const songs = pickPracticeSongs(repertoire, recentSongs);

  return (
    <section className="bg-card rounded-[10px] p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-muted-foreground text-xs font-black uppercase tracking-widest">
          Practice Today
        </h2>
      </div>

      {songs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No songs in your repertoire yet. Your teacher will add some during your next lesson.
        </p>
      ) : (
        <ul className="space-y-3">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-foreground truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
              <Link
                href={song.href}
                className="shrink-0 flex items-center gap-1.5 bg-primary/10 text-primary
                           text-xs font-bold px-3 py-1.5 rounded-full
                           hover:bg-primary/20 transition-colors"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                Start
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

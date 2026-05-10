import Link from 'next/link';
import { Music } from 'lucide-react';

export function ChordQuizCard() {
  return (
    <Link
      href="/dashboard/skills/chord-quiz"
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Music className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold group-hover:text-primary">Chord Quiz</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drill chord recognition. 10 quick questions.
        </p>
      </div>
    </Link>
  );
}

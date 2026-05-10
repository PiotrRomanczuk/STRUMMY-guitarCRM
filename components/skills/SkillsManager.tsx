import Link from 'next/link';
import { Music } from 'lucide-react';

export function SkillsManager() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold lg:text-3xl">Skills</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Drills students can practice on their own.
      </p>

      <Link
        href="/dashboard/skills/chord-quiz"
        className="group flex items-start gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Music className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold group-hover:text-primary">Chord Quiz</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Identify chords from their diagrams. 10 questions per round.
          </p>
        </div>
      </Link>
    </div>
  );
}

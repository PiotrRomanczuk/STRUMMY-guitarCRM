import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChordsDueCount } from '@/app/actions/chord-srs';

/**
 * Skills hub (CHT-2). Un-orphans the chord quiz — previously reachable only by
 * direct URL behind a "Coming soon" stub. Teachers assign a chord drill from any
 * assignment (ASG-4); this hub is the standalone way in.
 */
export default async function Page() {
  const due = await getChordsDueCount();
  const dueCount = 'count' in due ? due.count : 0;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Practice tools. Assign a chord drill from any assignment to send one to a student.
        </p>
      </header>

      <Link href="/dashboard/skills/chord-quiz" className="block">
        <Card className="transition-colors hover:border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Chord Quiz</span>
              {dueCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {dueCount} due
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Identify chord shapes from the diagram; spaced repetition brings the weak ones back
            sooner.
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

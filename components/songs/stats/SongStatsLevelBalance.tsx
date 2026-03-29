'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LevelBalance } from '@/types/SongStatsEngagement';

interface Props {
  levels: LevelBalance[];
}

const LEVEL_COLORS: Record<string, { bar: string; unused: string }> = {
  beginner: { bar: 'bg-green-500', unused: 'bg-green-500/20' },
  intermediate: { bar: 'bg-amber-500', unused: 'bg-amber-500/20' },
  advanced: { bar: 'bg-red-500', unused: 'bg-red-500/20' },
  Unknown: { bar: 'bg-slate-500', unused: 'bg-slate-500/20' },
};

export function SongStatsLevelBalance({ levels }: Props) {
  const maxSongs = Math.max(...levels.map((l) => l.totalSongs), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Balance</CardTitle>
        <CardDescription>Song availability and usage by difficulty level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {levels.map((level) => {
          const colors = LEVEL_COLORS[level.level] ?? LEVEL_COLORS.Unknown;
          const totalWidth = (level.totalSongs / maxSongs) * 100;
          const usedPct = level.totalSongs > 0 ? (level.songsInUse / level.totalSongs) * 100 : 0;

          return (
            <div key={level.level} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium capitalize">{level.level}</span>
                <span className="text-muted-foreground">
                  {level.songsInUse} / {level.totalSongs} in use
                  {level.uniqueStudents > 0 && ` · ${level.uniqueStudents} students`}
                </span>
              </div>
              <div
                className="h-6 flex rounded-md overflow-hidden"
                style={{ width: `${totalWidth}%` }}
              >
                <div className={`${colors.bar}`} style={{ width: `${usedPct}%` }} />
                <div className={`${colors.unused} flex-1`} />
              </div>
            </div>
          );
        })}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-500" /> In use
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-500/20" /> Available
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

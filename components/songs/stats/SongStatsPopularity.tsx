'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SongEngagement } from '@/types/SongStatsEngagement';

interface Props {
  songs: SongEngagement[];
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-amber-500/10 text-amber-500',
  advanced: 'bg-red-500/10 text-red-500',
};

function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  return <span className={`font-mono text-xs ${color}`}>{score}%</span>;
}

export function SongStatsPopularity({ songs }: Props) {
  if (songs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Songs</CardTitle>
          <CardDescription>No songs assigned to students yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Popular Songs</CardTitle>
        <CardDescription>Top {songs.length} songs ranked by student count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left py-2 pr-4">#</th>
                <th className="text-left py-2 pr-4">Song</th>
                <th className="text-left py-2 pr-4 hidden sm:table-cell">Level</th>
                <th className="text-right py-2 pr-4">Students</th>
                <th className="text-right py-2 pr-4 hidden md:table-cell">Mastered</th>
                <th className="text-right py-2 pr-4 hidden md:table-cell">Lessons</th>
                <th className="text-right py-2">Health</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, i) => (
                <tr key={song.songId} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <div className="font-medium">{song.title}</div>
                    <div className="text-xs text-muted-foreground">{song.author}</div>
                  </td>
                  <td className="py-2 pr-4 hidden sm:table-cell">
                    <Badge variant="outline" className={LEVEL_COLORS[song.level ?? ''] ?? ''}>
                      {song.level ?? 'unknown'}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">{song.totalStudents}</td>
                  <td className="py-2 pr-4 text-right font-mono hidden md:table-cell">
                    {song.masteredCount}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono hidden md:table-cell">
                    {song.lessonAppearances}
                  </td>
                  <td className="py-2 text-right">
                    <HealthBadge score={song.healthScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

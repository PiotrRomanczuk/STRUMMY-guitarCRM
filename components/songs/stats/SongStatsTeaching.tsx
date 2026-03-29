'use client';

import { Loader2, BookOpen, Users, Target, Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSongStatsEngagement } from '../hooks/useSongStatsEngagement';
import { SongStatsPopularity } from './SongStatsPopularity';
import { SongStatsMasteryFunnel } from './SongStatsMasteryFunnel';
import { SongStatsLevelBalance } from './SongStatsLevelBalance';
import { SongStatsDeadLibrary } from './SongStatsDeadLibrary';

export function SongStatsTeaching() {
  const { data, isLoading, error } = useSongStatsEngagement();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Failed to load teaching statistics.
      </div>
    );
  }

  const { summary, masteryFunnel } = data;
  const funnelTotal = Object.values(masteryFunnel).reduce((a, b) => a + b, 0);

  const kpis = [
    {
      title: 'Songs in Active Use',
      value: `${summary.songsInUse} / ${summary.totalSongs}`,
      icon: BookOpen,
      color: 'text-blue-500',
      subtitle: `${summary.percentInUse}% of library`,
    },
    {
      title: 'Active Students',
      value: summary.totalStudentsLearning.toString(),
      icon: Users,
      color: 'text-purple-500',
      subtitle: 'learning songs',
    },
    {
      title: 'Mastery Rate',
      value: `${summary.overallMasteryRate}%`,
      icon: Target,
      color: 'text-emerald-500',
      subtitle: `${masteryFunnel.mastered} of ${funnelTotal} mastered`,
    },
    {
      title: 'Unused Songs',
      value: data.deadSongs.length.toString(),
      icon: Archive,
      color: 'text-amber-500',
      subtitle: `${Math.round((data.deadSongs.length / summary.totalSongs) * 100)}% never assigned`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SongStatsMasteryFunnel funnel={masteryFunnel} />
        <SongStatsLevelBalance levels={data.levelBalance} />
      </div>

      <SongStatsPopularity songs={data.popularity} />
      <SongStatsDeadLibrary songs={data.deadSongs} totalSongs={summary.totalSongs} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SongEngagement } from '@/types/SongStatsEngagement';

interface Props {
  songs: SongEngagement[];
  totalSongs: number;
}

export function SongStatsDeadLibrary({ songs, totalSongs }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displaySongs = isExpanded ? songs : songs.slice(0, 10);

  if (songs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Unused Songs</span>
          <Badge variant="outline" className="text-amber-500 bg-amber-500/10">
            {songs.length} / {totalSongs}
          </Badge>
        </CardTitle>
        <CardDescription>
          Songs never assigned to any student or lesson. Consider archiving or assigning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {displaySongs.map((song) => (
            <div
              key={song.songId}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <div className="min-w-0">
                <span className="font-medium text-sm truncate">{song.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{song.author}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {song.level ?? 'unknown'}
                </Badge>
                <span className="text-xs text-muted-foreground w-6 text-right">
                  {song.key ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {songs.length > 10 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Show less' : `Show all ${songs.length} unused songs`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

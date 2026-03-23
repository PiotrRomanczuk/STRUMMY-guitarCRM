'use client';

import { RepertoireItem } from '@/app/dashboard/users/[id]/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';

type Props = {
  repertoire: RepertoireItem[];
};

const STATUS_GROUPS = {
  Mastered: ['mastered'],
  'In Progress': ['started', 'remembered', 'with_author'],
  'To Learn': ['to_learn'],
};

const STATUS_COLORS: Record<string, string> = {
  mastered: 'bg-success hover:bg-success/90',
  started: 'bg-primary hover:bg-primary/90',
  remembered: 'bg-warning hover:bg-warning/90',
  with_author: 'bg-primary hover:bg-primary/90',
  to_learn: 'bg-muted-foreground hover:bg-muted-foreground/90',
};

const STATUS_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  with_author: 'Play Along',
  remembered: 'Remembered',
  started: 'Started',
  to_learn: 'To Learn',
};

export function StudentRepertoire({ repertoire }: Props) {
  const groupedSongs = {
    Mastered: repertoire.filter((item) => STATUS_GROUPS.Mastered.includes(item.status)),
    'In Progress': repertoire.filter((item) => STATUS_GROUPS['In Progress'].includes(item.status)),
    'To Learn': repertoire.filter((item) => STATUS_GROUPS['To Learn'].includes(item.status)),
  };

  return (
    <div className="space-y-6">
      {(Object.keys(groupedSongs) as Array<keyof typeof groupedSongs>).map((group) => {
        const songs = groupedSongs[group];
        if (songs.length === 0) return null;

        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {group} ({songs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {songs.map((song) => (
                  <Card key={song.songId} className="flex flex-col justify-between p-3 shadow-sm">
                    <div>
                      <h4 className="font-medium">{song.title}</h4>
                      <p className="text-sm text-muted-foreground">{song.author}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={STATUS_COLORS[song.status] || 'bg-muted-foreground'}>
                            {STATUS_LABELS[song.status] || song.status.replace('_', ' ')}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {SONG_STATUS_DESCRIPTIONS[song.status as keyof typeof SONG_STATUS_DESCRIPTIONS] || song.status}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-muted-foreground">
                        {new Date(song.lastPlayed).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {repertoire.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No songs in repertoire yet.</div>
      )}
    </div>
  );
}

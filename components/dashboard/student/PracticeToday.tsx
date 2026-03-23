'use client';

import { useState } from 'react';
import { Music, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';

type SongStatus = 'to_learn' | 'started' | 'remembered' | 'with_author' | 'mastered';

export interface PracticeTodaySong {
  id: string;
  title: string;
  artist: string;
  status: SongStatus;
  lastLessonDate?: string;
}

interface PracticeTodayProps {
  songs: PracticeTodaySong[];
}

const STATUS_CONFIG: Record<SongStatus, { label: string; className: string }> = {
  to_learn: { label: 'To Learn', className: 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  started: { label: 'Started', className: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  remembered: { label: 'Remembered', className: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  with_author: { label: 'Play Along', className: 'border-transparent bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  mastered: { label: 'Mastered', className: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

function getRelativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function SongItem({ song }: { song: PracticeTodaySong }) {
  const config = STATUS_CONFIG[song.status];
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm sm:text-base">{song.title}</p>
        <p className="truncate text-xs sm:text-sm text-muted-foreground">{song.artist}</p>
        {song.lastLessonDate && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            Last practiced: {getRelativeTime(song.lastLessonDate)}
          </p>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn('shrink-0', config.className)}>{config.label}</Badge>
        </TooltipTrigger>
        <TooltipContent side="left">
          {SONG_STATUS_DESCRIPTIONS[song.status as keyof typeof SONG_STATUS_DESCRIPTIONS] || song.status}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function PracticeToday({ songs }: PracticeTodayProps) {
  const [isMasteredOpen, setIsMasteredOpen] = useState(false);
  const activeSongs = songs.filter((s) => s.status !== 'mastered');
  const masteredSongs = songs.filter((s) => s.status === 'mastered');

  if (songs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <CardTitle>Today&apos;s Practice</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No songs assigned yet. Your teacher will add songs during your next lesson.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <CardTitle>Today&apos;s Practice</CardTitle>
        </div>
        <CardDescription>
          {activeSongs.length} {activeSongs.length === 1 ? 'song' : 'songs'} to focus on
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSongs.map((song) => (
          <SongItem key={song.id} song={song} />
        ))}
        {masteredSongs.length > 0 && (
          <Collapsible open={isMasteredOpen} onOpenChange={setIsMasteredOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>{masteredSongs.length} mastered {masteredSongs.length === 1 ? 'song' : 'songs'}</span>
              <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform duration-200', isMasteredOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {masteredSongs.map((song) => (
                <SongItem key={song.id} song={song} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

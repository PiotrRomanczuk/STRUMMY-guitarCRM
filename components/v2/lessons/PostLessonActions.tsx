'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, Loader2, Music, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  quickAssignSongFromLesson,
  bulkAssignSongsFromLesson,
} from '@/app/dashboard/lessons/actions';

type SongStatus = 'idle' | 'loading' | 'assigned' | 'exists' | 'error';

interface SongRow {
  id: string;
  title: string;
}

interface PostLessonActionsProps {
  lessonId: string;
  studentId: string;
  songs: SongRow[];
}

export function PostLessonActions({ lessonId, studentId, songs }: PostLessonActionsProps) {
  const [statuses, setStatuses] = useState<Record<string, SongStatus>>({});
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);

  const handleAssignOne = useCallback(
    async (song: SongRow) => {
      setStatuses((prev) => ({ ...prev, [song.id]: 'loading' }));
      const result = await quickAssignSongFromLesson(lessonId, song.id, song.title, studentId);
      if ('success' in result) {
        setStatuses((prev) => ({ ...prev, [song.id]: 'assigned' }));
      } else if ('alreadyExists' in result) {
        setStatuses((prev) => ({ ...prev, [song.id]: 'exists' }));
      } else {
        setStatuses((prev) => ({ ...prev, [song.id]: 'error' }));
      }
    },
    [lessonId, studentId]
  );

  const handleBulkAssign = useCallback(async () => {
    setIsBulkLoading(true);
    const result = await bulkAssignSongsFromLesson(lessonId, songs, studentId);
    setBulkResult(result);
    const newStatuses: Record<string, SongStatus> = {};
    for (const song of songs) {
      newStatuses[song.id] = 'assigned';
    }
    setStatuses(newStatuses);
    setIsBulkLoading(false);
  }, [lessonId, songs, studentId]);

  const allDone = songs.every((s) => statuses[s.id] === 'assigned' || statuses[s.id] === 'exists');

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Assign Practice
          </span>
        </div>
        {!allDone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkAssign}
            disabled={isBulkLoading}
            className="min-h-[36px] gap-1.5 text-xs"
          >
            {isBulkLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Music className="h-3.5 w-3.5" />
            )}
            Assign All
          </Button>
        )}
      </div>

      {/* Bulk result banner */}
      {bulkResult && (
        <p className="text-xs text-muted-foreground">
          {bulkResult.created} assigned, {bulkResult.skipped} skipped
        </p>
      )}

      {/* Song rows */}
      <div className="space-y-1">
        {songs.map((song) => {
          const status = statuses[song.id] ?? 'idle';
          const isRowDone = status === 'assigned' || status === 'exists';
          return (
            <div
              key={song.id}
              className={cn(
                'flex items-center justify-between rounded-lg border border-border px-4 py-2.5',
                'min-h-[44px] bg-background',
                isRowDone && 'opacity-60'
              )}
            >
              <p className="text-sm font-medium truncate mr-2">{song.title}</p>
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
              {status === 'assigned' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
              {status === 'exists' && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">Already assigned</span>
              )}
              {status === 'error' && (
                <span className="text-xs text-destructive whitespace-nowrap">Failed</span>
              )}
              {status === 'idle' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAssignOne(song)}
                  className="min-h-[36px] text-xs shrink-0"
                >
                  Assign
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

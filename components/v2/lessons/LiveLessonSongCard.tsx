'use client';

import { useCallback, useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';
import { toast } from 'sonner';
import { useHaptic } from '@/hooks/use-haptic';
import { updateLessonSongStatus } from '@/app/dashboard/lessons/actions';
import { StatusStepper } from '@/components/lessons/live/StatusStepper';
import {
  LessonSongStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  LiveLessonSong,
} from '@/components/lessons/live/live-lesson.types';
import { SongNotes } from './LiveLessonSongCard.Notes';

interface LiveLessonSongCardProps {
  lessonId: string;
  lessonSong: LiveLessonSong;
}

/** Enhanced live lesson song card with status stepper and per-song quick notes. */
export function LiveLessonSongCard({ lessonId, lessonSong }: LiveLessonSongCardProps) {
  const [status, setStatus] = useState<LessonSongStatus>(lessonSong.status);
  const [isPending, startTransition] = useTransition();
  const haptic = useHaptic();

  const handleStatusChange = useCallback(
    (newStatus: LessonSongStatus) => {
      const previousStatus = status;
      haptic(newStatus === 'mastered' ? 'success' : 'light');
      setStatus(newStatus);

      startTransition(async () => {
        try {
          if (!lessonSong.song) return;
          await updateLessonSongStatus(lessonId, lessonSong.song.id, newStatus);
          toast.success(`Status: ${STATUS_LABELS[newStatus]}`);
        } catch (error: unknown) {
          haptic('error');
          setStatus(previousStatus);
          const message = error instanceof Error ? error.message : 'Failed to update status';
          toast.error(message);
        }
      });
    },
    [lessonId, lessonSong.song, status, haptic]
  );

  if (!lessonSong.song) return null;

  const colors = STATUS_COLORS[status];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-lg p-2 shrink-0 ${colors.bg}`}>
              <Music className={`size-5 ${colors.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-lg leading-tight truncate">
                {lessonSong.song.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {lessonSong.song.author}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={`shrink-0 ${colors.bg} ${colors.text}`}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>

        <StatusStepper
          currentStatus={status}
          onStatusChange={handleStatusChange}
          isDisabled={isPending}
        />

        <SongNotes
          lessonId={lessonId}
          songId={lessonSong.song.id}
          initialNotes={lessonSong.notes}
        />
      </CardContent>
    </Card>
  );
}

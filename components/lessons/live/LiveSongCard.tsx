'use client';

import { useCallback, useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';
import { toast } from 'sonner';
import { useHaptic } from '@/hooks/use-haptic';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import { updateLessonSongStatus } from '@/app/dashboard/lessons/actions';
import { StatusStepper } from './StatusStepper';
import {
  LessonSongStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  LiveLessonSong,
} from './live-lesson.types';

interface LiveSongCardProps {
  lessonId: string;
  lessonSong: LiveLessonSong;
}

export function LiveSongCard({ lessonId, lessonSong }: LiveSongCardProps) {
  const [status, setStatus] = useState<LessonSongStatus>(lessonSong.status);
  const [isPending, startTransition] = useTransition();
  const haptic = useHaptic();

  const handleStatusChange = useCallback(
    (newStatus: LessonSongStatus) => {
      const previousStatus = status;
      haptic(newStatus === 'mastered' ? 'success' : 'light');
      setStatus(newStatus); // Optimistic update

      startTransition(async () => {
        try {
          if (!lessonSong.song) return;
          await updateLessonSongStatus(lessonId, lessonSong.song.id, newStatus);
          toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
        } catch (error: unknown) {
          haptic('error');
          setStatus(previousStatus); // Revert on error
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
      <CardContent className="p-4 sm:p-6 space-y-4">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={`shrink-0 ${colors.bg} ${colors.text}`}
              >
                {STATUS_LABELS[status]}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left">
              {SONG_STATUS_DESCRIPTIONS[status as keyof typeof SONG_STATUS_DESCRIPTIONS] || status}
            </TooltipContent>
          </Tooltip>
        </div>

        <StatusStepper
          currentStatus={status}
          onStatusChange={handleStatusChange}
          isDisabled={isPending}
        />
      </CardContent>
    </Card>
  );
}

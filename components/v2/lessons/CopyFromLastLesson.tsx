'use client';

import { useCallback, useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getLastLessonSongs } from '@/app/dashboard/lessons/previous-songs-action';
import type { PreviousLessonSong } from '@/app/dashboard/lessons/previous-songs-action';
import { formatPreviewDate } from '@/lib/lessons/recurring-dates';

interface CopyFromLastLessonProps {
  studentId: string;
  onSongsCopied: (songIds: string[]) => void;
}

export function CopyFromLastLesson({ studentId, onSongsCopied }: CopyFromLastLessonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!studentId) {
      toast.error('Please select a student first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getLastLessonSongs(studentId);

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      if (result.songs.length === 0) {
        toast.info('No songs found in previous lessons for this student');
        return;
      }

      const songIds = result.songs.map((s: PreviousLessonSong) => s.songId);
      onSongsCopied(songIds);

      const dateLabel = result.lessonDate ? formatPreviewDate(result.lessonDate) : '';
      const songNames = result.songs.map((s: PreviousLessonSong) => s.title).join(', ');

      toast.success(
        `Copied ${result.songs.length} song${result.songs.length === 1 ? '' : 's'} from ${dateLabel}`,
        { description: songNames }
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load previous songs'
      );
    } finally {
      setIsLoading(false);
    }
  }, [studentId, onSongsCopied]);

  if (!studentId) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={isLoading}
      className="gap-1.5 text-xs"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      Copy from last lesson
    </Button>
  );
}

'use client';

import { useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, ArrowLeft, CircleStop, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { LiveLessonSongCard } from './LiveLessonSongCard';
import { LiveLessonNotes } from '@/components/lessons/live/LiveLessonNotes';
import { updateLessonStatus } from '@/components/lessons/live/actions';
import { formatLessonDate } from './lesson.helpers';
import type { LiveLessonV2Props } from './LiveLesson';

/**
 * v2 Mobile Live Lesson view.
 * Focused layout with large song status steppers and full-width notes.
 * Sticky top bar with student name and end/back button.
 */
export function LiveLessonMobile({ lesson }: LiveLessonV2Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const songsWithData = lesson.lessonSongs.filter((ls) => ls.song !== null);
  const isCompleted = lesson.status === 'COMPLETED';

  const handleComplete = useCallback(() => {
    startTransition(async () => {
      try {
        await updateLessonStatus(lesson.id, 'COMPLETED');
        toast.success('Lesson marked as completed');
        router.push(`/dashboard/lessons/${lesson.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to complete lesson';
        toast.error(message);
      }
    });
  }, [lesson.id, router]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Sticky top bar */}
      <header
        className={cn(
          'sticky top-0 z-30 bg-background/95 backdrop-blur-sm',
          'border-b border-border px-4 py-3'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 min-h-[44px] min-w-[44px]"
              asChild
            >
              <Link
                href={`/dashboard/lessons/${lesson.id}`}
                aria-label="Back to lesson"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {lesson.studentName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatLessonDate(lesson.scheduledAt)}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 shrink-0 min-h-[44px]"
            asChild
          >
            <Link href={`/dashboard/lessons/${lesson.id}`}>
              <CircleStop className="h-4 w-4" />
              <span className="hidden xs:inline">
                {isCompleted ? 'Close' : 'End'}
              </span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Scrollable content */}
      <div
        className={cn(
          'flex-1 px-4 py-4 space-y-4',
          'pb-[calc(4rem+env(safe-area-inset-bottom))]'
        )}
      >
        {/* Songs section */}
        {songsWithData.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Music className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Songs ({songsWithData.length})
              </span>
            </div>
            {songsWithData.map((ls) => (
              <motion.div key={ls.id} variants={listItem}>
                <LiveLessonSongCard lessonId={lesson.id} lessonSong={ls} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <LiveEmptySongs />
        )}

        {/* Notes section */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Lesson Notes
            </span>
          </div>
          <LiveLessonNotes
            lessonId={lesson.id}
            initialNotes={lesson.notes ?? ''}
          />
        </div>

        {/* Complete lesson button */}
        {!isCompleted && (
          <div className="pt-2 border-t border-border">
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full gap-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
            >
              <CheckCircle2 className="h-5 w-5" />
              {isPending ? 'Completing...' : 'Mark Lesson as Completed'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEmptySongs() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Music className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No songs assigned</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Add songs to this lesson from the lesson detail page.
      </p>
    </div>
  );
}

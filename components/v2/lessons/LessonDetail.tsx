'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pencil, Trash2, MoreHorizontal, Calendar, User, Music, FileText, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance, staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { BottomActionSheet } from '@/components/v2/primitives/BottomActionSheet';
import { Button } from '@/components/ui/button';
import { InfoRow } from './LessonDetail.InfoRow';
import { PostLessonActions } from './PostLessonActions';
import { formatLessonDate, formatLessonTime, getLessonStatusStyle, getLessonStatusLabel } from './lesson.helpers';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';
import type { Database } from '@/database.types';

interface LessonSongItem {
  id: string;
  status: Database['public']['Enums']['lesson_song_status'];
  song: { id: string; title: string; author: string } | null;
}

interface LessonDetailV2Props {
  lesson: Omit<LessonWithProfiles, 'lesson_songs'> & {
    lesson_songs: LessonSongItem[];
    assignments: {
      id: string;
      title: string;
      status: Database['public']['Enums']['assignment_status'];
      due_date: string | null;
    }[];
  };
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}

export function LessonDetailV2({
  lesson,
  canEdit,
  canDelete,
  onDelete,
}: LessonDetailV2Props) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const isCompleted = lesson.status === 'COMPLETED';
  const isCancelled = lesson.status === 'CANCELLED';

  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  const handleLiveMode = useCallback(
    () => router.push(`/dashboard/lessons/${lesson.id}/live`),
    [router, lesson.id]
  );

  return (
    <MobilePageShell
      title={lesson.title || 'Lesson Detail'}
      headerActions={
        canEdit ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActionsOpen(true)}
            className="min-h-[44px] min-w-[44px]"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        ) : undefined
      }
    >
      {/* Status + Live Button */}
      <motion.div
        variants={cardEntrance}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1',
            'text-xs font-medium border',
            getLessonStatusStyle(lesson.status)
          )}
        >
          {getLessonStatusLabel(lesson.status)}
        </span>
        {canEdit && !isCancelled && (
          <Button onClick={handleLiveMode} size="sm" className="gap-2 min-h-[44px]">
            <Play className="h-4 w-4" />
            {isCompleted ? 'Review' : 'Start Lesson'}
          </Button>
        )}
      </motion.div>

      {/* Info Cards */}
      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
        <InfoRow icon={Calendar} label="Date" value={formatLessonDate(displayDate)} />
        {displayTime && (
          <InfoRow icon={Calendar} label="Time" value={formatLessonTime(displayTime)} />
        )}
        <InfoRow
          icon={User}
          label="Student"
          value={lesson.profile?.full_name || lesson.profile?.email || 'Unknown'}
        />
        <InfoRow
          icon={User}
          label="Teacher"
          value={
            lesson.teacher_profile?.full_name ||
            lesson.teacher_profile?.email ||
            'Unknown'
          }
        />
        {lesson.lesson_teacher_number && (
          <InfoRow icon={Hash} label="Lesson #" value={String(lesson.lesson_teacher_number)} />
        )}
      </div>

      {/* Notes */}
      {lesson.notes && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">Notes</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{lesson.notes}</p>
        </div>
      )}

      {/* Songs */}
      {lesson.lesson_songs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Music className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Songs ({lesson.lesson_songs.length})
            </span>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {lesson.lesson_songs
              .filter((ls) => ls.song !== null)
              .map((ls) => (
                <motion.div key={ls.id} variants={listItem}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/songs/${ls.song!.id}`)}
                    className={cn(
                      'w-full text-left flex items-center justify-between',
                      'bg-card rounded-lg border border-border px-4 py-3',
                      'min-h-[44px] active:bg-muted/50 transition-colors'
                    )}
                  >
                    <p className="text-sm font-medium truncate">{ls.song!.title}</p>
                  </button>
                </motion.div>
              ))}
          </motion.div>
        </div>
      )}

      {/* Post-Lesson Quick Assign */}
      {isCompleted && canEdit && lesson.lesson_songs.length > 0 && (
        <PostLessonActions
          lessonId={lesson.id!}
          studentId={lesson.student_id}
          songs={lesson.lesson_songs
            .filter((ls) => ls.song !== null)
            .map((ls) => ({ id: ls.song!.id, title: ls.song!.title }))}
        />
      )}

      {/* Actions Bottom Sheet */}
      {canEdit && (
        <BottomActionSheet
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title="Lesson Actions"
          actions={[
            {
              icon: <Pencil className="h-5 w-5" />,
              label: 'Edit Lesson',
              onClick: () => router.push(`/dashboard/lessons/${lesson.id}/edit`),
            },
            ...(canDelete
              ? [
                  {
                    icon: <Trash2 className="h-5 w-5" />,
                    label: 'Delete Lesson',
                    onClick: onDelete,
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
      )}
    </MobilePageShell>
  );
}

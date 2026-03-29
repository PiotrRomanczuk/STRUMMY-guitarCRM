'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { getLessonStatusStyle, getLessonStatusLabel } from './lesson.helpers';
import { NotesCard } from './LessonDetail.NotesCard';
import { SongsCard } from './LessonDetail.SongsCard';
import { AssignmentsCard } from './LessonDetail.AssignmentsCard';
import { DetailsCard } from './LessonDetail.DetailsCard';
import { StudentAssignments } from './LessonDetail.StudentAssignments';
import type { LessonDetailV2Props } from './LessonDetail.types';

export default function LessonDetailDesktop({
  lesson,
  canEdit,
  canDelete,
  onDelete,
}: LessonDetailV2Props) {
  const router = useRouter();

  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <div className="px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <motion.div
        variants={cardEntrance}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between"
      >
        <div>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 mb-2',
              'text-xs font-medium border',
              getLessonStatusStyle(lesson.status)
            )}
          >
            {getLessonStatusLabel(lesson.status)}
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {lesson.title || 'Lesson Detail'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lesson.profile?.full_name || lesson.profile?.email || 'Unknown student'}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/lessons/${lesson.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {canDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <NotesCard notes={lesson.notes ?? null} />
          <SongsCard lessonSongs={lesson.lesson_songs} studentId={lesson.student_id} />
          <AssignmentsCard
            assignments={lesson.assignments}
            lessonId={lesson.id ?? undefined}
            studentId={lesson.student_id}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <DetailsCard
            displayDate={displayDate}
            displayTime={displayTime}
            studentName={
              lesson.profile?.full_name || lesson.profile?.email || 'Unknown'
            }
            teacherName={
              lesson.teacher_profile?.full_name ||
              lesson.teacher_profile?.email ||
              'Unknown'
            }
            lessonNumber={lesson.lesson_teacher_number ?? null}
            studentId={lesson.student_id}
            teacherId={lesson.teacher_id}
          />
          <StudentAssignments
            studentId={lesson.student_id}
            currentLessonId={lesson.id ?? ''}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateBlock } from '@/components/v2/primitives/DateBlock';
import { LessonStatusPill } from '@/components/v2/primitives/LessonStatusPill';
import { formatLessonTime } from './lesson.helpers';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

interface DesktopRowProps {
  lesson: LessonWithProfiles;
  showTeacherColumn: boolean;
  showStudentColumn: boolean;
  isLast?: boolean;
}

const SONG_DOT_COLORS: Record<string, string> = {
  to_learn: 'bg-muted-foreground',
  started: 'bg-blue-500',
  remembered: 'bg-amber-500',
  with_author: 'bg-purple-500',
  mastered: 'bg-emerald-500',
};

export function DesktopRow({ lesson, showTeacherColumn, showStudentColumn, isLast }: DesktopRowProps) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;
  const studentName = lesson.profile?.full_name || lesson.profile?.email || 'Unknown';
  const studentInitials = studentName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const songCount = lesson.lesson_songs?.length ?? 0;

  return (
    <Link
      href={`/dashboard/lessons/${lesson.id}`}
      className={cn(
        'grid items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30',
        !isLast && 'border-b border-border',
        showStudentColumn && showTeacherColumn
          ? 'grid-cols-[56px_2.3fr_1.3fr_1.3fr_1fr_110px_120px_40px]'
          : showStudentColumn
            ? 'grid-cols-[56px_2.3fr_1.3fr_1fr_110px_120px_40px]'
            : 'grid-cols-[56px_2.3fr_1fr_110px_120px_40px]'
      )}
    >
      <DateBlock date={displayDate} size="sm" />

      {/* Lesson title + number */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded shrink-0">
            #{lesson.lesson_teacher_number ?? lesson.lesson_number ?? '—'}
          </span>
          <span
            className={cn(
              'font-serif text-[15px] font-medium truncate',
              lesson.title ? 'text-foreground' : 'text-muted-foreground italic'
            )}
          >
            {lesson.title || 'Untitled lesson'}
          </span>
        </div>
        {lesson.notes && (
          <p className="text-muted-foreground text-xs mt-1 truncate">{lesson.notes}</p>
        )}
      </div>

      {/* Student */}
      {showStudentColumn && (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
            {studentInitials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium truncate">{studentName}</div>
          </div>
        </div>
      )}

      {/* Teacher */}
      {showTeacherColumn && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] truncate">
            {lesson.teacher_profile?.full_name || lesson.teacher_profile?.email || 'Unknown'}
          </span>
        </div>
      )}

      {/* Songs */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{songCount}</span>
        <span className="text-[11px] text-muted-foreground">{songCount === 1 ? 'song' : 'songs'}</span>
        {songCount > 0 && (
          <span className="inline-flex gap-[2px] ml-0.5">
            {(lesson.lesson_songs ?? []).slice(0, 4).map((ls, i) => {
              const status = (ls as unknown as { status?: string }).status ?? 'to_learn';
              return (
                <span key={i} className={cn('w-1 h-1 rounded-full', SONG_DOT_COLORS[status] ?? 'bg-muted-foreground')} />
              );
            })}
          </span>
        )}
      </div>

      {/* Time */}
      <div className="font-mono text-xs text-foreground">
        {formatLessonTime(displayTime)}
      </div>

      {/* Status */}
      <LessonStatusPill status={lesson.status} compact />

      {/* Arrow */}
      <div className="text-right">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}

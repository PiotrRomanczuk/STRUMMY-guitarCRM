import { Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatLessonDate,
  formatLessonTime,
  getLessonStatusStyle,
  getLessonStatusLabel,
} from './lesson.helpers';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

interface LessonCardProps {
  lesson: LessonWithProfiles;
  role: string;
  onTap: () => void;
}

export function LessonCard({ lesson, role, onTap }: LessonCardProps) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'w-full text-left bg-card rounded-xl border border-border p-4 space-y-2',
        'active:bg-muted/50 transition-colors'
      )}
    >
      {/* Row 1: Title + Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate text-foreground">
          {lesson.title || 'Untitled Lesson'}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5',
            'text-[11px] sm:text-xs font-medium border shrink-0',
            getLessonStatusStyle(lesson.status)
          )}
        >
          {getLessonStatusLabel(lesson.status)}
        </span>
      </div>

      {/* Row 2: Date + Time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>{formatLessonDate(displayDate)}</span>
        {displayTime && (
          <>
            <span aria-hidden>·</span>
            <span>{formatLessonTime(displayTime)}</span>
          </>
        )}
      </div>

      {/* Row 3: Student (or Teacher for student view) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {role === 'student'
            ? lesson.teacher_profile?.full_name ||
              lesson.teacher_profile?.email ||
              'Teacher'
            : lesson.profile?.full_name ||
              lesson.profile?.email ||
              'Student'}
        </span>
      </div>
    </button>
  );
}

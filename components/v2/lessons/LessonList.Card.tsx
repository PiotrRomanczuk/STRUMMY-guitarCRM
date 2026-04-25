'use client';

import { cn } from '@/lib/utils';
import { LessonStatusPill } from '@/components/v2/primitives/LessonStatusPill';
import { formatLessonTime } from './lesson.helpers';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

interface LessonCardProps {
  lesson: LessonWithProfiles;
  role: string;
  onTap: () => void;
}

const SONG_DOT_COLORS: Record<string, string> = {
  to_learn: 'bg-muted-foreground',
  started: 'bg-blue-500',
  remembered: 'bg-amber-500',
  with_author: 'bg-purple-500',
  mastered: 'bg-emerald-500',
};

export function LessonCard({ lesson, role, onTap }: LessonCardProps) {
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;
  const showStudent = role !== 'student';
  const person = showStudent
    ? lesson.profile?.full_name || lesson.profile?.email || 'Student'
    : lesson.teacher_profile?.full_name || lesson.teacher_profile?.email || 'Teacher';
  const initials = person.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const songCount = lesson.lesson_songs?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'w-full text-left bg-card border border-border rounded-[10px]',
        'px-3.5 py-3 cursor-pointer hover:bg-muted/30 transition-colors'
      )}
    >
      {/* Row 1: #number + time | status pill */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="flex-1 flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
            #{lesson.lesson_teacher_number ?? lesson.lesson_number ?? '—'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatLessonTime(displayTime)}
          </span>
        </div>
        <LessonStatusPill status={lesson.status} compact />
      </div>

      {/* Row 2: Title */}
      <div
        className={cn(
          'font-serif text-[17px] font-medium leading-tight tracking-[-0.01em] mb-2.5',
          lesson.title ? 'text-foreground' : 'text-muted-foreground italic'
        )}
      >
        {lesson.title || 'Untitled lesson'}
      </div>

      {/* Row 3: Student avatar + name + songs */}
      <div className="flex items-center gap-2">
        <div className="w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
          {initials}
        </div>
        <span className="text-[13px] font-medium truncate">{person}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {songCount} {songCount === 1 ? 'song' : 'songs'}
        </span>
        {songCount > 0 && (
          <span className="inline-flex gap-[3px] ml-auto">
            {(lesson.lesson_songs ?? []).slice(0, 5).map((ls, i) => {
              const status = (ls as unknown as { status?: string }).status ?? 'to_learn';
              return (
                <span
                  key={i}
                  className={cn('w-[5px] h-[5px] rounded-full', SONG_DOT_COLORS[status] ?? 'bg-muted-foreground')}
                />
              );
            })}
          </span>
        )}
      </div>
    </button>
  );
}

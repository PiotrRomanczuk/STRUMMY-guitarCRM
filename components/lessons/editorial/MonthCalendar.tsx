import Link from 'next/link';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

import type { LessonRow } from '@/lib/services/lessons-queries';
import { cn } from '@/lib/utils';

type Props = {
  lessons: LessonRow[];
  /** Any date inside the month to render. */
  month: Date;
  now: Date;
  /** Teacher/admin see the student's name on each event; students see the title. */
  showStudent: boolean;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_PER_DAY = 3;

// Standard-theme dot colours (the calendar page doesn't load editorial tokens).
const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-muted-foreground',
};

const dayKey = (d: Date): string => format(d, 'yyyy-MM-dd');
const monthParam = (d: Date): string => format(d, 'yyyy-MM');

const groupByDay = (lessons: LessonRow[]): Map<string, LessonRow[]> => {
  const map = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    const key = dayKey(new Date(l.scheduledAt));
    const bucket = map.get(key);
    if (bucket) bucket.push(l);
    else map.set(key, [l]);
  }
  return map;
};

const EventChip = ({ lesson, showStudent }: { lesson: LessonRow; showStudent: boolean }) => {
  const label = showStudent
    ? (lesson.studentName ?? lesson.studentEmail ?? 'Lesson')
    : (lesson.title ?? 'Lesson');
  return (
    <Link
      href={`/dashboard/lessons/${lesson.id}`}
      title={`${format(new Date(lesson.scheduledAt), 'HH:mm')} · ${label}`}
      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:bg-muted"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          STATUS_DOT[lesson.status.toLowerCase()] ?? 'bg-muted-foreground'
        )}
      />
      <span className="tabular-nums text-muted-foreground">
        {format(new Date(lesson.scheduledAt), 'HH:mm')}
      </span>
      <span className="truncate text-foreground">{label}</span>
    </Link>
  );
};

export function MonthCalendar({ lessons, month, now, showStudent }: Props) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const byDay = groupByDay(lessons);

  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold tracking-tight">{format(month, 'LLLL yyyy')}</h2>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href={`/dashboard/calendar?month=${monthParam(subMonths(month, 1))}`}
            aria-label="Previous month"
            className="rounded-md border border-border px-2 py-1 hover:bg-muted"
          >
            ‹
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-md border border-border px-2.5 py-1 hover:bg-muted"
          >
            Today
          </Link>
          <Link
            href={`/dashboard/calendar?month=${monthParam(addMonths(month, 1))}`}
            aria-label="Next month"
            className="rounded-md border border-border px-2 py-1 hover:bg-muted"
          >
            ›
          </Link>
        </div>
      </div>

      {/* Grid (scrolls horizontally on narrow screens rather than breaking layout) */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, now);
              const dayLessons = byDay.get(dayKey(day)) ?? [];
              const overflow = dayLessons.length - MAX_PER_DAY;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[92px] border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0',
                    !inMonth && 'bg-muted/30'
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums',
                      isToday && 'bg-primary font-semibold text-primary-foreground',
                      !isToday && !inMonth && 'text-muted-foreground/60',
                      !isToday && inMonth && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayLessons.slice(0, MAX_PER_DAY).map((l) => (
                      <EventChip key={l.id} lesson={l} showStudent={showStudent} />
                    ))}
                    {overflow > 0 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{overflow} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

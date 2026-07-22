import { addDays, endOfDay, startOfDay } from 'date-fns';

import type { LessonRow } from '@/lib/services/lessons-queries';

export type LessonGroupKey = 'today' | 'thisWeek' | 'upcoming' | 'past';

export type LessonGroup = {
  key: LessonGroupKey;
  label: string;
  lessons: LessonRow[];
};

const GROUP_META: { key: LessonGroupKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

const asc = (a: LessonRow, b: LessonRow): number =>
  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
const desc = (a: LessonRow, b: LessonRow): number => asc(b, a);

/**
 * Bucket lessons by when they happen relative to `now`, so the schedule reads
 * as a timeline instead of a flat list. Future buckets are ordered soonest-first;
 * Past is ordered most-recent-first. Empty buckets are dropped.
 */
export function groupLessonsByTime(lessons: LessonRow[], now: Date): LessonGroup[] {
  const startToday = startOfDay(now).getTime();
  const endToday = endOfDay(now).getTime();
  const endWeek = endOfDay(addDays(now, 7)).getTime();

  const buckets: Record<LessonGroupKey, LessonRow[]> = {
    today: [],
    thisWeek: [],
    upcoming: [],
    past: [],
  };

  for (const lesson of lessons) {
    const t = new Date(lesson.scheduledAt).getTime();
    if (t < startToday) buckets.past.push(lesson);
    else if (t <= endToday) buckets.today.push(lesson);
    else if (t <= endWeek) buckets.thisWeek.push(lesson);
    else buckets.upcoming.push(lesson);
  }

  buckets.today.sort(asc);
  buckets.thisWeek.sort(asc);
  buckets.upcoming.sort(asc);
  buckets.past.sort(desc);

  return GROUP_META.map((meta) => ({ ...meta, lessons: buckets[meta.key] })).filter(
    (group) => group.lessons.length > 0
  );
}

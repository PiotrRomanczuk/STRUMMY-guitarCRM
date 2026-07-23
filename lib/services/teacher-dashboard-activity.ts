import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type StudioActivityType = 'practice' | 'assignment' | 'lesson';

export type StudioActivityItem = {
  id: string;
  type: StudioActivityType;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  object: string | null;
  occurredAt: string;
};

/** Merge activity groups into one feed, newest first, capped at `limit`. Pure. */
export const mergeStudioActivity = (
  groups: StudioActivityItem[][],
  limit: number
): StudioActivityItem[] =>
  groups
    .flat()
    .filter((item) => Boolean(item.occurredAt))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, limit);

/** Compact relative-time label ("now", "5m", "3h", "2d", "4w"). Pure. */
export const relativeTimeLabel = (iso: string, now: Date): string => {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
};

type JoinedProfile = { full_name: string | null; email: string | null };
type JoinedSong = { title: string | null };

const unwrap = <T>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

const LOOKBACK_DAYS = 30;

/**
 * Recent studio-wide activity for a teacher: student practice sessions,
 * completed assignments, and completed lessons — merged and sorted newest
 * first. Bounded to the last 30 days so the feed stays "recent".
 */
export async function getStudioActivity(
  teacherId: string,
  now: Date,
  limit = 8
): Promise<StudioActivityItem[]> {
  const supabase = await createClient();

  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null);
  const studentIds = Array.from(new Set((lessonRows ?? []).map((r) => r.student_id as string)));
  if (studentIds.length === 0) return [];

  const since = new Date(now);
  since.setDate(since.getDate() - LOOKBACK_DAYS);
  const sinceIso = since.toISOString();

  const [practice, assignments, lessons] = await Promise.all([
    supabase
      .from('practice_sessions')
      .select(
        'id, created_at, student:profiles!practice_sessions_student_id_fkey(full_name, email), song:songs!practice_sessions_song_id_fkey(title)'
      )
      .in('student_id', studentIds)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('assignments')
      .select(
        'id, title, updated_at, student:profiles!assignments_student_id_fkey(full_name, email)'
      )
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .gte('updated_at', sinceIso)
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('lessons')
      .select('id, scheduled_at, student:profiles!lessons_student_id_fkey(full_name, email)')
      .eq('teacher_id', teacherId)
      .eq('status', 'COMPLETED')
      .is('deleted_at', null)
      .gte('scheduled_at', sinceIso)
      .order('scheduled_at', { ascending: false })
      .limit(limit),
  ]);

  if (practice.error || assignments.error || lessons.error) {
    logger.warn('[teacher-dashboard-activity] query error', {
      practice: practice.error?.message,
      assignments: assignments.error?.message,
      lessons: lessons.error?.message,
    });
  }

  const practiceItems: StudioActivityItem[] = (practice.data ?? []).map((r) => {
    const p = unwrap(r.student as JoinedProfile | JoinedProfile[] | null);
    const s = unwrap(r.song as JoinedSong | JoinedSong[] | null);
    return {
      id: `practice-${r.id as string}`,
      type: 'practice',
      actorName: p?.full_name ?? null,
      actorEmail: p?.email ?? null,
      action: 'practiced',
      object: s?.title ?? null,
      occurredAt: r.created_at as string,
    };
  });

  const assignmentItems: StudioActivityItem[] = (assignments.data ?? []).map((r) => {
    const p = unwrap(r.student as JoinedProfile | JoinedProfile[] | null);
    return {
      id: `assignment-${r.id as string}`,
      type: 'assignment',
      actorName: p?.full_name ?? null,
      actorEmail: p?.email ?? null,
      action: 'completed',
      object: r.title as string,
      occurredAt: r.updated_at as string,
    };
  });

  const lessonItems: StudioActivityItem[] = (lessons.data ?? []).map((r) => {
    const p = unwrap(r.student as JoinedProfile | JoinedProfile[] | null);
    return {
      id: `lesson-${r.id as string}`,
      type: 'lesson',
      actorName: p?.full_name ?? null,
      actorEmail: p?.email ?? null,
      action: 'finished a lesson',
      object: null,
      occurredAt: r.scheduled_at as string,
    };
  });

  return mergeStudioActivity([practiceItems, assignmentItems, lessonItems], limit);
}

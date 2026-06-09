import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type SongProgressStatus = 'to_learn' | 'started' | 'remembered' | 'with_author' | 'mastered';

export type SongUsageStats = {
  assignedTo: number;
  usedInLessons: number;
  inLibrarySince: string | null;
  avgMastery: number;
};

export type SongLearner = {
  studentId: string;
  fullName: string | null;
  email: string | null;
  status: SongProgressStatus;
  totalPracticeMinutes: number;
  lastPracticedAt: string | null;
};

export type RelatedSongRow = {
  id: string;
  title: string;
  author: string | null;
  songKey: string | null;
};

const STATUS_MASTERY: Record<SongProgressStatus, number> = {
  to_learn: 0,
  started: 25,
  remembered: 50,
  with_author: 75,
  mastered: 100,
};

export async function getSongUsageStats(songId: string): Promise<SongUsageStats> {
  const supabase = await createClient();

  const [repertoireResult, lessonsResult, songResult] = await Promise.all([
    supabase.from('student_repertoire').select('current_status').eq('song_id', songId),
    supabase
      .from('lesson_songs')
      .select('id', { count: 'exact', head: true })
      .eq('song_id', songId),
    supabase.from('songs').select('created_at').eq('id', songId).single(),
  ]);

  if (repertoireResult.error) {
    logger.warn('[song-detail-queries] usage stats — repertoire error', {
      error: repertoireResult.error.message,
      code: repertoireResult.error.code,
    });
  }
  if (lessonsResult.error) {
    logger.warn('[song-detail-queries] usage stats — lessons error', {
      error: lessonsResult.error.message,
      code: lessonsResult.error.code,
    });
  }

  const repertoireRows = repertoireResult.data ?? [];
  const masterySum = repertoireRows.reduce(
    (sum, row) => sum + STATUS_MASTERY[row.current_status as SongProgressStatus],
    0
  );
  const avgMastery = repertoireRows.length > 0 ? Math.round(masterySum / repertoireRows.length) : 0;

  return {
    assignedTo: repertoireRows.length,
    usedInLessons: lessonsResult.count ?? 0,
    inLibrarySince: songResult.data?.created_at ?? null,
    avgMastery,
  };
}

export async function getSongLearners(songId: string, limit = 8): Promise<SongLearner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('student_repertoire')
    .select(
      'student_id, current_status, total_practice_minutes, last_practiced_at, profiles:student_id(full_name, email)'
    )
    .eq('song_id', songId)
    .neq('current_status', 'to_learn')
    .order('total_practice_minutes', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[song-detail-queries] learners error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      studentId: row.student_id as string,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      status: row.current_status as SongProgressStatus,
      totalPracticeMinutes: row.total_practice_minutes ?? 0,
      lastPracticedAt: row.last_practiced_at ?? null,
    };
  });
}

export async function getRelatedSongs(
  songId: string,
  level: string | null,
  limit = 3
): Promise<RelatedSongRow[]> {
  if (!level) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('songs')
    .select('id, title, author, key')
    .eq('level', level)
    .is('deleted_at', null)
    .neq('id', songId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[song-detail-queries] related error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    author: row.author as string | null,
    songKey: row.key as string | null,
  }));
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SongProgressStatus, RepertoirePriority } from '@/types/StudentRepertoire';
import type { DashboardRepertoireItem } from './dashboard.types';

/** Fetch active repertoire items + stats for the student dashboard. */
export async function fetchRepertoireForDashboard(
  supabase: SupabaseClient,
  studentId: string
): Promise<{
  repertoire: DashboardRepertoireItem[];
  totalSongs: number;
  practiceHours: number;
}> {
  const { data: repertoireData } = await supabase
    .from('student_repertoire')
    .select(
      `
      id, song_id, current_status, priority,
      last_practiced_at, total_practice_minutes, self_rating,
      song:songs!inner (id, title, author)
    `
    )
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .order('last_practiced_at', { ascending: true, nullsFirst: true })
    .limit(10);

  const repertoire: DashboardRepertoireItem[] = (repertoireData || []).map(
    (row) => {
      const song = Array.isArray(row.song) ? row.song[0] : row.song;
      return {
        id: row.id,
        song_id: row.song_id,
        song_title: song?.title ?? '',
        song_author: song?.author ?? null,
        current_status: row.current_status as SongProgressStatus,
        priority: row.priority as RepertoirePriority,
        last_practiced_at: row.last_practiced_at,
        total_practice_minutes: row.total_practice_minutes ?? 0,
        self_rating: row.self_rating,
      };
    }
  );

  const { count: repertoireSongCount } = await supabase
    .from('student_repertoire')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('is_active', true);

  const { data: practiceSum } = await supabase
    .from('student_repertoire')
    .select('total_practice_minutes')
    .eq('student_id', studentId)
    .eq('is_active', true);

  const totalPracticeMinutes = (practiceSum || []).reduce(
    (sum, row) => sum + (row.total_practice_minutes ?? 0),
    0
  );

  return {
    repertoire,
    totalSongs: repertoireSongCount || 0,
    practiceHours: Math.round(totalPracticeMinutes / 60),
  };
}

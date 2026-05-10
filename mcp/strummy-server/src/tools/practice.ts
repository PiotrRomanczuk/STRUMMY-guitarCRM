import { z } from 'zod';
import { fail, ok } from '../format.js';
import { getSupabase } from '../supabase.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

export const getPracticeLogInput = z.object({
  student_id: z.string().uuid(),
  since_days: z.number().int().min(1).max(365).default(30),
  song_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const getPracticeSummaryInput = z.object({
  student_id: z.string().uuid(),
  since_days: z.number().int().min(1).max(365).default(30),
  top_n: z.number().int().min(1).max(20).default(5),
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sinceISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type PracticeRow = {
  id: string;
  song_id: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  songs?: { id: string; title: string; author: string | null } | null;
};

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function getPracticeLog(input: z.infer<typeof getPracticeLogInput>) {
  const sb = getSupabase();
  const since = sinceISO(input.since_days);

  let q = sb
    .from('practice_sessions')
    .select(
      'id, song_id, duration_minutes, notes, created_at, ' + 'songs:song_id ( id, title, author )'
    )
    .eq('student_id', input.student_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(input.limit);

  if (input.song_id) q = q.eq('song_id', input.song_id);

  const { data, error } = await q;
  if (error) return fail('Failed to fetch practice log', error.message);

  const rows = (data ?? []) as unknown as PracticeRow[];
  const totalMinutes = rows.reduce((acc, r) => acc + (r.duration_minutes ?? 0), 0);

  return ok({
    student_id: input.student_id,
    window_days: input.since_days,
    song_filter: input.song_id ?? null,
    session_count: rows.length,
    total_minutes: totalMinutes,
    sessions: rows,
  });
}

export async function getPracticeSummary(input: z.infer<typeof getPracticeSummaryInput>) {
  const sb = getSupabase();
  const since = sinceISO(input.since_days);

  // Fetch all sessions in window (with song titles) and aggregate in JS.
  // Range is bounded by since_days <= 365, so the row count stays manageable.
  const { data, error } = await sb
    .from('practice_sessions')
    .select('id, song_id, duration_minutes, created_at, ' + 'songs:song_id ( id, title, author )')
    .eq('student_id', input.student_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) return fail('Failed to fetch practice sessions', error.message);

  const rows = (data ?? []) as unknown as PracticeRow[];

  let totalMinutes = 0;
  const dayKeys = new Set<string>();
  const perSong = new Map<
    string,
    { song_id: string; title: string; author: string | null; minutes: number; sessions: number }
  >();

  for (const r of rows) {
    const minutes = r.duration_minutes ?? 0;
    totalMinutes += minutes;
    dayKeys.add(r.created_at.slice(0, 10));

    if (r.song_id) {
      const key = r.song_id;
      const existing = perSong.get(key);
      if (existing) {
        existing.minutes += minutes;
        existing.sessions += 1;
      } else {
        perSong.set(key, {
          song_id: key,
          title: r.songs?.title ?? '(unknown song)',
          author: r.songs?.author ?? null,
          minutes,
          sessions: 1,
        });
      }
    }
  }

  const topSongs = [...perSong.values()]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, input.top_n);

  return ok({
    student_id: input.student_id,
    window_days: input.since_days,
    session_count: rows.length,
    total_minutes: totalMinutes,
    distinct_days: dayKeys.size,
    distinct_songs: perSong.size,
    avg_minutes_per_session: rows.length > 0 ? Math.round(totalMinutes / rows.length) : 0,
    top_songs: topSongs,
  });
}

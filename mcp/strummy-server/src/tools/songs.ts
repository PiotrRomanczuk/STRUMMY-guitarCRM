import { z } from 'zod';
import { fail, ok } from '../format.js';
import { getSupabase } from '../supabase.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

const DIFFICULTY = z.enum(['beginner', 'intermediate', 'advanced']);

export const findSongsInput = z.object({
  query: z.string().min(1).optional(),
  level: DIFFICULTY.optional(),
  key: z.string().min(1).max(8).optional(),
  contains_chords: z.array(z.string().min(1).max(8)).max(10).optional(),
  category: z.string().min(1).optional(),
  recorded_only: z.boolean().default(false),
  include_drafts: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
});

export const getSongInput = z.object({ id: z.string().uuid() });

export const songOfTheWeekInput = z.object({
  include_history: z.boolean().default(false),
  limit: z.number().int().min(1).max(20).default(5),
});

const SONG_SUMMARY_COLUMNS =
  'id, title, author, short_title, level, key, capo_fret, category, ' +
  'tempo, release_year, is_draft, recorded_at, cover_image_url';

const SONG_DETAIL_COLUMNS =
  SONG_SUMMARY_COLUMNS +
  ', strumming_pattern, time_signature, duration_ms, chords, notes, ' +
  'lyrics_with_chords, ultimate_guitar_link, youtube_url, spotify_link_url, ' +
  'tiktok_short_url, gallery_images, audio_files, recording_queued_at, ' +
  'created_at, updated_at';

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function findSongs(input: z.infer<typeof findSongsInput>) {
  const sb = getSupabase();

  let q = sb
    .from('songs')
    .select(SONG_SUMMARY_COLUMNS)
    .is('deleted_at', null)
    .order('title', { ascending: true })
    .limit(input.limit);

  if (!input.include_drafts) q = q.eq('is_draft', false);
  if (input.recorded_only) q = q.not('recorded_at', 'is', null);
  if (input.level) q = q.eq('level', input.level);
  if (input.key) q = q.eq('key', input.key);
  if (input.category) q = q.eq('category', input.category);
  if (input.query) {
    const safe = input.query.replace(/[%,]/g, ' ');
    q = q.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);
  }
  if (input.contains_chords && input.contains_chords.length > 0) {
    for (const chord of input.contains_chords) {
      q = q.ilike('chords', `%${chord.replace(/[%,]/g, '')}%`);
    }
  }

  const { data, error } = await q;
  if (error) return fail('Failed to find songs', error.message);

  return ok({
    filters: {
      query: input.query ?? null,
      level: input.level ?? null,
      key: input.key ?? null,
      contains_chords: input.contains_chords ?? null,
      category: input.category ?? null,
      recorded_only: input.recorded_only,
      include_drafts: input.include_drafts,
    },
    count: data?.length ?? 0,
    songs: data ?? [],
  });
}

export async function getSong(input: z.infer<typeof getSongInput>) {
  const sb = getSupabase();

  const [song, videos, learning] = await Promise.all([
    sb
      .from('songs')
      .select(SONG_DETAIL_COLUMNS)
      .eq('id', input.id)
      .is('deleted_at', null)
      .maybeSingle(),
    sb
      .from('song_videos')
      .select(
        'id, title, filename, duration_seconds, thumbnail_url, display_order, ' +
          'mime_type, file_size_bytes'
      )
      .eq('song_id', input.id)
      .order('display_order', { ascending: true }),
    sb
      .from('student_repertoire')
      .select('id', { count: 'exact', head: true })
      .eq('song_id', input.id)
      .eq('is_active', true),
  ]);

  if (song.error) return fail('Failed to fetch song', song.error.message);
  if (!song.data) return fail('Song not found');

  const songData = song.data as { chords?: string | null };
  const chordsArray = (songData.chords ?? '')
    .split(/[,\s|]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return ok({
    song: song.data,
    chords_array: chordsArray,
    videos: videos.data ?? [],
    students_learning_count: learning.count ?? 0,
  });
}

export async function songOfTheWeek(input: z.infer<typeof songOfTheWeekInput>) {
  const sb = getSupabase();

  const today = new Date().toISOString().slice(0, 10);

  const current = await sb
    .from('song_of_the_week')
    .select(
      'id, song_id, selected_by, teacher_message, active_from, active_until, ' +
        'is_active, songs:song_id ( id, title, author, level )'
    )
    .eq('is_active', true)
    .lte('active_from', today)
    .gte('active_until', today)
    .order('active_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (current.error) return fail('Failed to fetch song of the week', current.error.message);

  let history: unknown[] = [];
  if (input.include_history) {
    const past = await sb
      .from('song_of_the_week')
      .select(
        'id, song_id, active_from, active_until, is_active, ' +
          'songs:song_id ( id, title, author )'
      )
      .order('active_from', { ascending: false })
      .limit(input.limit);
    if (past.error) return fail('Failed to fetch history', past.error.message);
    history = past.data ?? [];
  }

  return ok({
    today,
    current: current.data ?? null,
    history,
  });
}

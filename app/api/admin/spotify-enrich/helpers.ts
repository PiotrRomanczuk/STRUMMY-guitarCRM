import type { SupabaseClient } from '@supabase/supabase-js';
import { getAudioFeatures, searchArtists } from '@/lib/spotify';
import { logger } from '@/lib/logger';

const DELAY_MS = 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractTrackId(url: string): string | null {
  return url.match(/track\/([a-zA-Z0-9]+)/)?.[1] ?? null;
}

const GENRE_MAP: Array<[RegExp, string]> = [
  [/progressive rock/i, 'Progressive Rock'],
  [/alternative rock|indie rock/i, 'Alternative Rock'],
  [/classic rock/i, 'Classic Rock'],
  [/hard rock/i, 'Hard Rock'],
  [/blues rock/i, 'Blues Rock'],
  [/folk rock/i, 'Folk Rock'],
  [/pop rock/i, 'Pop Rock'],
  [/punk|punk rock/i, 'Punk Rock'],
  [/grunge/i, 'Grunge'],
  [/thrash metal/i, 'Thrash Metal'],
  [/progressive metal/i, 'Progressive Metal'],
  [/heavy metal|metal/i, 'Heavy Metal'],
  [/britpop/i, 'Britpop'],
  [/reggae/i, 'Reggae'],
  [/country/i, 'Country'],
  [/folk/i, 'Folk'],
  [/soul/i, 'Soul'],
  [/blues/i, 'Blues'],
  [/classical/i, 'Classical'],
  [/latin/i, 'Latin Rock'],
  [/acoustic/i, 'Acoustic Rock'],
  [/instrumental/i, 'Instrumental Rock'],
  [/pop/i, 'Pop'],
  [/rock/i, 'Rock'],
];

function mapGenresToCategory(genres: string[]): string | null {
  for (const genre of genres) {
    for (const [pattern, category] of GENRE_MAP) {
      if (pattern.test(genre)) return category;
    }
  }
  return null;
}

export async function enrichTempo(supabase: SupabaseClient, batchSize: number) {
  const { data: songs } = await supabase
    .from('songs')
    .select('id, spotify_link_url')
    .is('deleted_at', null)
    .not('spotify_link_url', 'is', null)
    .or('tempo.is.null,tempo.eq.0')
    .limit(batchSize);

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const song of songs ?? []) {
    const trackId = extractTrackId(song.spotify_link_url ?? '');
    if (!trackId) {
      failed++;
      continue;
    }
    try {
      const features = (await getAudioFeatures(trackId)) as { tempo?: number } | null;
      if (features?.tempo) {
        const { error } = await supabase
          .from('songs')
          .update({ tempo: Math.round(features.tempo) })
          .eq('id', song.id);
        if (error) {
          failed++;
          errors.push(`${song.id}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        failed++;
      }
      await sleep(DELAY_MS);
    } catch (err) {
      failed++;
      errors.push(`${song.id}: ${(err as Error).message}`);
      logger.warn('[SpotifyEnrich] Tempo error: ' + (err as Error).message);
    }
  }

  return {
    type: 'tempo',
    processed: (songs ?? []).length,
    updated,
    failed,
    errors: errors.slice(0, 10),
  };
}

export async function enrichCategory(supabase: SupabaseClient, batchSize: number) {
  const { data: songs } = await supabase
    .from('songs')
    .select('id, author')
    .is('deleted_at', null)
    .is('category', null)
    .not('author', 'is', null)
    .limit(batchSize * 5);

  if (!songs?.length) {
    return { type: 'category', authorsProcessed: 0, songsUpdated: 0, failed: 0, errors: [] };
  }

  const byAuthor = new Map<string, string[]>();
  for (const s of songs) {
    if (!s.author || s.author === 'Unknown' || s.author === '') continue;
    if (!byAuthor.has(s.author)) byAuthor.set(s.author, []);
    byAuthor.get(s.author)!.push(s.id);
  }

  let songsUpdated = 0;
  let failed = 0;
  const errors: string[] = [];
  const entries = Array.from(byAuthor.entries()).slice(0, batchSize);

  for (const [author, songIds] of entries) {
    try {
      const results = (await searchArtists(author)) as {
        artists?: { items?: Array<{ genres?: string[] }> };
      } | null;
      const artists = results?.artists?.items ?? [];
      if (artists.length === 0) continue;

      const genres: string[] = artists[0].genres ?? [];
      const category = mapGenresToCategory(genres);
      if (!category) continue;

      const { error } = await supabase.from('songs').update({ category }).in('id', songIds);
      if (error) {
        failed++;
        errors.push(`${author}: ${error.message}`);
      } else {
        songsUpdated += songIds.length;
      }
      await sleep(300);
    } catch (err) {
      failed++;
      errors.push(`${author}: ${(err as Error).message}`);
      logger.warn('[SpotifyEnrich] Category error: ' + (err as Error).message);
    }
  }

  return {
    type: 'category',
    authorsProcessed: entries.length,
    songsUpdated,
    failed,
    errors: errors.slice(0, 10),
  };
}

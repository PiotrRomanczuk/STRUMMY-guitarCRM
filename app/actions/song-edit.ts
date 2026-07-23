'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { DifficultyLevelEnum, MusicKeyEnum, URLField } from '@/schemas/CommonSchema';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const SongEditSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  level: DifficultyLevelEnum,
  key: MusicKeyEnum,
  capo_fret: z.number().int().min(0).max(20).nullable(),
  tempo: z.number().int().min(0).max(300).nullable(),
  time_signature: z.number().int().min(1).max(16).nullable(),
  release_year: z.number().int().min(1500).max(2100).nullable(),
  chords: z.string().max(500).nullable(),
  strumming_pattern: z.string().max(100).nullable(),
  category: z.string().max(50).nullable(),
  youtube_url: URLField.nullable(),
  spotify_link_url: URLField.nullable(),
  ultimate_guitar_link: URLField.nullable(),
  tiktok_short_url: URLField.nullable(),
  cover_image_url: URLField.nullable(),
  // Song sections / lyrics-with-chord-positions. Real `songs.lyrics_with_chords`
  // column (text) — the backing store for the "Sections & form" content.
  lyrics_with_chords: z.string().max(20000).nullable(),
});

export type SongEditErrors = Partial<Record<string, string>> & { _form?: string };
export type SongEditState = { errors?: SongEditErrors };

const numOrNull = (v: FormDataEntryValue | null): number | null => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const textOrNull = (v: FormDataEntryValue | null): string | null => String(v ?? '').trim() || null;

export async function updateSongAction(
  _prev: SongEditState,
  formData: FormData
): Promise<SongEditState> {
  const parsed = SongEditSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    author: String(formData.get('author') ?? '').trim(),
    level: String(formData.get('level') ?? ''),
    key: String(formData.get('key') ?? ''),
    capo_fret: numOrNull(formData.get('capo_fret')),
    tempo: numOrNull(formData.get('tempo')),
    time_signature: numOrNull(formData.get('time_signature')),
    release_year: numOrNull(formData.get('release_year')),
    chords: textOrNull(formData.get('chords')),
    strumming_pattern: textOrNull(formData.get('strumming_pattern')),
    category: textOrNull(formData.get('category')),
    youtube_url: textOrNull(formData.get('youtube_url')),
    spotify_link_url: textOrNull(formData.get('spotify_link_url')),
    ultimate_guitar_link: textOrNull(formData.get('ultimate_guitar_link')),
    tiktok_short_url: textOrNull(formData.get('tiktok_short_url')),
    cover_image_url: textOrNull(formData.get('cover_image_url')),
    lyrics_with_chords: textOrNull(formData.get('lyrics_with_chords')),
  });

  if (!parsed.success) {
    const errors: SongEditErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === 'string') errors[k] = issue.message;
    }
    return { errors };
  }

  const { id, ...payload } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from('songs').update(payload).eq('id', id);

  if (error) {
    logger.error('[song-edit] update error', { error: error.message, code: error.code });
    return {
      errors: {
        _form: 'Could not save the song. Check your role permissions or try again.',
      },
    };
  }

  revalidatePath(`/dashboard/songs/${id}`);
  redirect(`/dashboard/songs/${id}`);
}

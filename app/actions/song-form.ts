'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { DifficultyLevelEnum, MusicKeyEnum } from '@/schemas/CommonSchema';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const SongFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(100),
  level: DifficultyLevelEnum,
  key: MusicKeyEnum,
  capo_fret: z.number().int().min(0).max(20).nullable(),
  tempo: z.number().int().min(0).max(300).nullable(),
  chords: z.string().max(500).nullable(),
});

export type SongFormErrors = Partial<Record<keyof z.infer<typeof SongFormSchema>, string>> & {
  _form?: string;
};

export type SongFormState = {
  errors?: SongFormErrors;
};

const parseNumberOrNull = (value: FormDataEntryValue | null): number | null => {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function createSongAction(
  _prev: SongFormState,
  formData: FormData
): Promise<SongFormState> {
  const parsed = SongFormSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    author: String(formData.get('author') ?? '').trim(),
    level: String(formData.get('level') ?? ''),
    key: String(formData.get('key') ?? ''),
    capo_fret: parseNumberOrNull(formData.get('capo_fret')),
    tempo: parseNumberOrNull(formData.get('tempo')),
    chords: String(formData.get('chords') ?? '').trim() || null,
  });

  if (!parsed.success) {
    const errors: SongFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        errors[key as keyof SongFormErrors] = issue.message;
      }
    }
    return { errors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('songs').insert(parsed.data).select('id').single();

  if (error) {
    logger.error('[song-form] insert error', {
      error: error.message,
      code: error.code,
    });
    return {
      errors: {
        _form: 'Could not save the song. Check your role permissions or try again.',
      },
    };
  }

  redirect(`/dashboard/songs/${data.id}`);
}

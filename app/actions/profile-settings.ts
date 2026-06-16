'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { PhoneSchema } from '@/schemas/shared/phone';
import { logger } from '@/lib/logger';

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(120),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: PhoneSchema,
  avatar_url: z.union([z.string().url('Enter a valid URL'), z.literal('')]).optional(),
});

export type ProfileSettingsState = {
  saved?: boolean;
  error?: string;
};

const opt = (v: FormDataEntryValue | null): string | undefined => {
  const s = String(v ?? '').trim();
  return s === '' ? undefined : s;
};

/**
 * Self-edit of the caller's own Profile (RLS-scoped to auth.uid()). Covers
 * full_name + first/last name + phone + avatar_url — the same field set the
 * self route PUT /api/users/profile supports. Only sent fields are written.
 */
export async function updateProfileNameAction(
  _prev: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const parsed = ProfileUpdateSchema.safeParse({
    full_name: String(formData.get('full_name') ?? '').trim(),
    first_name: opt(formData.get('first_name')),
    last_name: opt(formData.get('last_name')),
    phone: opt(formData.get('phone')),
    avatar_url: opt(formData.get('avatar_url')),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not signed in.' };
  }

  const updates: Record<string, unknown> = { full_name: parsed.data.full_name };
  if (parsed.data.first_name !== undefined) updates.first_name = parsed.data.first_name;
  if (parsed.data.last_name !== undefined) updates.last_name = parsed.data.last_name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.avatar_url !== undefined) {
    updates.avatar_url = parsed.data.avatar_url === '' ? null : parsed.data.avatar_url;
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (error) {
    logger.warn('[profile-settings] update error', { error: error.message, code: error.code });
    return { error: 'Could not save. Try again.' };
  }

  revalidatePath('/dashboard/settings');
  return { saved: true };
}

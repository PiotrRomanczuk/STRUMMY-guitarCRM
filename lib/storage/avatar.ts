/**
 * Avatar upload helpers (IDA-2).
 *
 * validateAvatarFile is a pure function — fully unit-testable without a
 * storage backend. uploadAvatar itself talks to the `avatars` bucket via
 * the browser Supabase client; it cannot be exercised on a stack that has
 * no storage-api service (this dev DB has none — see the migration's own
 * comment). Kept separate so the validation logic is verifiable regardless.
 */

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAvatarFile(file: { size: number; type: string }): AvatarValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please choose a PNG, JPEG, WebP, or GIF image.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { valid: false, error: 'Image must be 2 MB or smaller.' };
  }
  return { valid: true };
}

export function avatarObjectPath(userId: string, fileName: string): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'png';
  return `${userId}/avatar.${ext}`;
}

/**
 * Uploads a validated avatar file to the `avatars` bucket and returns its
 * public URL. Requires a running Supabase Storage service — throws with a
 * clear message if the bucket/service isn't reachable, so the caller can
 * surface a real error instead of an opaque network failure.
 */
export async function uploadAvatar(
  supabase: {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          file: File,
          opts: { upsert: boolean; contentType: string }
        ) => Promise<{ error: { message: string } | null }>;
        getPublicUrl: (path: string) => { data: { publicUrl: string } };
      };
    };
  },
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) return { error: validation.error! };

  const path = avatarObjectPath(userId, file.name);
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl };
}

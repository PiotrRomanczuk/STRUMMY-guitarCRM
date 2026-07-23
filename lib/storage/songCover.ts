/**
 * Song cover-image upload helpers.
 *
 * Mirrors lib/storage/avatar.ts. validateSongCoverFile is a pure function —
 * fully unit-testable without a storage backend. uploadSongCover talks to the
 * `song-covers` bucket via the browser Supabase client; it cannot be exercised
 * on a stack with no storage-api service (the StudentDevelopment dev DB has
 * none). Kept separate so the validation logic is verifiable regardless.
 *
 * Songs are catalog entities, not user-owned rows: at create time no song id
 * exists yet, so uploaded objects are named with a random UUID. Orphaned
 * objects (upload then abandon the form) are acceptable — the bucket is public
 * and cheap, and covers are only referenced by URL from the songs row.
 */

const MAX_SONG_COVER_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface SongCoverValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSongCoverFile(file: {
  size: number;
  type: string;
}): SongCoverValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please choose a PNG, JPEG, WebP, or GIF image.' };
  }
  if (file.size > MAX_SONG_COVER_BYTES) {
    return { valid: false, error: 'Image must be 2 MB or smaller.' };
  }
  return { valid: true };
}

/**
 * Builds the object name for a cover upload. When a songId is supplied (edit
 * flow) the object is deterministic (`${songId}/cover.<ext>`) so re-uploads
 * overwrite the previous cover; otherwise (create flow) a random UUID is used.
 */
export function songCoverObjectPath(mimeType: string, songId?: string): string {
  const ext = EXT_BY_MIME[mimeType] ?? 'png';
  if (songId) return `${songId}/cover.${ext}`;
  return `${crypto.randomUUID()}.${ext}`;
}

/**
 * Uploads a validated cover file to the `song-covers` bucket and returns its
 * public URL. Requires a running Supabase Storage service — returns an error
 * object (never throws) if the bucket/service isn't reachable, so the caller
 * can surface a real message instead of an opaque network failure.
 */
export async function uploadSongCover(
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
  file: File,
  songId?: string
): Promise<{ url: string } | { error: string }> {
  const validation = validateSongCoverFile(file);
  if (!validation.valid) return { error: validation.error! };

  const path = songCoverObjectPath(file.type, songId);
  const { error } = await supabase.storage
    .from('song-covers')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from('song-covers').getPublicUrl(path);
  return { url: data.publicUrl };
}

import { SupabaseClient } from '@supabase/supabase-js';
import { listFilesInFolder, findFolderByName, DriveFileInfo } from './google-drive-service-account';
import { matchAllVideosToSongs, VideoMatchResult, SongRecord } from './drive-video-matcher';
import { logger } from '@/lib/logger';

export interface SyncOptions {
  /** The Drive folder name to scan (default: "07_Guitar Videos") */
  folderName?: string;
  /** Parent folder ID to search within (default: GOOGLE_DRIVE_FOLDER_ID env) */
  parentFolderId?: string;
  /** Direct folder ID — skip folder lookup */
  folderId?: string;
  /** If true, don't insert, just return matches */
  dryRun?: boolean;
  /** User ID for uploaded_by column (must be a valid auth.users id) */
  uploadedByUserId: string;
  /** Supabase client (admin, bypasses RLS) */
  supabase: SupabaseClient;
  /** Manual overrides: map of driveFileId → songId */
  overrides?: Record<string, string>;
}

export interface SyncResult {
  totalFiles: number;
  matched: number;
  reviewQueue: number;
  unmatched: number;
  skipped: number;
  inserted: number;
  results: VideoMatchResult[];
  duplicates?: DuplicateVideoInfo[];
}

export interface DuplicateVideoInfo {
  driveFile: DriveFileInfo;
  existingSongVideo: {
    id: string;
    songId: string;
    songTitle: string;
    uploadedAt: string;
  };
}

/**
 * Resolve the target Drive folder ID.
 */
async function resolveFolderId(options: SyncOptions): Promise<string> {
  if (options.folderId) return options.folderId;

  const rawParentId = options.parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  // Strip URL query params that may be pasted from browser URLs
  const parentId = rawParentId.split('?')[0];

  if (!parentId) {
    throw new Error('No parent folder ID. Set GOOGLE_DRIVE_FOLDER_ID or pass parentFolderId.');
  }

  // If folderName is explicitly set to empty string, use parentId directly
  // If folderName is undefined, also use parentId directly (videos are in the folder itself)
  if (options.folderName === '' || options.folderName === undefined) {
    return parentId;
  }

  // Otherwise, search for subfolder by name
  const id = await findFolderByName(parentId, options.folderName);
  if (!id) {
    throw new Error(`Folder "${options.folderName}" not found in parent folder ${parentId}`);
  }
  return id;
}

/**
 * Fetch all songs from Supabase (admin client bypasses RLS).
 */
async function fetchAllSongs(supabase: SupabaseClient): Promise<SongRecord[]> {
  const { data, error } = await supabase.from('songs').select('id, title, author').order('title');

  if (error) throw new Error(`Failed to fetch songs: ${error.message}`);
  return (data || []) as SongRecord[];
}

/**
 * Fetch existing song_videos with song details to track duplicates.
 */
async function fetchExistingVideos(
  supabase: SupabaseClient
): Promise<Map<string, { id: string; songId: string; songTitle: string; uploadedAt: string }>> {
  // Fetch existing videos
  const { data: videos, error: videosError } = await supabase
    .from('song_videos')
    .select('id, google_drive_file_id, song_id, created_at');

  if (videosError) {
    throw new Error(`Failed to fetch existing videos: ${videosError.message}`);
  }

  // Fetch all songs for title lookup
  const { data: songs, error: songsError } = await supabase.from('songs').select('id, title');

  if (songsError) {
    throw new Error(`Failed to fetch songs for duplicates: ${songsError.message}`);
  }

  // Create song title lookup map
  const songTitles = new Map<string, string>();
  (songs || []).forEach((song: { id: string; title: string }) => {
    songTitles.set(song.id, song.title);
  });

  // Build result map
  const map = new Map<
    string,
    { id: string; songId: string; songTitle: string; uploadedAt: string }
  >();

  (videos || []).forEach(
    (row: { id: string; google_drive_file_id: string; song_id: string; created_at: string }) => {
      map.set(row.google_drive_file_id, {
        id: row.id,
        songId: row.song_id,
        songTitle: songTitles.get(row.song_id) || 'Unknown',
        uploadedAt: row.created_at,
      });
    }
  );

  return map;
}

/**
 * Main sync entry point.
 */
export async function syncDriveVideosToSongs(options: SyncOptions): Promise<SyncResult> {
  const folderId = await resolveFolderId(options);
  const files = await listFilesInFolder(folderId, 'video/');
  const songs = await fetchAllSongs(options.supabase);
  const existingVideos = await fetchExistingVideos(options.supabase);

  // Track duplicates and filter out already-synced files
  const newFiles: DriveFileInfo[] = [];
  const duplicates: DuplicateVideoInfo[] = [];
  let skipped = 0;

  for (const f of files) {
    const existing = existingVideos.get(f.id);
    if (existing) {
      duplicates.push({
        driveFile: f,
        existingSongVideo: existing,
      });
      skipped++;
    } else {
      newFiles.push(f);
    }
  }

  const results = matchAllVideosToSongs(newFiles, songs);

  // Apply manual overrides
  if (options.overrides) {
    const songMap = new Map(songs.map((s) => [s.id, s]));
    for (const r of results) {
      const overrideSongId = options.overrides[r.driveFile.id];
      if (overrideSongId && songMap.has(overrideSongId)) {
        const song = songMap.get(overrideSongId)!;
        r.bestMatch = { song, score: 100 };
        r.status = 'matched';
      }
    }
  }

  const matched = results.filter((r) => r.status === 'matched');
  const reviewQueue = results.filter((r) => r.status === 'review_queue');
  const unmatched = results.filter((r) => r.status === 'unmatched');
  const statusSkipped = results.filter((r) => r.status === 'skipped');
  let inserted = 0;

  if (!options.dryRun && matched.length > 0) {
    const rows = matched
      .filter((r) => r.bestMatch)
      .map((r) => ({
        song_id: r.bestMatch!.song.id,
        uploaded_by: options.uploadedByUserId,
        google_drive_file_id: r.driveFile.id,
        google_drive_folder_id: folderId,
        title: r.parsed.title,
        filename: r.driveFile.name,
        mime_type: r.driveFile.mimeType,
        file_size_bytes: r.driveFile.size || null,
        thumbnail_url: r.driveFile.thumbnailLink,
        display_order: 0,
      }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error, data } = await options.supabase.from('song_videos').insert(batch).select('id');

      if (error) {
        logger.error(`Batch insert error (${i}–${i + batch.length})`, error);
      } else {
        inserted += data?.length || batch.length;
      }
    }
  }

  return {
    totalFiles: files.length,
    matched: matched.length,
    reviewQueue: reviewQueue.length,
    unmatched: unmatched.length,
    skipped: skipped + statusSkipped.length,
    inserted,
    results,
    duplicates,
  };
}

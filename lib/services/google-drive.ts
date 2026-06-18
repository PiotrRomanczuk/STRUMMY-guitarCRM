import { google, drive_v3 } from 'googleapis';
import { getGoogleClient } from '@/lib/google';
import { hasGoogleIntegration } from '@/lib/services/calendar-lesson-sync';
import { createClient } from '@/lib/supabase/server';
import { withRetry, AI_PROVIDER_RETRY_CONFIG } from '@/lib/ai/retry';
import { createLogger } from '@/lib/logger';

const log = createLogger('GoogleDrive');

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

/** Thrown when a Drive operation is attempted without a connected Google account. */
export class GoogleNotConnectedError extends Error {
  constructor() {
    super(
      'Google account not connected. Connect Google in Settings → Integrations to use video features.'
    );
    this.name = 'GoogleNotConnectedError';
  }
}

function getDriveClient(auth: Awaited<ReturnType<typeof getGoogleClient>>): drive_v3.Drive {
  return google.drive({ version: 'v3', auth });
}

/**
 * Resolve an authenticated Drive client for a user after confirming the user
 * has a connected Google integration. Gating here lets video features degrade
 * with a clear, user-actionable error instead of surfacing a raw
 * "Google integration not found" throw from the OAuth client — mirroring the
 * `hasGoogleIntegration` gate used by calendar lesson sync.
 */
async function getAuthedDrive(userId: string): Promise<drive_v3.Drive> {
  const supabase = await createClient();
  if (!(await hasGoogleIntegration(supabase, userId))) {
    throw new GoogleNotConnectedError();
  }
  const auth = await getGoogleClient(userId);
  return getDriveClient(auth);
}

/**
 * Create or find a folder in Google Drive.
 * Returns the folder ID.
 */
export async function createFolderInDrive(
  userId: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const drive = await getAuthedDrive(userId);

  // First, check if folder already exists
  const searchQuery = parentFolderId
    ? `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const existing = await withRetry(async () => {
    return drive.files.list({
      q: searchQuery,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
  }, AI_PROVIDER_RETRY_CONFIG);

  if (existing.data.files && existing.data.files.length > 0) {
    log.info('Found existing folder', { folderName, folderId: existing.data.files[0].id });
    return existing.data.files[0].id!;
  }

  // Create new folder
  const res = await withRetry(async () => {
    return drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      fields: 'id',
    });
  }, AI_PROVIDER_RETRY_CONFIG);

  log.info('Created new folder in Drive', { folderName, folderId: res.data.id });
  return res.data.id!;
}

/**
 * Create a resumable upload URI for direct client-side upload to Google Drive.
 * Returns the URI that the client uses to PUT file bytes.
 */
export async function createResumableUploadUrl(
  userId: string,
  filename: string,
  mimeType: string,
  fileSizeBytes?: number
): Promise<{ uploadUrl: string; folderId: string }> {
  const drive = await getAuthedDrive(userId);
  const folderId = DRIVE_FOLDER_ID;

  const res = await withRetry(async () => {
    return drive.files.create(
      {
        requestBody: {
          name: filename,
          mimeType,
          parents: folderId ? [folderId] : undefined,
        },
        media: { mimeType, body: '' },
        fields: 'id',
      },
      {
        // Request a resumable upload URI only
        headers: {
          'X-Upload-Content-Type': mimeType,
          ...(fileSizeBytes ? { 'X-Upload-Content-Length': String(fileSizeBytes) } : {}),
        },
        // Use resumable upload protocol
        params: { uploadType: 'resumable' },
      }
    );
  }, AI_PROVIDER_RETRY_CONFIG);

  const uploadUrl = res.headers?.location;
  if (!uploadUrl) {
    throw new Error('Failed to obtain resumable upload URL from Google Drive');
  }

  log.info('Created resumable upload URL', { filename, folderId });
  return { uploadUrl, folderId };
}

/**
 * Get metadata for a file stored in Google Drive.
 */
export async function getVideoMetadata(
  userId: string,
  fileId: string
): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size: number;
  thumbnailLink: string | null;
}> {
  const drive = await getAuthedDrive(userId);

  const res = await withRetry(async () => {
    return drive.files.get({
      fileId,
      fields: 'id,name,mimeType,size,thumbnailLink',
    });
  }, AI_PROVIDER_RETRY_CONFIG);

  return {
    id: res.data.id || fileId,
    name: res.data.name || '',
    mimeType: res.data.mimeType || '',
    size: Number(res.data.size || 0),
    thumbnailLink: res.data.thumbnailLink || null,
  };
}

/**
 * Get a short-lived download/stream URL for a Drive file.
 * Uses webContentLink for direct download access.
 */
export async function getVideoStreamUrl(userId: string, fileId: string): Promise<string> {
  const drive = await getAuthedDrive(userId);

  const res = await withRetry(async () => {
    return drive.files.get({
      fileId,
      fields: 'webContentLink',
    });
  }, AI_PROVIDER_RETRY_CONFIG);

  if (!res.data.webContentLink) {
    // Fall back to generating a direct download link
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  return res.data.webContentLink;
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteVideoFromDrive(userId: string, fileId: string): Promise<void> {
  const drive = await getAuthedDrive(userId);

  await withRetry(
    async () => {
      await drive.files.delete({ fileId });
    },
    {
      ...AI_PROVIDER_RETRY_CONFIG,
      retryableErrors: [...(AI_PROVIDER_RETRY_CONFIG.retryableErrors || []), '404'],
    }
  );

  log.info('Deleted video from Drive', { fileId });
}

/**
 * Make a Drive file viewable by anyone with the link (for streaming).
 */
export async function setFilePublicReadable(userId: string, fileId: string): Promise<void> {
  const drive = await getAuthedDrive(userId);

  await withRetry(async () => {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }, AI_PROVIDER_RETRY_CONFIG);
}

// Generic file aliases (for broader use beyond just videos)
export const getFileMetadata = getVideoMetadata;
export const getFileStreamUrl = getVideoStreamUrl;
export const deleteFileFromDrive = deleteVideoFromDrive;

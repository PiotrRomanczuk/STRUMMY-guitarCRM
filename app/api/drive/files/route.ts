import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  CreateDriveFileInputSchema,
  ListDriveFilesQuerySchema,
} from '@/schemas/DriveFileSchema';
import { setFilePublicReadable, getFileMetadata } from '@/lib/services/google-drive';
import { createLogger } from '@/lib/logger';

const log = createLogger('DriveFilesAPI');

/**
 * GET /api/drive/files
 * List files with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryInput = {
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') || undefined,
      file_type: searchParams.get('file_type') || undefined,
      visibility: searchParams.get('visibility') || undefined,
    };

    const query = ListDriveFilesQuerySchema.parse(queryInput);

    // Build query
    let dbQuery = supabase
      .from('drive_files')
      .select('id, uploaded_by, entity_type, entity_id, google_drive_file_id, google_drive_folder_id, file_type, filename, title, description, mime_type, file_size_bytes, metadata, visibility, display_order, created_at, updated_at, deleted_at')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (query.entity_type) {
      dbQuery = dbQuery.eq('entity_type', query.entity_type);
    }
    if (query.entity_id) {
      dbQuery = dbQuery.eq('entity_id', query.entity_id);
    }
    if (query.file_type) {
      dbQuery = dbQuery.eq('file_type', query.file_type);
    }
    if (query.visibility) {
      dbQuery = dbQuery.eq('visibility', query.visibility);
    }

    const { data: files, error } = await dbQuery;

    if (error) {
      log.error('Error fetching files', { error, query });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ files });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: (error as Error).message },
        { status: 400 }
      );
    }
    log.error('Unexpected error listing files', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/drive/files
 * Register an uploaded file (after client-side Drive upload)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify staff role
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_teacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const input = CreateDriveFileInputSchema.parse(body);

    // Make the file publicly readable for streaming
    try {
      await setFilePublicReadable(user.id, input.google_drive_file_id);
    } catch (err) {
      log.warn('Could not set file public readable', { err });
    }

    // Fetch metadata from Drive to fill in any gaps
    let fileSizeBytes = input.file_size_bytes;
    let metadata = input.metadata || {};

    try {
      const driveMeta = await getFileMetadata(user.id, input.google_drive_file_id);
      fileSizeBytes = fileSizeBytes ?? driveMeta.size;

      // For videos, add thumbnail to metadata
      if (input.file_type === 'video' && driveMeta.thumbnailLink) {
        metadata = {
          ...metadata,
          thumbnail_url: driveMeta.thumbnailLink,
        };
      }
      // For images, add thumbnail to metadata
      if (input.file_type === 'image' && driveMeta.thumbnailLink) {
        metadata = {
          ...metadata,
          thumbnail_url: driveMeta.thumbnailLink,
        };
      }
    } catch (err) {
      log.warn('Could not fetch Drive metadata', { err });
    }

    // Get the next display order if not provided
    let displayOrder = input.display_order;
    if (displayOrder === undefined) {
      const { data: lastFile } = await supabase
        .from('drive_files')
        .select('display_order')
        .eq('entity_type', input.entity_type)
        .eq('entity_id', input.entity_id)
        .is('deleted_at', null)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      displayOrder = lastFile ? lastFile.display_order + 1 : 0;
    }

    // Insert file record
    const { data: file, error } = await supabase
      .from('drive_files')
      .insert({
        uploaded_by: user.id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        google_drive_file_id: input.google_drive_file_id,
        google_drive_folder_id: input.google_drive_folder_id || null,
        file_type: input.file_type,
        filename: input.filename,
        title: input.title || input.filename,
        description: input.description || null,
        mime_type: input.mime_type,
        file_size_bytes: fileSizeBytes || null,
        metadata,
        visibility: input.visibility || 'private',
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      log.error('Error saving file metadata', { error, input });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info('File registered successfully', {
      fileId: file.id,
      fileType: input.file_type,
      entityType: input.entity_type,
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as Error).message },
        { status: 400 }
      );
    }
    log.error('Unexpected error registering file', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

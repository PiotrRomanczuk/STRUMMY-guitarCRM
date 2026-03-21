import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateDriveFileInputSchema } from '@/schemas/DriveFileSchema';
import { deleteFileFromDrive } from '@/lib/services/google-drive';
import { createLogger } from '@/lib/logger';

const log = createLogger('DriveFileAPI');

/**
 * GET /api/drive/files/[fileId]
 * Get metadata for a specific file
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch file (RLS handles permission checks)
    const { data: file, error } = await supabase
      .from('drive_files')
      .select('id, uploaded_by, entity_type, entity_id, google_drive_file_id, google_drive_folder_id, file_type, filename, title, description, mime_type, file_size_bytes, metadata, visibility, display_order, created_at, updated_at, deleted_at')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      log.error('Error fetching file', { error, fileId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    log.error('Unexpected error fetching file', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/drive/files/[fileId]
 * Update file metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
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
    const input = UpdateDriveFileInputSchema.parse(body);

    // Update file
    const { data: file, error } = await supabase
      .from('drive_files')
      .update(input)
      .eq('id', fileId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      log.error('Error updating file', { error, fileId });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info('File updated successfully', { fileId });
    return NextResponse.json({ file });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as Error).message },
        { status: 400 }
      );
    }
    log.error('Unexpected error updating file', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drive/files/[fileId]
 * Delete file (soft delete in DB, hard delete from Drive)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
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

    // Get file info before deletion
    const { data: file } = await supabase
      .from('drive_files')
      .select('google_drive_file_id')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Soft delete in database
    const { error: dbError } = await supabase
      .from('drive_files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fileId);

    if (dbError) {
      log.error('Error soft deleting file', { error: dbError, fileId });
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Hard delete from Google Drive
    try {
      await deleteFileFromDrive(user.id, file.google_drive_file_id);
    } catch (err) {
      log.warn('Could not delete file from Drive (may already be deleted)', { err, fileId });
    }

    log.info('File deleted successfully', { fileId });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Unexpected error deleting file', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

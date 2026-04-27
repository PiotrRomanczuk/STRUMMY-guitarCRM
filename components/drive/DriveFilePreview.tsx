'use client';

import type { DriveFile } from '@/types/DriveFile';
import AudioPlayer from './AudioPlayer';
import PdfViewer from './PdfViewer';
import VideoPlayer from '../songs/videos/VideoPlayer';

interface DriveFilePreviewProps {
  file: DriveFile | null;
  onClose: () => void;
}

export default function DriveFilePreview({ file, onClose }: DriveFilePreviewProps) {
  if (!file) return null;

  // Route to appropriate viewer based on file type
  switch (file.file_type) {
    case 'audio':
      return <AudioPlayer file={file} onClose={onClose} />;

    case 'pdf':
      return <PdfViewer file={file} onClose={onClose} />;

    case 'video': {
      // Convert DriveFile to SongVideo format for existing VideoPlayer
      const durationSeconds =
        file.metadata &&
        'duration_seconds' in file.metadata &&
        typeof file.metadata.duration_seconds === 'number'
          ? file.metadata.duration_seconds
          : null;
      const thumbnailUrl =
        file.metadata &&
        'thumbnail_url' in file.metadata &&
        typeof file.metadata.thumbnail_url === 'string'
          ? file.metadata.thumbnail_url
          : null;

      return (
        <VideoPlayer
          video={{
            id: file.id,
            song_id: file.entity_id,
            uploaded_by: file.uploaded_by,
            google_drive_file_id: file.google_drive_file_id,
            google_drive_folder_id: file.google_drive_folder_id ?? null,
            title: file.title ?? file.filename,
            filename: file.filename,
            mime_type: file.mime_type,
            file_size_bytes: file.file_size_bytes ?? null,
            duration_seconds: durationSeconds,
            thumbnail_url: thumbnailUrl,
            display_order: file.display_order,
            video_type: 'tutorial',
            is_recording_correct: false,
            is_well_lit: false,
            mic_type: null,
            is_audio_mixed: false,
            is_video_edited: false,
            production_status: 'idea',
            published_to_instagram: false,
            published_to_tiktok: false,
            published_to_youtube_shorts: false,
            instagram_media_id: null,
            tiktok_media_id: null,
            youtube_shorts_id: null,
            created_at: file.created_at,
            updated_at: file.updated_at,
          }}
          songId={file.entity_id}
          onClose={onClose}
        />
      );
    }

    case 'image':
      return null;

    case 'document':
      // For documents, use PDF viewer (it can handle Google Docs)
      return <PdfViewer file={file} onClose={onClose} />;

    default:
      return null;
  }
}

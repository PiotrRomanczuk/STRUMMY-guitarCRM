export type VideoType = 'tutorial' | 'short';
export type MicType = 'iphone' | 'external';
export type ProductionStatus = 'idea' | 'recording' | 'edited' | 'ready';

export interface SongVideo {
  id: string;
  song_id: string | null;
  uploaded_by: string;
  google_drive_file_id: string;
  google_drive_folder_id: string | null;
  title: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  display_order: number;
  video_type: VideoType;
  is_recording_correct: boolean;
  is_well_lit: boolean;
  mic_type: MicType | null;
  is_audio_mixed: boolean;
  is_video_edited: boolean;
  production_status: ProductionStatus;
  published_to_instagram: boolean;
  published_to_tiktok: boolean;
  published_to_youtube_shorts: boolean;
  instagram_media_id: string | null;
  tiktok_media_id: string | null;
  youtube_shorts_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSongVideoDTO = Pick<
  SongVideo,
  'google_drive_file_id' | 'google_drive_folder_id' | 'title' | 'filename' | 'mime_type'
> &
  Partial<
    Pick<
      SongVideo,
      | 'song_id'
      | 'file_size_bytes'
      | 'duration_seconds'
      | 'thumbnail_url'
      | 'display_order'
      | 'video_type'
    >
  >;

export type UpdateSongVideoDTO = Partial<
  Pick<SongVideo, 'title' | 'display_order' | 'thumbnail_url' | 'duration_seconds'>
>;

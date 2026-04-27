import * as z from 'zod';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export const MicTypeEnum = z.enum(['iphone', 'external']);
export const VideoTypeEnum = z.enum(['tutorial', 'short']);
export const ProductionStatusEnum = z.enum(['idea', 'recording', 'edited', 'ready']);

export const SongVideoSchema = z.object({
  id: z.string().uuid(),
  song_id: z.string().uuid().nullable(),
  uploaded_by: z.string().uuid(),
  google_drive_file_id: z.string().min(1),
  google_drive_folder_id: z.string().nullable(),
  title: z.string().max(200),
  filename: z.string().min(1).max(255),
  mime_type: z.enum(ALLOWED_VIDEO_TYPES),
  file_size_bytes: z.number().int().nonnegative().max(MAX_FILE_SIZE_BYTES).nullable(),
  duration_seconds: z.number().nonnegative().nullable(),
  thumbnail_url: z.string().url().nullable(),
  display_order: z.number().int().nonnegative(),
  video_type: VideoTypeEnum,
  is_recording_correct: z.boolean(),
  is_well_lit: z.boolean(),
  mic_type: MicTypeEnum.nullable(),
  is_audio_mixed: z.boolean(),
  is_video_edited: z.boolean(),
  production_status: ProductionStatusEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateSongVideoInputSchema = z.object({
  google_drive_file_id: z.string().min(1, 'Drive file ID is required'),
  title: z.string().max(200).default(''),
  filename: z.string().min(1, 'Filename is required').max(255),
  mime_type: z.enum(ALLOWED_VIDEO_TYPES),
  file_size_bytes: z.number().int().nonnegative().max(MAX_FILE_SIZE_BYTES).optional(),
  duration_seconds: z.number().nonnegative().optional(),
  thumbnail_url: z.string().url().optional(),
  display_order: z.number().int().nonnegative().optional(),
  video_type: VideoTypeEnum.default('tutorial'),
  song_id: z.string().uuid().optional(),
});

export const UpdateSongVideoInputSchema = z.object({
  title: z.string().max(200).optional(),
  display_order: z.number().int().nonnegative().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  duration_seconds: z.number().nonnegative().nullable().optional(),
  is_recording_correct: z.boolean().optional(),
  is_well_lit: z.boolean().optional(),
  mic_type: MicTypeEnum.nullable().optional(),
  is_audio_mixed: z.boolean().optional(),
  is_video_edited: z.boolean().optional(),
  production_status: ProductionStatusEnum.optional(),
});

export const UploadUrlRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255),
  mime_type: z.enum(ALLOWED_VIDEO_TYPES),
  file_size_bytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES).optional(),
});

export type SongVideoInput = z.infer<typeof CreateSongVideoInputSchema>;
export type SongVideoUpdate = z.infer<typeof UpdateSongVideoInputSchema>;
export type UploadUrlRequest = z.infer<typeof UploadUrlRequestSchema>;

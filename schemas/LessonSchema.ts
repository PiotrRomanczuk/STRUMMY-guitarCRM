import * as z from 'zod';

// Lesson status enum - matches database enum Database["public"]["Enums"]["LessonStatus"]
export const LessonStatusEnum = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

// Lesson schema for validation
export const LessonSchema = z.object({
  id: z.string().uuid().optional(), // UUID, auto-generated
  student_id: z.string().uuid('Student ID is required'),
  teacher_id: z.string().uuid('Teacher ID is required'),
  creator_user_id: z.string().uuid().optional(),
  lesson_number: z.number().int().positive().nullable().optional(),
  lesson_teacher_number: z.number().int().positive().nullable().optional(),
  title: z.string().min(1, 'Title is required').nullable().optional(),
  notes: z.string().nullable().optional(),
  date: z.string().nullable().optional(), // ISO date string from database
  start_time: z.string().nullable().optional(), // time (ISO or HH:mm)
  scheduled_at: z.string().nullable().optional(), // ISO datetime from database
  status: LessonStatusEnum.default('SCHEDULED'),
  created_at: z.string().nullable().optional(), // ISO date string from database
  updated_at: z.string().nullable().optional(), // ISO date string from database
});

// Lesson input schema for creating/updating lessons
export const LessonInputSchema = z.object({
  student_id: z
    .string()
    .min(1, 'Please select a student')
    .uuid('Student must be a valid user'),
  teacher_id: z
    .string()
    .min(1, 'Please select a teacher')
    .uuid('Teacher must be a valid user'),
  title: z.string().min(1, 'Title is required').optional(),
  notes: z.string().optional(),
  date: z.string().optional(), // Date string (YYYY-MM-DD) - optional if scheduled_at is provided
  start_time: z.string().optional(), // time (HH:mm)
  scheduled_at: z.string().min(1, 'Scheduled date & time is required'), // ISO date string or datetime-local format
  status: LessonStatusEnum.optional(),
  song_ids: z.array(z.string().uuid()).optional(),
});

export type LessonInput = z.infer<typeof LessonInputSchema>;
export type Lesson = z.infer<typeof LessonSchema>;

// Lesson with profile information
export const LessonWithProfilesSchema = LessonSchema.extend({
  profile: z
    .object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      email: z.string().email(),
    })
    .optional()
    .nullable(),
  teacher_profile: z
    .object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      email: z.string().email(),
    })
    .optional()
    .nullable(),
  lesson_songs: z
    .array(
      z.object({
        song: z
          .object({
            title: z.string(),
          })
          .nullable(),
      })
    )
    .optional(),
  assignments: z
    .array(
      z.object({
        title: z.string(),
      })
    )
    .optional(),
});

export type LessonWithProfiles = z.infer<typeof LessonWithProfilesSchema>;

// Lesson song status enum
export const SongStatusEnum = z.enum([
  'to_learn',
  'started',
  'remembered',
  'with_author',
  'mastered',
]);

// Lesson song relationship schema
export const LessonSongSchema = z.object({
  lesson_id: z.string().uuid(),
  song_id: z.string().uuid(),
  song_status: SongStatusEnum.default('to_learn'),
});

export type LessonSong = z.infer<typeof LessonSongSchema>;

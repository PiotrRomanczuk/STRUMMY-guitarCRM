import { z } from 'zod';
import { fail, ok } from '../format.js';
import { getSupabase } from '../supabase.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

const LESSON_STATUS = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']);

export const getLessonInput = z.object({
  id: z.string().uuid(),
});

export const listLessonsInput = z.object({
  student_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  status: LESSON_STATUS.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export const getUpcomingLessonsInput = z.object({
  days: z.number().int().min(1).max(60).default(7),
  limit: z.number().int().min(1).max(200).default(50),
});

// Summary columns for list_lessons — no `notes` body to keep responses small.
const LESSON_SUMMARY_COLUMNS =
  'id, title, scheduled_at, status, lesson_teacher_number, student_id, teacher_id';

// Full columns for get_lesson — includes notes + google_event_id.
const LESSON_DETAIL_COLUMNS =
  'id, title, scheduled_at, status, notes, lesson_teacher_number, ' +
  'student_id, teacher_id, google_event_id, created_at, updated_at';

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function getLesson(input: z.infer<typeof getLessonInput>) {
  const sb = getSupabase();

  const [lesson, songs] = await Promise.all([
    sb
      .from('lessons')
      .select(LESSON_DETAIL_COLUMNS)
      .eq('id', input.id)
      .is('deleted_at', null)
      .maybeSingle(),
    sb
      .from('lesson_songs')
      .select('id, status, notes, repertoire_id, songs:song_id ( id, title, author, level )')
      .eq('lesson_id', input.id)
      .order('created_at', { ascending: true }),
  ]);

  if (lesson.error) return fail('Failed to fetch lesson', lesson.error.message);
  if (!lesson.data) return fail('Lesson not found');
  if (songs.error) return fail('Failed to fetch lesson songs', songs.error.message);

  return ok({
    lesson: lesson.data,
    songs: songs.data ?? [],
    song_count: songs.data?.length ?? 0,
  });
}

export async function listLessons(input: z.infer<typeof listLessonsInput>) {
  const sb = getSupabase();

  let query = sb
    .from('lessons')
    .select(LESSON_SUMMARY_COLUMNS)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(input.limit);

  if (input.student_id) query = query.eq('student_id', input.student_id);
  if (input.teacher_id) query = query.eq('teacher_id', input.teacher_id);
  if (input.status) query = query.eq('status', input.status);
  if (input.from) query = query.gte('scheduled_at', input.from);
  if (input.to) query = query.lte('scheduled_at', input.to);

  const { data, error } = await query;
  if (error) return fail('Failed to list lessons', error.message);

  return ok({
    filters: {
      student_id: input.student_id ?? null,
      teacher_id: input.teacher_id ?? null,
      status: input.status ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
    },
    count: data?.length ?? 0,
    lessons: data ?? [],
  });
}

export async function getUpcomingLessons(input: z.infer<typeof getUpcomingLessonsInput>) {
  const sb = getSupabase();
  const now = new Date();
  const horizon = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000);

  const { data, error } = await sb
    .from('lessons')
    .select(
      'id, title, scheduled_at, status, lesson_teacher_number, ' +
        'student:student_id ( id, full_name, email ), ' +
        'teacher_id'
    )
    .eq('status', 'SCHEDULED')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', horizon.toISOString())
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })
    .limit(input.limit);

  if (error) return fail('Failed to fetch upcoming lessons', error.message);

  return ok({
    window_days: input.days,
    horizon: horizon.toISOString(),
    count: data?.length ?? 0,
    lessons: data ?? [],
  });
}

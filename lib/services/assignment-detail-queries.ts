import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type AssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  teacherName: string | null;
  song: { id: string; title: string; author: string | null } | null;
  lesson: { id: string; scheduledAt: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

type EmbeddedProfile = { full_name: string | null; email: string | null } | null;
type EmbeddedSong = { id: string; title: string; author: string | null } | null;
type EmbeddedLesson = { id: string; scheduled_at: string | null } | null;

const one = <T>(value: T | T[] | null | undefined): T | null =>
  (Array.isArray(value) ? (value[0] ?? null) : (value ?? null)) as T | null;

/** Load a single assignment for the detail/edit pages (RLS-scoped). Null if hidden/deleted. */
export async function getAssignmentDetail(assignmentId: string): Promise<AssignmentDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .select(
      'id, title, description, status, due_date, teacher_id, student_id, created_at, updated_at, student:profiles!assignments_student_id_fkey(full_name, email), teacher:profiles!assignments_teacher_id_fkey(full_name), song:songs(id, title, author), lesson:lessons(id, scheduled_at)'
    )
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      logger.warn('[assignment-detail-queries] error', { error: error.message, code: error.code });
    }
    return null;
  }

  const student = one<EmbeddedProfile>(data.student as EmbeddedProfile | EmbeddedProfile[]);
  const teacher = one<EmbeddedProfile>(data.teacher as EmbeddedProfile | EmbeddedProfile[]);
  const song = one<EmbeddedSong>(data.song as EmbeddedSong | EmbeddedSong[]);
  const lesson = one<EmbeddedLesson>(data.lesson as EmbeddedLesson | EmbeddedLesson[]);

  return {
    id: data.id as string,
    title: data.title as string,
    description: (data.description as string) ?? null,
    status: data.status as string,
    dueDate: (data.due_date as string) ?? null,
    teacherId: data.teacher_id as string,
    studentId: data.student_id as string,
    studentName: student?.full_name ?? null,
    studentEmail: student?.email ?? null,
    teacherName: teacher?.full_name ?? null,
    song: song ? { id: song.id, title: song.title, author: song.author ?? null } : null,
    lesson: lesson ? { id: lesson.id, scheduledAt: lesson.scheduled_at ?? null } : null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

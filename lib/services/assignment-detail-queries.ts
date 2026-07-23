import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  ChecklistSchema,
  ChordDrillSchema,
  ChordDrillResultSchema,
  type ChecklistItem,
  type ChordDrill,
  type ChordDrillResult,
} from '@/schemas/AssignmentSchema';

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
  checklist: ChecklistItem[];
  chordDrill: ChordDrill | null;
  chordDrillResult: ChordDrillResult | null;
  dailyTargetMinutes: number | null;
  submissionType: string;
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
      'id, title, description, status, due_date, teacher_id, student_id, checklist, chord_drill, chord_drill_result, daily_target_minutes, submission_type, created_at, updated_at, student:profiles!assignments_student_id_fkey(full_name, email), teacher:profiles!assignments_teacher_id_fkey(full_name), song:songs(id, title, author), lesson:lessons(id, scheduled_at)'
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
    checklist: ChecklistSchema.safeParse(data.checklist).data ?? [],
    chordDrill: ChordDrillSchema.safeParse(data.chord_drill).data ?? null,
    chordDrillResult: ChordDrillResultSchema.safeParse(data.chord_drill_result).data ?? null,
    dailyTargetMinutes: (data.daily_target_minutes as number | null) ?? null,
    submissionType: (data.submission_type as string) ?? 'self_report',
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

export type AssignmentHistoryEntry = {
  id: string;
  changeType: string;
  label: string;
  changedAt: string;
};

function labelForChange(changeType: string, newData: Record<string, unknown> | null): string {
  const status = (newData?.status as string | undefined) ?? null;
  if (changeType === 'created') return 'Created';
  if (changeType === 'status_changed' && status) {
    return `Status changed to ${status.replace(/_/g, ' ')}`;
  }
  return changeType.replace(/_/g, ' ');
}

/**
 * Last ~10 history entries for an assignment detail timeline (ASG-2), newest
 * first. RLS (assignment_history_select_own) scopes this to the owning
 * teacher/student/admin — a single query, no N+1.
 */
export async function getAssignmentHistory(
  assignmentId: string
): Promise<AssignmentHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignment_history')
    .select('id, change_type, new_data, changed_at')
    .eq('assignment_id', assignmentId)
    .order('changed_at', { ascending: false })
    .limit(10);

  if (error) {
    logger.warn('[assignment-detail-queries] history error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    changeType: row.change_type as string,
    label: labelForChange(
      row.change_type as string,
      row.new_data as Record<string, unknown> | null
    ),
    changedAt: row.changed_at as string,
  }));
}

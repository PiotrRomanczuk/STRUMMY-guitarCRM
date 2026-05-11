import { z } from 'zod';
import { getSupabase } from '../supabase.js';
import { fail, ok } from '../format.js';

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------

// Mirrors prod's student_status enum exactly (plus 'all' as MCP-only sugar to
// skip filtering). Earlier versions included lead/trial/churned which don't
// exist on the live DB and would fail at query time. See issue #322.
const STUDENT_STATUS = z.enum(['active', 'archived', 'all']);

// Mirrors prod's song_progress_status enum exactly.
const SONG_STATUS = z.enum(['to_learn', 'started', 'remembered', 'with_author', 'mastered']);

const REPERTOIRE_PRIORITY = z.enum(['high', 'normal', 'low', 'archived']);

// Note: validation that "at least one of id/email/name is set" happens inside
// the handler — a ZodEffects (refine) can't be passed as MCP inputSchema.shape.
export const getStudentInput = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export const listStudentsInput = z.object({
  status: STUDENT_STATUS.default('active'),
  limit: z.number().int().min(1).max(200).default(50),
});

export const getStudentActivityInput = z.object({
  student_id: z.string().uuid(),
  since_days: z.number().int().min(1).max(365).default(30),
  limit: z.number().int().min(1).max(100).default(20),
});

export const getRepertoireInput = z.object({
  student_id: z.string().uuid(),
  status: SONG_STATUS.optional(),
  priority: REPERTOIRE_PRIORITY.optional(),
  only_active: z.boolean().default(true),
});

// ----------------------------------------------------------------------------
// Profile selection — what we always return for a student row
// ----------------------------------------------------------------------------

const PROFILE_COLUMNS =
  'id, email, full_name, is_student, is_teacher, is_admin, ' +
  'student_status, status_changed_at, created_at, updated_at';

// Narrow row type for the columns we select. Local + small to avoid pulling
// the project's generated Database types into this isolated package.
type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_student: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  student_status: string | null;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
};

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function getStudent(input: z.infer<typeof getStudentInput>) {
  if (!input.id && !input.email && !input.name) {
    return fail('Provide one of: id, email, or name');
  }

  const sb = getSupabase();

  let query = sb.from('profiles').select(PROFILE_COLUMNS).eq('is_student', true).limit(1);

  if (input.id) query = query.eq('id', input.id);
  else if (input.email) query = query.eq('email', input.email);
  else if (input.name) query = query.ilike('full_name', `%${input.name}%`);

  const { data, error } = await query.maybeSingle();
  if (error) return fail('Failed to fetch student', error.message);
  if (!data) return fail('Student not found');
  const profile = data as unknown as ProfileRow;

  // Parallel summary queries — last lesson, next lesson, repertoire counts.
  const [last, next, repertoire] = await Promise.all([
    sb
      .from('lessons')
      .select('id, scheduled_at, status')
      .eq('student_id', profile.id)
      .eq('status', 'COMPLETED')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('lessons')
      .select('id, scheduled_at, status')
      .eq('student_id', profile.id)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', new Date().toISOString())
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb
      .from('student_repertoire')
      .select('current_status', { count: 'exact', head: false })
      .eq('student_id', profile.id)
      .eq('is_active', true),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of repertoire.data ?? []) {
    const s = (row as { current_status: string }).current_status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  return ok({
    profile,
    last_completed_lesson: last.data ?? null,
    next_scheduled_lesson: next.data ?? null,
    repertoire_summary: {
      active_total: repertoire.count ?? 0,
      by_status: statusCounts,
    },
  });
}

export async function listStudents(input: z.infer<typeof listStudentsInput>) {
  const sb = getSupabase();

  let query = sb
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('is_student', true)
    .order('status_changed_at', { ascending: false, nullsFirst: false })
    .limit(input.limit);

  if (input.status !== 'all') query = query.eq('student_status', input.status);

  const { data, error, count } = await query;
  if (error) return fail('Failed to list students', error.message);

  return ok({
    status_filter: input.status,
    count: data?.length ?? 0,
    total_returned: count ?? data?.length ?? 0,
    students: data ?? [],
  });
}

export async function getStudentActivity(input: z.infer<typeof getStudentActivityInput>) {
  const sb = getSupabase();
  const since = new Date(Date.now() - input.since_days * 24 * 60 * 60 * 1000).toISOString();

  const [lessons, practice] = await Promise.all([
    sb
      .from('lessons')
      .select('id, scheduled_at, status, notes')
      .eq('student_id', input.student_id)
      .gte('scheduled_at', since)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(input.limit),
    sb
      .from('practice_sessions')
      .select('id, created_at, duration_minutes, song_id, notes')
      .eq('student_id', input.student_id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(input.limit),
  ]);

  if (lessons.error) return fail('Failed to fetch lessons', lessons.error.message);
  if (practice.error) return fail('Failed to fetch practice sessions', practice.error.message);

  return ok({
    student_id: input.student_id,
    window_days: input.since_days,
    lessons: lessons.data ?? [],
    practice_sessions: practice.data ?? [],
  });
}

export async function getRepertoire(input: z.infer<typeof getRepertoireInput>) {
  const sb = getSupabase();

  let query = sb
    .from('student_repertoire')
    .select(
      'id, student_id, song_id, current_status, priority, is_active, ' +
        'preferred_key, capo_fret, self_rating, self_rating_updated_at, ' +
        'total_practice_minutes, last_practiced_at, started_at, mastered_at, ' +
        'songs:song_id ( id, title, author, level )'
    )
    .eq('student_id', input.student_id)
    .order('priority', { ascending: true })
    .order('sort_order', { ascending: true });

  if (input.only_active) query = query.eq('is_active', true);
  if (input.status) query = query.eq('current_status', input.status);
  if (input.priority) query = query.eq('priority', input.priority);

  const { data, error } = await query;
  if (error) return fail('Failed to fetch repertoire', error.message);

  return ok({
    student_id: input.student_id,
    filters: {
      status: input.status ?? null,
      priority: input.priority ?? null,
      only_active: input.only_active,
    },
    count: data?.length ?? 0,
    repertoire: data ?? [],
  });
}

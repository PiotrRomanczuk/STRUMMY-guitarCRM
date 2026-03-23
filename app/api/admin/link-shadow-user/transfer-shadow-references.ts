import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('link-shadow-user');

/**
 * Tables with a `student_id` FK to profiles.
 * Some tables (student_repertoire, song_status_history) may not be
 * present in database.types.ts yet -- we cast the table name for those.
 */
const STUDENT_FK_TABLES = [
  'lessons',
  'assignments',
  'practice_sessions',
  'student_skills',
  'student_song_progress',
  'song_status_history',
  'student_repertoire',
];

export interface TransferResult {
  updatedProfile: Record<string, unknown>;
  counts: Record<string, number>;
}

/**
 * Transfer all FK references from a shadow profile to a real user, then
 * create a new profile for the real user and delete the shadow.
 *
 * Strategy:
 *  1. Create a new profile for the real user (copying shadow metadata)
 *  2. Update student_id FKs in all related tables
 *  3. Update teacher_id FKs (lessons, assignments)
 *  4. Update student_repertoire.assigned_by
 *  5. Delete the old shadow profile
 */
export async function transferShadowReferences(
  supabase: ReturnType<typeof createAdminClient>,
  shadowId: string,
  realUserId: string,
  shadowProfile: { email: string; full_name: string | null },
  realEmail: string
): Promise<TransferResult> {
  const counts: Record<string, number> = {};

  // Step 1: Create the new profile for the real user
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: realUserId,
      email: realEmail,
      full_name: shadowProfile.full_name,
      is_shadow: false,
      is_student: true,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create profile for real user: ${insertError.message}`);
  }

  // Step 2: Transfer all student_id FK references
  for (const table of STUDENT_FK_TABLES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from as (t: string) => any)(table)
      .update({ student_id: realUserId })
      .eq('student_id', shadowId);

    if (error) {
      log.warn(`Failed to transfer ${table} references`, { error: error.message });
    }
    counts[table] = count ?? 0;
  }

  // Step 3: Transfer teacher_id FKs
  counts['lessons_as_teacher'] = await transferColumn(
    supabase, 'lessons', 'teacher_id', shadowId, realUserId
  );
  counts['assignments_as_teacher'] = await transferColumn(
    supabase, 'assignments', 'teacher_id', shadowId, realUserId
  );

  // Step 4: Transfer student_repertoire assigned_by
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: assignedByCount, error: assignedByError } = await (supabase.from as (t: string) => any)('student_repertoire')
    .update({ assigned_by: realUserId })
    .eq('assigned_by', shadowId);

  if (assignedByError) {
    log.warn('Failed to transfer student_repertoire assigned_by', {
      error: assignedByError.message,
    });
  }
  counts['repertoire_assigned_by'] = assignedByCount ?? 0;

  // Step 5: Delete the old shadow profile
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', shadowId);

  if (deleteError) {
    throw new Error(`Failed to delete shadow profile: ${deleteError.message}`);
  }

  return { updatedProfile: newProfile, counts };
}

/** Transfer a single column's FK references in a typed table. */
async function transferColumn(
  supabase: ReturnType<typeof createAdminClient>,
  table: 'lessons' | 'assignments',
  column: string,
  fromId: string,
  toId: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .update({ [column]: toId })
    .eq(column as 'teacher_id', fromId);

  if (error) {
    log.warn(`Failed to transfer ${table}.${column} references`, {
      error: error.message,
    });
  }
  return count ?? 0;
}

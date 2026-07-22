import { getDueChordIds } from '@/app/actions/chord-srs';
import { ChordQuiz } from '@/components/skills/ChordQuiz';
import { createClient } from '@/lib/supabase/server';
import { ChordDrillSchema } from '@/schemas/AssignmentSchema';

/**
 * Chord quiz. With `?drill=<assignmentId>` it runs a teacher-assigned drill
 * (ASG-4): the assignment's chord set, scored back onto the assignment. The
 * assignment read is RLS-scoped — a non-owner gets no row and falls through to
 * the normal (SRS/random) quiz, so nothing leaks.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ drill?: string }>;
}) {
  const { drill: drillId } = await searchParams;

  if (drillId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('assignments')
      .select('id, chord_drill')
      .eq('id', drillId)
      .is('deleted_at', null)
      .single();

    const parsed = ChordDrillSchema.safeParse(data?.chord_drill);
    if (data && parsed.success) {
      return <ChordQuiz drill={{ assignmentId: data.id, chordIds: parsed.data.chord_ids }} />;
    }
    // Drill missing/unreadable — fall through to the normal quiz.
  }

  const result = await getDueChordIds();
  const dueChordIds = 'chordIds' in result ? result.chordIds : [];
  return <ChordQuiz dueChordIds={dueChordIds} />;
}

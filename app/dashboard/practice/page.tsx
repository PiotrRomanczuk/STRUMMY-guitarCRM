import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getPracticeSessions, getStudentRepertoireSongs } from '@/app/actions/practice';
import { PracticeEditorial } from '@/components/practice/editorial';
import type { RepertoireSongOption } from '@/components/practice/editorial';

/**
 * Practice page (spec 05, net-new). Lists the signed-in student's practice
 * sessions and lets them log a new one or undo a session logged today.
 */
export default async function PracticePage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');

  const [sessionsResult, songsResult] = await Promise.all([
    getPracticeSessions(),
    getStudentRepertoireSongs(),
  ]);

  const sessions = 'sessions' in sessionsResult ? sessionsResult.sessions : [];
  const songs: RepertoireSongOption[] = 'songs' in songsResult ? songsResult.songs : [];

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <PracticeEditorial sessions={sessions} songs={songs} isOwnPractice />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getStudentRepertoireAction } from '@/app/actions/repertoire';
import { RepertoireEditorial } from '@/components/repertoire/editorial';

/**
 * Repertoire page (spec 05). Shows the signed-in student's repertoire via
 * RLS-scoped `getStudentRepertoireAction`. Students may edit own notes +
 * difficulty inline (the action whitelists those keys for non-staff callers).
 */
export default async function RepertoirePage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');

  const result = await getStudentRepertoireAction(user.id);
  const entries = 'data' in result ? result.data : [];

  // Staff viewing their OWN /dashboard/repertoire is rare; the per-student
  // teacher edit-all flow lives on the student profile. Here a non-staff viewer
  // (student) gets inline self-edit of notes + difficulty.
  const canEdit = !isAdmin && !isTeacher;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <RepertoireEditorial entries={entries} canEdit={canEdit} />
    </div>
  );
}

import '@/app/design-preview/editorial-tokens.css';

import { redirect } from 'next/navigation';

import { AssignmentCreateEditorial } from '@/components/assignments/editorial/create/AssignmentCreateEditorial';
import { editorialFontClass } from '@/components/_editorial/editorial-fonts';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getSongOptions, getStudentOptions } from '@/lib/services/lesson-form-data';

export default async function NewAssignmentPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/assignments/new');
  }
  if (!isAdmin && !isTeacher) {
    redirect('/dashboard/assignments');
  }

  const [students, songs] = await Promise.all([
    getStudentOptions(user.id, isAdmin),
    getSongOptions(),
  ]);

  return (
    <div className={editorialFontClass}>
      <AssignmentCreateEditorial mode="create" students={students} songs={songs} />
    </div>
  );
}

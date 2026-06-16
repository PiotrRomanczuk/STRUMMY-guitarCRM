import '@/app/design-preview/editorial-tokens.css';

import { notFound, redirect } from 'next/navigation';

import { AssignmentDetailEditorial } from '@/components/assignments/editorial/detail/AssignmentDetailEditorial';
import { editorialFontClass } from '@/components/_editorial/editorial-fonts';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getAssignmentDetail } from '@/lib/services/assignment-detail-queries';

type PageProps = { params: Promise<{ id: string }> };

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/assignments/${id}`);
  }

  const assignment = await getAssignmentDetail(id);
  if (!assignment) {
    notFound();
  }

  const canManage = isAdmin || (isTeacher && assignment.teacherId === user.id);
  const isOwningStudent = isStudent && assignment.studentId === user.id;
  const canAct = canManage || isOwningStudent;

  return (
    <div className={editorialFontClass}>
      <AssignmentDetailEditorial assignment={assignment} canManage={canManage} canAct={canAct} />
    </div>
  );
}

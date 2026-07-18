import '@/app/editorial-tokens.css';

import { notFound, redirect } from 'next/navigation';

import { AssignmentDetailEditorial } from '@/components/assignments/editorial/detail/AssignmentDetailEditorial';
import { editorialFontClass } from '@/components/_editorial/editorial-fonts';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import {
  getAssignmentDetail,
  getAssignmentHistory,
} from '@/lib/services/assignment-detail-queries';

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

  // ASG-2: teacher/admin view only for now — the RLS policy already scopes
  // students to their own assignment's history too, but the UI stays
  // teacher-first per the roadmap's "at minimum" acceptance criteria.
  const history = canManage ? await getAssignmentHistory(id) : [];

  return (
    <div className={editorialFontClass}>
      <AssignmentDetailEditorial
        assignment={assignment}
        canManage={canManage}
        canAct={canAct}
        history={history}
      />
    </div>
  );
}

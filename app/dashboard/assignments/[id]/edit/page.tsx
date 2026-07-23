import '@/app/editorial-tokens.css';

import { notFound, redirect } from 'next/navigation';

import { AssignmentCreateEditorial } from '@/components/assignments/editorial/create/AssignmentCreateEditorial';
import { editorialFontClass } from '@/components/_editorial/editorial-fonts';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getAssignmentDetail } from '@/lib/services/assignment-detail-queries';
import { getSongOptions, getStudentOptions } from '@/lib/services/lesson-form-data';
import { SubmissionTypeEnum } from '@/schemas/AssignmentSchema';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditAssignmentPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/assignments/${id}/edit`);
  }
  if (!isAdmin && !isTeacher) {
    redirect(`/dashboard/assignments/${id}`);
  }

  const assignment = await getAssignmentDetail(id);
  if (!assignment) {
    notFound();
  }
  if (!isAdmin && assignment.teacherId !== user.id) {
    redirect(`/dashboard/assignments/${id}`);
  }

  const [students, songs] = await Promise.all([
    getStudentOptions(user.id, isAdmin),
    getSongOptions(),
  ]);

  return (
    <div className={editorialFontClass}>
      <AssignmentCreateEditorial
        mode="edit"
        students={students}
        songs={songs}
        initial={{
          assignmentId: assignment.id,
          studentId: assignment.studentId,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          songId: assignment.song?.id ?? null,
          checklist: assignment.checklist,
          chordIds: assignment.chordDrill?.chord_ids ?? [],
          dailyTargetMinutes: assignment.dailyTargetMinutes,
          submissionType: SubmissionTypeEnum.catch('self_report').parse(assignment.submissionType),
        }}
      />
    </div>
  );
}

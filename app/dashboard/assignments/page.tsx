import '@/app/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { AssignmentsListEditorial } from '@/components/assignments/editorial/AssignmentsListEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getAssignmentsList, parseAssignmentListParams } from '@/lib/services/assignments-queries';
import { getStudentOptions } from '@/lib/services/lesson-form-data';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/assignments');
  }

  const asStudent = isStudent && !isTeacher && !isAdmin;
  const params = parseAssignmentListParams(await searchParams);
  const canManage = isTeacher || isAdmin;

  const [{ rows, counts }, students] = await Promise.all([
    getAssignmentsList(user.id, asStudent, params),
    canManage ? getStudentOptions(user.id, isAdmin) : Promise.resolve(undefined),
  ]);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <AssignmentsListEditorial
        rows={rows}
        counts={counts}
        asStudent={asStudent}
        canCreate={canManage}
        activeStatus={params.status}
        sort={params.sort}
        dir={params.dir}
        search={params.search}
        students={students}
        studentId={params.studentId}
      />
    </div>
  );
}

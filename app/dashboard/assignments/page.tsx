import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { AssignmentsListEditorial } from '@/components/assignments/editorial/AssignmentsListEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { countAssignmentsByStatus, getAssignments } from '@/lib/services/assignments-queries';

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

export default async function AssignmentsPage() {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/assignments');
  }

  const asStudent = isStudent && !isTeacher && !isAdmin;
  const rows = await getAssignments(user.id, asStudent);
  const counts = countAssignmentsByStatus(rows);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <AssignmentsListEditorial rows={rows} counts={counts} asStudent={asStudent} />
    </div>
  );
}

import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';

import { LessonsListEditorial } from '@/components/lessons/editorial/LessonsListEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getRecentLessons, summariseLessons } from '@/lib/services/lessons-queries';

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

export default async function LessonsPage() {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/lessons');
  }

  const lessons = await getRecentLessons(user.id, isStudent && !isTeacher && !isAdmin);
  const breakdown = summariseLessons(lessons);
  const canCreate = isTeacher || isAdmin;
  const showStudentColumn = isTeacher || isAdmin;

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <LessonsListEditorial
        lessons={lessons}
        breakdown={breakdown}
        canCreate={canCreate}
        showStudentColumn={showStudentColumn}
      />
    </div>
  );
}

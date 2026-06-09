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

const STATUS_KEYS = new Set(['scheduled', 'in_progress', 'completed', 'cancelled']);

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const parseStatuses = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => STATUS_KEYS.has(s));
};

export default async function LessonsPage({ searchParams }: { searchParams: SearchParams }) {
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/lessons');
  }

  const params = await searchParams;
  const activeStatuses = parseStatuses(params.status);
  const activeSort: 'newest' | 'oldest' = params.sort === 'oldest' ? 'oldest' : 'newest';

  const lessons = await getRecentLessons(user.id, isStudent && !isTeacher && !isAdmin, {
    statuses: activeStatuses.length > 0 ? activeStatuses : undefined,
    sort: activeSort,
  });
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
        activeStatuses={activeStatuses}
        activeSort={activeSort}
      />
    </div>
  );
}

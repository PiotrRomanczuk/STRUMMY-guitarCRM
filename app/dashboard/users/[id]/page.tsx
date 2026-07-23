import '@/app/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import { StudentDetailEditorial } from '@/components/users/editorial/StudentDetailEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import {
  getStudentPreferences,
  getStudentProfile,
  getStudentRecentLessons,
  getStudentRepertoire,
} from '@/lib/services/student-detail-queries';
import {
  getStudentLatestNote,
  getStudentNextLesson,
  getStudentPracticeHistory,
  getStudentPracticeSessions,
} from '@/lib/services/student-health-queries';

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

type PageProps = { params: Promise<{ id: string }> };

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/users/${id}`);
  }

  const profile = await getStudentProfile(id);
  if (!profile) {
    notFound();
  }

  const [
    repertoire,
    lessons,
    preferences,
    practiceHistory,
    practiceSessions,
    nextLesson,
    latestNote,
  ] = await Promise.all([
    getStudentRepertoire(id),
    getStudentRecentLessons(id),
    getStudentPreferences(id),
    getStudentPracticeHistory(id, 14),
    getStudentPracticeSessions(id, 30),
    getStudentNextLesson(id),
    getStudentLatestNote(id),
  ]);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <StudentDetailEditorial
        profile={profile}
        repertoire={repertoire}
        lessons={lessons}
        preferences={preferences}
        practiceHistory={practiceHistory}
        practiceSessions={practiceSessions}
        nextLesson={nextLesson}
        latestNote={latestNote}
        canEdit={isAdmin || isTeacher}
      />
    </div>
  );
}

import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import { LessonDetailEditorial } from '@/components/lessons/editorial/LessonDetailEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getLessonDetail } from '@/lib/services/lesson-detail-queries';

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

export default async function LessonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/lessons/${id}`);
  }

  const lesson = await getLessonDetail(id);
  if (!lesson) {
    notFound();
  }

  const canEdit = isAdmin || (isTeacher && lesson.teacherId === user.id);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <LessonDetailEditorial lesson={lesson} canEdit={canEdit} />
    </div>
  );
}

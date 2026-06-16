import '@/app/design-preview/editorial-tokens.css';

import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import { notFound, redirect } from 'next/navigation';

import { LessonFormEditorial } from '@/components/lessons/editorial/form/LessonFormEditorial';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import {
  getLessonForEdit,
  getSongOptions,
  getStudentOptions,
} from '@/lib/services/lesson-form-data';

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

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/lessons/${id}/edit`);
  }
  if (!isAdmin && !isTeacher) {
    redirect(`/dashboard/lessons/${id}`);
  }

  const lesson = await getLessonForEdit(id);
  if (!lesson) {
    notFound();
  }

  const [students, songs] = await Promise.all([
    getStudentOptions(user.id, isAdmin),
    getSongOptions(),
  ]);

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <LessonFormEditorial
        mode="edit"
        students={students}
        songs={songs}
        initial={{
          lessonId: lesson.id,
          studentId: lesson.studentId,
          title: lesson.title,
          notes: lesson.notes,
          scheduledAt: lesson.scheduledAt,
          status: lesson.status,
          songIds: lesson.songIds,
        }}
      />
    </div>
  );
}

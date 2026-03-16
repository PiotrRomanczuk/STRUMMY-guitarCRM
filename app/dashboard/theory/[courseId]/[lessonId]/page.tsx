import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { getTheoryCourse, getTheoryLesson } from '../../actions';
import { TheoryChapterReader } from '@/components/theory';
import { ChapterReaderV2 } from '@/components/v2/theory';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function TheoryLessonPage({ params }: Props) {
  const { courseId, lessonId } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');

  const isStaff = isAdmin || isTeacher;

  const [course, lesson, uiVersion] = await Promise.all([
    getTheoryCourse(courseId),
    getTheoryLesson(lessonId),
    getUIVersion(),
  ]);

  if (!course || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Chapter Not Found</h1>
        <Link href={`/dashboard/theory/${courseId}`} className="text-primary hover:underline">
          Back to Course
        </Link>
      </div>
    );
  }

  // Build prev/next navigation from course lessons
  const allLessons = (course.lessons ?? []).filter(
    (l: { is_published: boolean }) => isStaff || l.is_published
  );
  const currentIdx = allLessons.findIndex(
    (l: { id: string }) => l.id === lessonId
  );
  const prevChapter = currentIdx > 0
    ? { id: allLessons[currentIdx - 1].id, title: allLessons[currentIdx - 1].title }
    : null;
  const nextChapter = currentIdx < allLessons.length - 1
    ? { id: allLessons[currentIdx + 1].id, title: allLessons[currentIdx + 1].title }
    : null;

  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    updated_at: lesson.updated_at,
  };

  if (uiVersion === 'v2') {
    return (
      <ChapterReaderV2
        courseId={courseId}
        courseTitle={course.title}
        lesson={lessonData}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      {isStaff && (
        <div className="flex justify-end mb-4">
          <Link href={`/dashboard/theory/${courseId}/${lessonId}/edit`}>
            <Button size="sm" variant="outline" className="gap-2">
              <Pencil className="size-4" />
              Edit Chapter
            </Button>
          </Link>
        </div>
      )}

      <TheoryChapterReader
        courseId={courseId}
        courseTitle={course.title}
        lesson={lessonData}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />
    </div>
  );
}

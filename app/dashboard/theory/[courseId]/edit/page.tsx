import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { getTheoryCourse } from '../../actions';
import { TheoryCourseForm } from '@/components/theory';
import { CourseFormV2 } from '@/components/v2/theory';

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function EditTheoryCoursePage({ params }: Props) {
  const { courseId } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) redirect('/dashboard/theory');

  const [course, uiVersion] = await Promise.all([
    getTheoryCourse(courseId),
    getUIVersion(),
  ]);
  if (!course) redirect('/dashboard/theory');

  const defaults = {
    title: course.title,
    description: course.description ?? '',
    cover_image_url: course.cover_image_url ?? '',
    level: course.level,
    is_published: course.is_published,
  };

  if (uiVersion === 'v2') {
    return (
      <CourseFormV2
        mode="edit"
        courseId={courseId}
        defaultValues={defaults}
      />
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/dashboard/theory" className="hover:underline">
          Theory
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/theory/${courseId}`} className="hover:underline">
          {course.title}
        </Link>
        <span className="mx-2">/</span>
        <span>Edit</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>
      <TheoryCourseForm
        mode="edit"
        courseId={courseId}
        defaultValues={defaults}
      />
    </div>
  );
}

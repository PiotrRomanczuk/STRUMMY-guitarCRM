import { notFound, redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { CourseFormV2 } from '@/components/v2/theory';
import { getTheoryCourse } from '@/app/dashboard/theory/actions';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!isAdmin && !isTeacher) redirect('/dashboard/theory');

  const course = await getTheoryCourse(courseId);
  if (!course) notFound();

  return (
    <CourseFormV2
      mode="edit"
      courseId={courseId}
      defaultValues={{
        title: course.title,
        description: course.description ?? '',
        cover_image_url: course.cover_image_url ?? '',
        level: course.level,
        is_published: course.is_published,
      }}
    />
  );
}

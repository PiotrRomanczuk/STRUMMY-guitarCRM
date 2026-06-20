import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { CourseFormV2 } from '@/components/v2/theory';

export default async function NewCoursePage() {
  const { isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!isAdmin && !isTeacher) redirect('/dashboard/theory');

  return <CourseFormV2 mode="create" />;
}

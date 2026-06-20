import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { CourseListV2 } from '@/components/v2/theory';
import { getTheoryCourses } from './actions';

export default async function TheoryPage() {
  const [courses, { isAdmin, isTeacher }] = await Promise.all([
    getTheoryCourses(),
    getUserWithRolesSSR(),
  ]);

  return <CourseListV2 courses={courses} isStaff={isAdmin || isTeacher} />;
}

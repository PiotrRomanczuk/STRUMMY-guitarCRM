import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getTheoryCourses } from './actions';
import { getUIVersion } from '@/lib/ui-version.server';
import { TheoryCourseCard } from '@/components/theory';
import { CourseListV2 } from '@/components/v2/theory';
import { Button } from '@/components/ui/button';
import type { TheoryCourse } from '@/components/v2/theory';

export default async function TheoryCoursesPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');

  const isStaff = isAdmin || isTeacher;
  const [courses, uiVersion] = await Promise.all([
    getTheoryCourses(),
    getUIVersion(),
  ]);

  if (uiVersion === 'v2') {
    return (
      <CourseListV2
        courses={courses as TheoryCourse[]}
        isStaff={isStaff}
      />
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Theory Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured lessons on music theory and guitar fundamentals
          </p>
        </div>
        {isStaff && (
          <Link href="/dashboard/theory/new">
            <Button className="gap-2">
              <Plus className="size-4" />
              New Course
            </Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {isStaff
              ? 'No theory courses yet. Create your first one!'
              : 'No courses available yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <TheoryCourseCard key={course.id} course={course} isStaff={isStaff} />
          ))}
        </div>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { TheoryCourseForm } from '@/components/theory';
import { CourseFormV2 } from '@/components/v2/theory';

export default async function NewTheoryCoursePage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) redirect('/sign-in');
  if (!isAdmin && !isTeacher) redirect('/dashboard/theory');

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <CourseFormV2 mode="create" />;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/dashboard/theory" className="hover:underline">
          Theory
        </Link>
        <span className="mx-2">/</span>
        <span>New Course</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Create Theory Course</h1>
      <TheoryCourseForm mode="create" />
    </div>
  );
}

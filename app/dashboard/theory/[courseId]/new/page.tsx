import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { TheoryLessonForm } from '@/components/theory';

export default async function NewLessonPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!isAdmin && !isTeacher) redirect(`/dashboard/theory/${courseId}`);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-serif text-2xl mb-6">New chapter</h1>
      <TheoryLessonForm courseId={courseId} mode="create" />
    </div>
  );
}

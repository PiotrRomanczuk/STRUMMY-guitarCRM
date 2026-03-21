export const dynamic = 'force-dynamic';

import LessonList from '@/components/lessons/list';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { StudentLessonsPageClient } from '@/components/lessons/student/StudentLessonsPageClient';
import { getUIVersion } from '@/lib/ui-version.server';
import { LessonListV2 } from '@/components/v2/lessons';
import { createClient } from '@/lib/supabase/server';
import { transformLessonData } from '@/app/api/lessons/utils';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LessonsPage(props: Props) {
  const searchParams = await props.searchParams;
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();

  if (!user) redirect('/sign-in');

  // If user is a student and NOT an admin/teacher, show the student view
  if (isStudent && !isAdmin && !isTeacher) {
    return <StudentLessonsPageClient />;
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    const supabase = await createClient();
    const role = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student';

    let lessonQuery = supabase.from('lessons').select(`
      *,
      profile:profiles!lessons_student_id_fkey(id, full_name, email),
      teacher_profile:profiles!lessons_teacher_id_fkey(id, full_name, email),
      lesson_songs(song:songs(title)),
      assignments(title)
    `);

    if (isTeacher && !isAdmin) {
      lessonQuery = lessonQuery.eq('teacher_id', user.id);
    }

    lessonQuery = lessonQuery
      .order('scheduled_at', { ascending: false })
      .order('created_at', { ascending: false });

    const { data: rawLessons } = await lessonQuery;
    const lessons = (rawLessons || []).map((lesson) =>
      transformLessonData(lesson as LessonWithProfiles & { scheduled_at?: string })
    ) as LessonWithProfiles[];

    return <LessonListV2 initialLessons={lessons} role={role} />;
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
      <LessonList searchParams={searchParams} />
    </div>
  );
}

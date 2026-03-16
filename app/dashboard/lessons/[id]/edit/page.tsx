import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';
import { LessonForm } from '@/components/lessons';
import { LessonFormV2 } from '@/components/v2/lessons';
import { transformLessonData } from '@/app/api/lessons/utils';
import { getUIVersion } from '@/lib/ui-version.server';

interface LessonEditPageProps {
  params: Promise<{ id: string }>;
}

interface LessonWithSongs {
  student_id: string;
  teacher_id: string;
  date: string;
  start_time: string | null;
  title: string | null;
  notes: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  lesson_songs: { song_id: string }[];
}

async function fetchLesson(id: string) {
  const supabase = await createClient();

  // Explicitly select columns to avoid schema cache issues with missing 'title' column
  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      student_id,
      teacher_id,
      scheduled_at,
      status,
      notes,
      title,
      created_at,
      updated_at,
      profile:profiles!lessons_student_id_fkey(id, full_name, email),
      teacher_profile:profiles!lessons_teacher_id_fkey(id, full_name, email),
      lesson_songs(song_id)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return transformLessonData(data) as unknown as LessonWithSongs;
}

function NotFoundView() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Lesson Not Found</h1>
        <p className="text-gray-600">The lesson you are looking for does not exist.</p>
      </div>
    </div>
  );
}

function UnauthorizedView() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Unauthorized</h1>
        <p className="text-gray-600">You do not have permission to edit this lesson.</p>
      </div>
    </div>
  );
}

function verifyAccess(
  user: { id: string },
  isAdmin: boolean,
  isTeacher: boolean,
  lesson: LessonWithSongs
) {
  return isAdmin || (isTeacher && lesson.teacher_id === user.id);
}

export default async function LessonEditPage({ params }: LessonEditPageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  const lesson = await fetchLesson(id);

  if (!lesson) {
    return <NotFoundView />;
  }

  if (!verifyAccess(user, isAdmin, isTeacher, lesson)) {
    return <UnauthorizedView />;
  }

  const initialData = {
    student_id: lesson.student_id,
    teacher_id: lesson.teacher_id,
    scheduled_at: `${lesson.date}T${lesson.start_time || '00:00'}`,
    title: lesson.title || '',
    notes: lesson.notes || '',
    status: lesson.status,
    song_ids: lesson.lesson_songs?.map((ls) => ls.song_id) || [],
  };

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <LessonFormV2 initialData={initialData} lessonId={id} />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Lesson</h1>
      <LessonForm initialData={initialData} lessonId={id} />
    </div>
  );
}

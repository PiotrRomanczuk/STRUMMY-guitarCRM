import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';
import { LiveLessonView } from '@/components/lessons/live';
import { LiveLessonV2 } from '@/components/v2/lessons';
import { Database } from '@/database.types';
import { logger } from '@/lib/logger';
import { getUIVersion } from '@/lib/ui-version.server';

interface LiveLessonPageProps {
  params: Promise<{ id: string }>;
}

interface LessonRow {
  id: string;
  title: string | null;
  notes: string | null;
  status: Database['public']['Enums']['lesson_status'];
  scheduled_at: string;
  teacher_id: string;
  profile: { id: string; full_name: string | null; email: string } | null;
  lesson_songs: {
    id: string;
    status: Database['public']['Enums']['lesson_song_status'];
    song: { id: string; title: string; author: string } | null;
  }[];
}

async function fetchLessonForLive(id: string): Promise<LessonRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      title,
      notes,
      status,
      scheduled_at,
      teacher_id,
      profile:profiles!lessons_student_id_fkey(id, full_name, email),
      lesson_songs(
        id,
        status,
        song:songs(id, title, author)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    logger.error('Error fetching lesson for live view:', error);
    return null;
  }

  return data as unknown as LessonRow;
}

export default async function LiveLessonPage({ params }: LiveLessonPageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  if (!isAdmin && !isTeacher) {
    redirect(`/dashboard/lessons/${id}`);
  }

  const lesson = await fetchLessonForLive(id);

  if (!lesson) {
    redirect(`/dashboard/lessons/${id}`);
  }

  // Only the assigned teacher or admin can access live mode
  if (!isAdmin && lesson.teacher_id !== user.id) {
    redirect(`/dashboard/lessons/${id}`);
  }

  const studentName =
    lesson.profile?.full_name ?? lesson.profile?.email ?? 'Unknown Student';

  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    notes: lesson.notes,
    status: lesson.status,
    scheduledAt: lesson.scheduled_at,
    studentName,
    lessonSongs: lesson.lesson_songs,
  };

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <LiveLessonV2 lesson={lessonData} />;
  }

  return <LiveLessonView lesson={lessonData} />;
}

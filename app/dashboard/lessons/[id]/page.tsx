import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { createClient } from '@/lib/supabase/server';
import { LessonWithProfiles } from '@/schemas/LessonSchema';
import { Database } from '@/database.types';

import { LessonSongsList, LessonDetailsCard, LessonAssignmentsList, PostLessonPrompt } from '@/components/lessons';
import { StudentLessonDetailPageClient } from '@/components/lessons/student/StudentLessonDetailPageClient';
import { LessonDetailV2 } from '@/components/v2/lessons';
import { HistoryTimeline } from '@/components/shared/HistoryTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { getUIVersion } from '@/lib/ui-version.server';

interface LessonDetailPageProps {
  params: Promise<{ id: string }>;
}

interface LessonDetail extends LessonWithProfiles {
  lesson_songs: {
    id: string;
    status: Database['public']['Enums']['lesson_song_status'];
    song: {
      id: string;
      title: string;
      author: string;
    } | null;
  }[];
  assignments: {
    id: string;
    title: string;
    status: Database['public']['Enums']['assignment_status'];
    due_date: string | null;
  }[];
}

async function fetchLesson(id: string): Promise<LessonDetail | null> {
  try {
    const supabase = await createClient();
    const { user } = await getUserWithRolesSSR();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('lessons')
      .select(
        `
        *,
        profile:profiles!lessons_student_id_fkey(id, full_name, email),
        teacher_profile:profiles!lessons_teacher_id_fkey(id, full_name, email),
        lesson_songs(
          id,
          status,
          song:songs(id, title, author)
        ),
        assignments(
          id,
          title,
          status,
          due_date
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.error('Error fetching lesson:', error);
      return null;
    }

    return data as unknown as LessonDetail;
  } catch (err) {
    logger.error('Exception fetching lesson:', err);
    return null;
  }
}

async function handleDeleteLesson(id: string) {
  'use server';
  const supabase = await createClient();
  await supabase
    .from('lessons')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  redirect('/dashboard/lessons');
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { id } = await params;
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  // If user is a student and NOT an admin/teacher, show the student view
  if (isStudent && !isAdmin && !isTeacher) {
    return <StudentLessonDetailPageClient />;
  }

  const lesson = await fetchLesson(id);

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Lesson Not Found</h1>
          <p className="text-gray-600 mb-4">The lesson does not exist.</p>
          <Link href="/dashboard/lessons" className="text-blue-600 hover:underline">
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = isAdmin || (isTeacher && lesson.teacher_id === user.id);
  const canDelete = isAdmin || (isTeacher && lesson.teacher_id === user.id);

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return (
      <LessonDetailV2
        lesson={lesson}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={handleDeleteLesson.bind(null, id)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/lessons" className="text-blue-600 hover:underline">
          Back to Lessons
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<DetailSkeleton />}>
            <LessonDetailsCard
              lesson={lesson}
              canEdit={canEdit}
              canDelete={canDelete}
              onDelete={handleDeleteLesson.bind(null, id)}
            />
          </Suspense>

          <Suspense fallback={<ListSkeleton title="Songs" />}>
            <LessonSongsList
              lessonId={lesson.id!}
              lessonSongs={lesson.lesson_songs}
              canEdit={canEdit}
            />
          </Suspense>

          <Suspense fallback={<ListSkeleton title="Assignments" />}>
            <LessonAssignmentsList
              lessonId={lesson.id!}
              studentId={lesson.student_id}
              teacherId={lesson.teacher_id}
              assignments={lesson.assignments}
              canEdit={canEdit}
            />
          </Suspense>

          {lesson.status === 'COMPLETED' && lesson.lesson_songs.length > 0 && (
            <PostLessonPrompt
              lessonId={lesson.id!}
              studentId={lesson.student_id}
              studentName={
                lesson.profile?.full_name || lesson.profile?.email || 'Student'
              }
              songs={lesson.lesson_songs
                .filter((ls) => ls.song !== null)
                .map((ls) => ({
                  id: ls.song!.id,
                  title: ls.song!.title,
                  status: ls.status || 'to_learn',
                }))}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<HistorySkeleton />}>
            <HistoryTimeline recordId={lesson.id!} recordType="lesson" title="Lesson History" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Skeleton components for progressive rendering
function DetailSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function ListSkeleton({ title: _title }: { title: string }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

import { LessonForm } from '@/components/lessons';
import { NewLessonTabs } from '@/components/v2/lessons/NewLessonTabs';
import { NewLessonTabsStitch } from '@/components/v2/stitch/lessons/NewLessonTabsStitch';
import { getUIVersion } from '@/lib/ui-version.server';

interface NewLessonPageProps {
  searchParams: Promise<{ student_id?: string; song?: string }>;
}

export default async function NewLessonPage({ searchParams }: NewLessonPageProps) {
  const { student_id, song } = await searchParams;

  const initialData: { student_id?: string; song_ids?: string[] } = {};
  if (student_id) initialData.student_id = student_id;
  if (song) initialData.song_ids = song.split(',');

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v3') {
    return (
      <NewLessonTabsStitch
        initialData={Object.keys(initialData).length > 0 ? initialData : undefined}
      />
    );
  }

  if (uiVersion === 'v2') {
    return (
      <NewLessonTabs
        initialData={Object.keys(initialData).length > 0 ? initialData : undefined}
      />
    );
  }

  return (
    <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create New Lesson</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule a new lesson for a student</p>
        </div>
        <LessonForm initialData={Object.keys(initialData).length > 0 ? initialData : undefined} />
      </div>
    </main>
  );
}

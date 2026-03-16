import { LessonStatsPageEnhanced as LessonStatsPageClient } from '@/components/lessons/stats';
import { StatsOverview } from '@/components/v2/stats';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { redirect } from 'next/navigation';

export default async function LessonStatsPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  if (!isAdmin && !isTeacher) {
    redirect('/dashboard');
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return <StatsOverview />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lesson Statistics</h1>
        <p className="text-muted-foreground">Comprehensive analytics about lessons, students, and scheduling.</p>
      </div>
      <LessonStatsPageClient />
    </div>
  );
}

import { fetchPendingConflicts } from '@/app/actions/calendar-conflicts';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { ConflictList } from './ConflictList';

export default async function CalendarConflictsPage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/calendar/conflicts');
  }

  const result = await fetchPendingConflicts();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sync Conflicts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resolve differences between your local lessons and Google Calendar.
        </p>
      </div>

      {!result.success && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {result.error ?? 'Failed to load conflicts.'}
        </div>
      )}

      {result.success && <ConflictList conflicts={result.conflicts ?? []} />}
    </div>
  );
}

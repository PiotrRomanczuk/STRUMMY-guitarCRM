import { Suspense } from 'react';
import { CalendarEventsList } from '@/components/dashboard/calendar/CalendarEventsList';
import { CalendarSkeleton } from '@/components/ui/skeleton-screens';
import { Calendar as V2Calendar } from '@/components/v2/calendar';
import { CalendarSkeleton as V2CalendarSkeleton } from '@/components/v2/calendar';
import { getGoogleEvents } from '@/app/dashboard/calendar-actions';
import { getUIVersion } from '@/lib/ui-version.server';
import { isGuitarLesson, type GoogleEvent } from '@/lib/calendar/calendar-utils';

export default async function CalendarPage() {
  const [eventsData, uiVersion] = await Promise.all([
    getGoogleEvents(),
    getUIVersion(),
  ]);

  const initialEvents = eventsData === null ? null : (eventsData as GoogleEvent[]).filter(isGuitarLesson);
  const isConnected = eventsData !== null;

  if (uiVersion === 'v2') {
    return (
      <Suspense fallback={<V2CalendarSkeleton />}>
        <V2Calendar events={initialEvents} isConnected={isConnected} />
      </Suspense>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Calendar</h1>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarEventsList initialEvents={initialEvents} isConnected={isConnected} />
      </Suspense>
    </div>
  );
}

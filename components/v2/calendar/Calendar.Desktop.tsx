'use client';

import { CalendarEventsList } from '@/components/dashboard/calendar/CalendarEventsList';
import type { GoogleEvent } from '@/lib/calendar/calendar-utils';

interface CalendarDesktopProps {
  events: GoogleEvent[] | null;
  isConnected: boolean;
}

/**
 * Desktop calendar view.
 * Reuses the existing v1 CalendarEventsList which already handles
 * desktop layout with month grid + day events panel.
 */
export default function CalendarDesktop({ events, isConnected }: CalendarDesktopProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Calendar</h1>
      <CalendarEventsList
        initialEvents={events}
        isConnected={isConnected}
      />
    </div>
  );
}

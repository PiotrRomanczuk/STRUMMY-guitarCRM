'use client';

import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { WeekStrip } from './WeekStrip';
import { AgendaView } from './AgendaView';
import { EventSheet } from './EventSheet';
import { CalendarSkeleton } from './Calendar.Skeleton';
import type { GoogleEvent } from '@/lib/calendar/calendar-utils';

const CalendarDesktop = lazy(() => import('./Calendar.Desktop'));

interface CalendarProps {
  events: GoogleEvent[] | null;
  isConnected: boolean;
}

/**
 * v2 Calendar — mobile-first with agenda default.
 *
 * Mobile: WeekStrip + AgendaView + EventSheet (bottom sheet)
 * Desktop: lazy-loaded desktop view (reuses v1 CalendarEventsList)
 */
export function Calendar({ events, isConnected }: CalendarProps) {
  const mode = useLayoutMode();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<GoogleEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const safeEvents = useMemo(() => events || [], [events]);

  /** Dates that have at least one event */
  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    const seen = new Set<string>();

    for (const event of safeEvents) {
      const dateStr = event.start.dateTime || event.start.date;
      if (!dateStr) continue;
      const date = parseISO(dateStr);
      const key = date.toDateString();
      if (!seen.has(key)) {
        seen.add(key);
        dates.push(date);
      }
    }
    return dates;
  }, [safeEvents]);

  const handleEventClick = useCallback((event: GoogleEvent) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  }, []);

  if (mode !== 'mobile') {
    return (
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarDesktop events={events} isConnected={isConnected} />
      </Suspense>
    );
  }

  // Mobile: not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold mb-1">Calendar not connected</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Connect your Google Calendar to see your upcoming lessons here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Sticky week strip */}
      <div className="sticky top-0 z-10">
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventDates={eventDates}
        />
      </div>

      {/* Scrollable agenda */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AgendaView
          events={safeEvents}
          selectedDate={selectedDate}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Event detail bottom sheet */}
      <EventSheet
        event={selectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

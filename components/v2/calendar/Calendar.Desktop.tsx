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
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 max-w-6xl mx-auto w-full">
        <div className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">Schedule</div>
        <h1 className="mt-1 font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">Calendar</h1>
        <div className="text-muted-foreground text-[13px] mt-1.5">
          {isConnected ? 'Synced with Google Calendar' : 'Connect Google Calendar to sync events'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 pb-10 max-w-6xl mx-auto w-full">
        <CalendarEventsList
          initialEvents={events}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}

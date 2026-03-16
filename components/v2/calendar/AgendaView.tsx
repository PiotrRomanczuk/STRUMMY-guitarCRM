'use client';

import { useMemo } from 'react';
import { format, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { Clock, MapPin, User, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import type { GoogleEvent } from '@/lib/calendar/calendar-utils';

interface AgendaViewProps {
  events: GoogleEvent[];
  selectedDate: Date;
  onEventClick: (event: GoogleEvent) => void;
}

/** Parsed event with extracted time info */
interface ParsedEvent {
  event: GoogleEvent;
  startTime: Date;
  endTime: Date | null;
  isAllDay: boolean;
}

function parseEvent(event: GoogleEvent): ParsedEvent | null {
  const startStr = event.start.dateTime || event.start.date;
  if (!startStr) return null;

  const isAllDay = !event.start.dateTime;
  const startTime = parseISO(startStr);
  const endStr = event.end.dateTime || event.end.date;
  const endTime = endStr ? parseISO(endStr) : null;

  return { event, startTime, endTime, isAllDay };
}

function getTimeLabel(parsed: ParsedEvent): string {
  if (parsed.isAllDay) return 'All day';
  const start = format(parsed.startTime, 'h:mm a');
  if (!parsed.endTime) return start;

  const spansMidnight =
    !isSameDay(parsed.startTime, parsed.endTime) &&
    parsed.endTime.getTime() !== parsed.startTime.getTime();

  const endLabel = spansMidnight
    ? `${format(parsed.endTime, 'h:mm a')} (+1d)`
    : format(parsed.endTime, 'h:mm a');

  return `${start} - ${endLabel}`;
}

function getAttendeeNames(event: GoogleEvent): string[] {
  return (event.attendees || [])
    .filter((a): a is { email: string; responseStatus?: string } => !!a.email)
    .map((a) => a.email.split('@')[0])
    .slice(0, 2);
}

/**
 * List-based agenda view for mobile calendar.
 * Shows events for the selected date sorted by time.
 */
export function AgendaView({ events, selectedDate, onEventClick }: AgendaViewProps) {
  const dayEvents = useMemo(() => {
    const parsed = events
      .map(parseEvent)
      .filter((p): p is ParsedEvent => p !== null)
      .filter((p) => isSameDay(p.startTime, selectedDate))
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      });
    return parsed;
  }, [events, selectedDate]);

  const now = new Date();
  const isCurrentDay = isSameDay(selectedDate, now);

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">No lessons</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No lessons scheduled for {format(selectedDate, 'EEEE, MMMM d')}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      {/* Date header */}
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
        {format(selectedDate, 'EEEE, MMMM d')}
        <span className="ml-2 normal-case tracking-normal">
          ({dayEvents.length} lesson{dayEvents.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {/* Event list */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {dayEvents.map((parsed) => {
          const isPast = isCurrentDay && isBefore(parsed.startTime, now) && !parsed.isAllDay;
          const isCurrent = isCurrentDay
            && !parsed.isAllDay
            && isAfter(now, parsed.startTime)
            && parsed.endTime
            && isBefore(now, parsed.endTime);

          return (
            <motion.button
              key={parsed.event.id}
              variants={listItem}
              onClick={() => onEventClick(parsed.event)}
              className={cn(
                'w-full text-left bg-card rounded-xl border border-border p-4 space-y-2',
                'active:bg-muted/50 transition-colors min-h-[44px]',
                isCurrent && 'border-primary/40 bg-primary/5',
                isPast && 'opacity-60'
              )}
            >
              {/* Row 1: Title + status */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate text-foreground">
                  {parsed.event.summary || 'Untitled Lesson'}
                </span>
                {isCurrent && (
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5',
                    'text-[11px] font-medium border',
                    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                  )}>
                    Now
                  </span>
                )}
              </div>

              {/* Row 2: Time */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{getTimeLabel(parsed)}</span>
              </div>

              {/* Row 3: Location or attendees */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {parsed.event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{parsed.event.location}</span>
                  </div>
                )}
                {getAttendeeNames(parsed.event).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {getAttendeeNames(parsed.event).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

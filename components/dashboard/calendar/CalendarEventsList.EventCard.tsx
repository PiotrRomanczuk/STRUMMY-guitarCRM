'use client';

import { Button } from '@/components/ui/button';
import { Clock, MapPin, UserPlus } from 'lucide-react';
import { type GoogleEvent, formatEventTime } from '@/lib/calendar/calendar-utils';

interface EventCardProps {
  event: GoogleEvent;
  showAttendees: boolean;
  isPending: boolean;
  onCreateShadowUser: (email: string) => void;
}

export function EventCard({ event, showAttendees, isPending, onCreateShadowUser }: EventCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="font-medium truncate">{event.summary}</div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatEventTime(event.start, event.end)}
        </div>
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{event.location}</span>
          </div>
        )}
      </div>

      {showAttendees && event.attendees && event.attendees.length > 0 && (
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
          {event.attendees
            .filter((a): a is { email: string; responseStatus?: string } => !!a.email)
            .map((attendee) => (
            <div
              key={attendee.email}
              className="flex items-center gap-2 text-xs bg-secondary/50 p-1.5 rounded-md"
            >
              <span className="text-muted-foreground">{attendee.email}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-5 sm:w-5 hover:bg-primary/10 hover:text-primary"
                title="Create Shadow User & Sync"
                onClick={(e) => {
                  e.preventDefault();
                  onCreateShadowUser(attendee.email);
                }}
                disabled={isPending}
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

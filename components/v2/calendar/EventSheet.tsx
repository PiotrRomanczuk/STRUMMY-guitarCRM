'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import type { GoogleEvent } from '@/lib/calendar/calendar-utils';

interface EventSheetProps {
  event: GoogleEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatEventDateRange(event: GoogleEvent): string {
  const startStr = event.start.dateTime || event.start.date;
  if (!startStr) return '';

  if (event.start.date) {
    return format(parseISO(startStr), 'EEEE, MMMM d, yyyy');
  }

  const start = parseISO(startStr);
  const endStr = event.end.dateTime;
  if (endStr) {
    const end = parseISO(endStr);
    return `${format(start, 'EEEE, MMMM d')} at ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  }

  return format(start, 'EEEE, MMMM d, yyyy h:mm a');
}

function getDuration(event: GoogleEvent): string | null {
  if (!event.start.dateTime || !event.end.dateTime) return null;
  const start = parseISO(event.start.dateTime);
  const end = parseISO(event.end.dateTime);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Bottom sheet displaying event details on mobile.
 * Uses Drawer component for native bottom-sheet experience.
 */
export function EventSheet({ event, open, onOpenChange }: EventSheetProps) {
  if (!event) return null;

  const duration = getDuration(event);
  const attendees = event.attendees || [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-left text-lg font-semibold">
              {event.summary || 'Untitled Lesson'}
            </DrawerTitle>
            <DrawerDescription className="text-left text-sm text-muted-foreground">
              Lesson details
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4">
            {/* Date & Time */}
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={formatEventDateRange(event)}
            />

            {/* Duration */}
            {duration && (
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Duration"
                value={duration}
              />
            )}

            {/* Location */}
            {event.location && (
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={event.location}
              />
            )}

            {/* Attendees */}
            {attendees.length > 0 && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Attendees
                  </p>
                  <div className="space-y-1">
                    {attendees.map((attendee, index) => (
                      <p
                        key={attendee.email ?? `attendee-${index}`}
                        className="text-sm text-foreground truncate"
                      >
                        {attendee.email ?? 'No email provided'}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                  {event.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-2">
              {event.htmlLink && (
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  asChild
                >
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google
                  </a>
                </Button>
              )}
              <Button
                variant="default"
                className="flex-1 min-h-[44px]"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Reusable info row for event sheet */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

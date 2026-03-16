export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  attendees?: { email?: string; responseStatus?: string }[];
}

export function isGuitarLesson(event: { description?: string | null }): boolean {
  if (!event.description) return false;
  return event.description.includes('Powered by Calendly.com');
}

export function formatEventTime(
  start: { dateTime?: string; date?: string },
  end: { dateTime?: string; date?: string }
) {
  if (start.date) {
    return new Date(start.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  if (start.dateTime && end.dateTime) {
    const startDate = new Date(start.dateTime);
    const endDate = new Date(end.dateTime);

    return `${startDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} • ${startDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })} - ${endDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }

  return '';
}

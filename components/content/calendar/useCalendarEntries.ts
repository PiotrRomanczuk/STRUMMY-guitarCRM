'use client';

import { useQuery } from '@tanstack/react-query';
import type { CalendarEntry } from './types';

export interface CalendarRange {
  from: Date;
  to: Date;
}

async function fetchEntries(range: CalendarRange): Promise<CalendarEntry[]> {
  const url = new URL('/api/content/calendar', window.location.origin);
  url.searchParams.set('from', range.from.toISOString());
  url.searchParams.set('to', range.to.toISOString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to load calendar');
  return ((await res.json()).entries ?? []) as CalendarEntry[];
}

export function useCalendarEntries(range: CalendarRange) {
  return useQuery({
    queryKey: ['content-calendar', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchEntries(range),
  });
}

export function monthRange(date: Date): CalendarRange {
  const from = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
  const to = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59));
  return { from, to };
}

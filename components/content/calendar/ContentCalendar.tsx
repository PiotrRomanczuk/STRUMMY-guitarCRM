'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarEntries, monthRange } from './useCalendarEntries';
import ContentCalendarMonthView from './ContentCalendar.MonthView';
import ContentCalendarAgendaView from './ContentCalendar.AgendaView';
import PostQuickPreview from './PostQuickPreview';
import type { CalendarEntry } from './types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ContentCalendar() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const range = monthRange(monthDate);
  const { data: entries = [], isLoading } = useCalendarEntries(range);

  const shiftMonth = (delta: number) =>
    setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1));

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold sm:text-xl">
            {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonthDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('month')}
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            Month
          </Button>
          <Button
            variant={view === 'agenda' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('agenda')}
          >
            <ListChecks className="mr-1 h-4 w-4" />
            Agenda
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : view === 'month' ? (
        <ContentCalendarMonthView
          monthDate={monthDate}
          entries={entries}
          onSelectEntry={setSelected}
        />
      ) : (
        <ContentCalendarAgendaView entries={entries} onSelectEntry={setSelected} />
      )}

      <PostQuickPreview entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

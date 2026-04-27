'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import PlatformPill from './PlatformPill';
import type { CalendarEntry } from './types';

interface Props {
  monthDate: Date;
  entries: CalendarEntry[];
  onSelectEntry: (entry: CalendarEntry) => void;
}

function startOfCalendarGrid(monthDate: Date): Date {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const dow = first.getDay(); // Sun = 0
  const offset = dow === 0 ? 6 : dow - 1; // Mon-first
  return new Date(first.getFullYear(), first.getMonth(), 1 - offset);
}

export default function ContentCalendarMonthView({ monthDate, entries, onSelectEntry }: Props) {
  const days = useMemo(() => {
    const start = startOfCalendarGrid(monthDate);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      out.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return out;
  }, [monthDate]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      if (!e.scheduled_at) continue;
      const d = new Date(e.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {weekdayLabels.map((l) => (
          <div key={l} className="px-2 py-1.5 text-center">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = d.getMonth() === monthDate.getMonth();
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const dayEntries = byDay.get(key) ?? [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div
              key={key}
              className={cn(
                'min-h-[88px] border-b border-r border-border/40 p-1.5 text-xs',
                !inMonth && 'bg-muted/10 text-muted-foreground/60'
              )}
            >
              <div
                className={cn(
                  'mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                  isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {dayEntries.map((e) => (
                  <PlatformPill
                    key={e.id}
                    platform={e.platform}
                    status={e.status}
                    title={e.song?.title ?? undefined}
                    onClick={() => onSelectEntry(e)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

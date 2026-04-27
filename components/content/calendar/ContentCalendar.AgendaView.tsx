'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { CalendarEntry } from './types';

interface Props {
  entries: CalendarEntry[];
  onSelectEntry: (e: CalendarEntry) => void;
}

export default function ContentCalendarAgendaView({ entries, onSelectEntry }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      if (!e.scheduled_at) continue;
      const d = new Date(e.scheduled_at);
      const key = d.toDateString();
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [entries]);

  if (grouped.length === 0)
    return (
      <p className="rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No posts scheduled in this period.
      </p>
    );

  return (
    <ul className="space-y-3">
      {grouped.map(([day, items]) => (
        <li key={day}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
          <ul className="space-y-2">
            {items.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelectEntry(e)}
                  className="w-full rounded-md border border-border/60 bg-card p-3 text-left hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {e.song?.title ?? 'Untitled'}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {e.scheduled_at &&
                        new Date(e.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {e.platform}
                    </Badge>
                    <Badge className="text-[10px]">{e.status}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

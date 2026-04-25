'use client';

import { cn } from '@/lib/utils';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function MiniCalendar() {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const weekNumber = getISOWeek(today);
  const weekDates = getWeekDates(today);
  const monthRange = formatMonthRange(today);

  return (
    <section className="bg-card border border-border rounded-[14px] p-5">
      <div className="flex justify-between items-center mb-3.5">
        <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">
          Week {weekNumber}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">{monthRange}</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, i) => {
          const isToday = i === dayOfWeek;
          return (
            <div
              key={i}
              className={cn(
                'rounded-lg p-2.5 text-center',
                isToday
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50'
              )}
            >
              <div className={cn(
                'text-[10px] uppercase tracking-[.1em]',
                isToday ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {label}
              </div>
              <div className={cn(
                'font-serif text-xl mt-0.5',
                isToday ? 'text-primary font-medium' : 'text-foreground'
              )}>
                {weekDates[i]}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getWeekDates(date: Date): number[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatMonthRange(date: Date): string {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[monday.getMonth()].toUpperCase()} ${monday.getDate()}–${sunday.getDate()}`;
}

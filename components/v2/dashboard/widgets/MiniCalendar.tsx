'use client';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/**
 * Compact week-view calendar with gold today indicator.
 * Shows the current week with lesson dot indicators.
 */
export function MiniCalendar() {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const weekNumber = getISOWeek(today);

  const weekDates = getWeekDates(today);

  return (
    <section className="bg-card rounded-[10px] p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-foreground font-bold text-sm">Upcoming</h2>
        <span className="text-[10px] text-muted-foreground font-bold">
          WEEK {weekNumber}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-[9px] font-black text-muted-foreground mb-2">
            {label}
          </div>
        ))}
        {weekDates.map((date, idx) => {
          const isToday = idx === dayOfWeek;
          const isPast = idx < dayOfWeek;
          return (
            <div
              key={idx}
              className={`p-1 rounded-lg ${isToday ? 'bg-primary/20 ring-1 ring-primary/40' : ''}`}
            >
              <span
                className={`text-xs ${isToday ? 'font-bold text-primary' : isPast ? 'text-muted-foreground opacity-30' : 'text-foreground'}`}
              >
                {date}
              </span>
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

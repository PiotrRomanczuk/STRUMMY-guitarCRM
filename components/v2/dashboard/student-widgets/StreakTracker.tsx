import { Check } from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface StreakTrackerProps {
  /** Number of consecutive practice days (current streak) */
  streakDays: number;
}

/**
 * Weekly day circles showing practice streak.
 * Gold filled = completed, outlined = today, muted = future.
 */
export function StreakTracker({ streakDays }: StreakTrackerProps) {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0

  return (
    <section className="bg-card rounded-[10px] p-6">
      <h2 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-5">
        Activity Tracker
      </h2>
      <div className="flex justify-between items-center w-full">
        {DAY_LABELS.map((label, idx) => {
          const isCompleted = idx < dayOfWeek && idx >= dayOfWeek - streakDays;
          const isToday = idx === dayOfWeek;

          return (
            <div key={label} className="flex flex-col items-center gap-2">
              {isCompleted ? (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
                </div>
              ) : isToday ? (
                <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary uppercase">
                    {label.slice(0, 3)}
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                </div>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-tighter
                ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {isToday ? 'Today' : label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

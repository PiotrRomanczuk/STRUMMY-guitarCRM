/**
 * Generate recurring lesson dates for a given day of week, time, and number of weeks.
 * Pure function -- no side effects, fully testable.
 */

interface RecurringDateParams {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  time: string; // HH:mm
  weeks: number;
  startDate?: string; // ISO date string; defaults to next occurrence of dayOfWeek
}

/**
 * Returns the next occurrence of a given day of week from a reference date.
 * If the reference date IS the target day, returns 7 days later (next week).
 */
function getNextOccurrence(dayOfWeek: number, from: Date): Date {
  const current = from.getDay();
  let daysUntil = dayOfWeek - current;
  if (daysUntil <= 0) daysUntil += 7;
  const next = new Date(from);
  next.setDate(next.getDate() + daysUntil);
  return next;
}

/**
 * Generate an array of ISO datetime strings for recurring lessons.
 */
export function generateRecurringDates(params: RecurringDateParams): string[] {
  const { dayOfWeek, time, weeks, startDate } = params;
  const [hours, minutes] = time.split(':').map(Number);

  let firstDate: Date;

  if (startDate) {
    firstDate = new Date(startDate);
    firstDate.setHours(hours, minutes, 0, 0);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    firstDate = getNextOccurrence(dayOfWeek, today);
    firstDate.setHours(hours, minutes, 0, 0);
  }

  const dates: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const date = new Date(firstDate);
    date.setDate(date.getDate() + i * 7);
    dates.push(date.toISOString());
  }

  return dates;
}

/**
 * Format an ISO date for display in the preview list.
 */
export function formatPreviewDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

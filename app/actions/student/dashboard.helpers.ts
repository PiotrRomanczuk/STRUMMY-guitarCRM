/**
 * Pure helper functions for student dashboard data derivation.
 * These are unit-testable with no external dependencies.
 */

/** Monday-based week ordering: Mon=0 ... Sun=6 */
export const WEEK_DAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Given a list of ISO date strings (last_practiced_at values),
 * compute consecutive practice streak ending today (or yesterday
 * if today has no practice entry). Returns 0 if no entries.
 */
export function computePracticeStreakDays(practicedDates: string[]): number {
  if (practicedDates.length === 0) return 0;

  // Normalise to unique YYYY-MM-DD strings in local/UTC date
  const uniqueDays = new Set(practicedDates.map((d) => d.slice(0, 10)));

  const today = new Date();
  const todayStr = toDateStr(today);

  // Streak anchor: today if practiced today, else yesterday
  const anchor = uniqueDays.has(todayStr)
    ? today
    : (() => {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        return y;
      })();

  const anchorStr = toDateStr(anchor);
  if (!uniqueDays.has(anchorStr)) return 0;

  let streak = 0;
  const cursor = new Date(anchor);

  while (uniqueDays.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Format a Date as YYYY-MM-DD using local timezone offset arithmetic. */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Return the Monday and Sunday of the week containing `now`.
 * All times are midnight UTC.
 */
export function getMonToSunWeekBounds(now: Date = new Date()): {
  weekStart: Date;
  weekEnd: Date;
} {
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(now.getUTCDate() - daysFromMon);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return { weekStart, weekEnd };
}

/**
 * Build a Mon-Sun chart row array initialised with zeros.
 * `weekStart` must already be Monday midnight UTC.
 */
export function buildEmptyWeekChart(weekStart: Date): { day: string; date: Date }[] {
  return WEEK_DAYS_MON.map((name, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    return { day: name, date: d };
  });
}

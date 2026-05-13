import {
  computePracticeStreakDays,
  getMonToSunWeekBounds,
} from '@/app/actions/student/dashboard.helpers';

// Helper to produce a date string N days ago from a reference date
function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

describe('computePracticeStreakDays', () => {
  it('returns 0 when no practice dates are provided', () => {
    expect(computePracticeStreakDays([])).toBe(0);
  });

  it('returns 0 when the only entry is older than yesterday', () => {
    const old = daysAgo(5);
    expect(computePracticeStreakDays([old])).toBe(0);
  });

  it('returns 1 when practice only happened today', () => {
    const today = new Date().toISOString();
    expect(computePracticeStreakDays([today])).toBe(1);
  });

  it('returns 1 when practice only happened yesterday (none today)', () => {
    const yesterday = daysAgo(1);
    expect(computePracticeStreakDays([yesterday])).toBe(1);
  });

  it('counts a 3-day consecutive streak ending today', () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2)];
    expect(computePracticeStreakDays(dates)).toBe(3);
  });

  it('counts a 3-day consecutive streak ending yesterday', () => {
    const dates = [daysAgo(1), daysAgo(2), daysAgo(3)];
    expect(computePracticeStreakDays(dates)).toBe(3);
  });

  it('stops at a gap — broken streak returns only the recent segment', () => {
    // Practiced today and 2 days ago but NOT yesterday → streak = 1
    const dates = [daysAgo(0), daysAgo(2), daysAgo(3)];
    expect(computePracticeStreakDays(dates)).toBe(1);
  });

  it('deduplicates multiple entries for the same day', () => {
    const today = new Date();
    const dates = [
      today.toISOString(),
      new Date(today.getTime() + 1000 * 3600).toISOString(), // same day, different time
      daysAgo(1),
    ];
    expect(computePracticeStreakDays(dates)).toBe(2);
  });

  it('handles a long unbroken streak of 7 days', () => {
    const dates = Array.from({ length: 7 }, (_, i) => daysAgo(i));
    expect(computePracticeStreakDays(dates)).toBe(7);
  });
});

describe('getMonToSunWeekBounds', () => {
  it('returns a weekStart that is a Monday', () => {
    const { weekStart } = getMonToSunWeekBounds();
    const day = weekStart.getUTCDay();
    expect(day).toBe(1); // Monday
  });

  it('returns weekEnd exactly 7 days after weekStart', () => {
    const { weekStart, weekEnd } = getMonToSunWeekBounds();
    const diff = weekEnd.getTime() - weekStart.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('weekStart midnight UTC is contained in the same calendar week as now', () => {
    const now = new Date();
    const { weekStart, weekEnd } = getMonToSunWeekBounds(now);
    expect(weekStart.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(weekEnd.getTime()).toBeGreaterThan(now.getTime());
  });

  it('for a known Monday, weekStart is that same Monday', () => {
    // 2026-05-11 is a Monday
    const monday = new Date('2026-05-11T10:00:00Z');
    const { weekStart } = getMonToSunWeekBounds(monday);
    expect(dateStr(weekStart)).toBe('2026-05-11');
  });

  it('for a known Sunday, weekStart is the preceding Monday', () => {
    // 2026-05-10 is a Sunday
    const sunday = new Date('2026-05-10T10:00:00Z');
    const { weekStart } = getMonToSunWeekBounds(sunday);
    expect(dateStr(weekStart)).toBe('2026-05-04');
  });
});

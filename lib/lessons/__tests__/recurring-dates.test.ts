import { generateRecurringDates, formatPreviewDate } from '../recurring-dates';

describe('generateRecurringDates', () => {
  it('generates the correct number of dates', () => {
    const dates = generateRecurringDates({
      dayOfWeek: 2, // Tuesday
      time: '15:00',
      weeks: 4,
    });

    expect(dates).toHaveLength(4);
  });

  it('generates dates 7 days apart', () => {
    const dates = generateRecurringDates({
      dayOfWeek: 1, // Monday
      time: '10:00',
      weeks: 3,
    });

    const timestamps = dates.map((d) => new Date(d).getTime());

    // Allow for DST transitions (±1 hour from exact 7 days)
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const tolerance = 60 * 60 * 1000; // 1 hour

    expect(Math.abs(timestamps[1] - timestamps[0] - oneWeekMs)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(timestamps[2] - timestamps[1] - oneWeekMs)).toBeLessThanOrEqual(tolerance);
  });

  it('uses the correct time for all dates', () => {
    const dates = generateRecurringDates({
      dayOfWeek: 3, // Wednesday
      time: '14:30',
      weeks: 4,
    });

    for (const iso of dates) {
      const d = new Date(iso);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    }
  });

  it('respects a custom startDate', () => {
    const startDate = '2026-04-06'; // A Monday
    const dates = generateRecurringDates({
      dayOfWeek: 1,
      time: '09:00',
      weeks: 2,
      startDate,
    });

    expect(dates).toHaveLength(2);
    const first = new Date(dates[0]);
    expect(first.getFullYear()).toBe(2026);
    expect(first.getMonth()).toBe(3); // April = 3
    expect(first.getDate()).toBe(6);
    expect(first.getHours()).toBe(9);

    const second = new Date(dates[1]);
    expect(second.getDate()).toBe(13);
  });

  it('all generated dates land on the correct day of week', () => {
    const dates = generateRecurringDates({
      dayOfWeek: 5, // Friday
      time: '16:00',
      weeks: 6,
    });

    for (const iso of dates) {
      const d = new Date(iso);
      expect(d.getDay()).toBe(5);
    }
  });

  it('handles single week', () => {
    const dates = generateRecurringDates({
      dayOfWeek: 0, // Sunday
      time: '11:00',
      weeks: 1,
    });

    expect(dates).toHaveLength(1);
    expect(new Date(dates[0]).getDay()).toBe(0);
  });
});

describe('formatPreviewDate', () => {
  it('returns a human-readable date string', () => {
    const iso = '2026-04-07T15:00:00.000Z';
    const formatted = formatPreviewDate(iso);

    // Should include day, month, and time parts
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(5);
  });
});

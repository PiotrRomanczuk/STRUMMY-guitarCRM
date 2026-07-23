import {
  bucketPracticeByDay,
  computeHealth,
  latestPracticedAt,
  weekMinutes,
  type PracticeDay,
} from '../student-health.helpers';

const NOW = new Date('2026-07-23T12:00:00.000Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('computeHealth', () => {
  it('is on_track when practiced within the last week', () => {
    expect(computeHealth(daysAgo(2), NOW)).toMatchObject({
      status: 'on_track',
      daysSincePractice: 2,
    });
  });

  it('is watch at 7–13 days since practice', () => {
    expect(computeHealth(daysAgo(7), NOW).status).toBe('watch');
    expect(computeHealth(daysAgo(13), NOW).status).toBe('watch');
  });

  it('is at_risk at 14+ days since practice', () => {
    expect(computeHealth(daysAgo(14), NOW).status).toBe('at_risk');
    expect(computeHealth(daysAgo(40), NOW).status).toBe('at_risk');
  });

  it('treats never-practiced as at_risk with null days', () => {
    expect(computeHealth(null, NOW)).toEqual({
      status: 'at_risk',
      daysSincePractice: null,
      lastPracticedAt: null,
    });
  });

  it('never reports negative days for a future timestamp', () => {
    expect(computeHealth(daysAgo(-1), NOW).daysSincePractice).toBe(0);
  });
});

describe('latestPracticedAt', () => {
  it('returns the most recent timestamp', () => {
    const rows = [
      { lastPracticedAt: daysAgo(10) },
      { lastPracticedAt: daysAgo(3) },
      { lastPracticedAt: null },
    ];
    expect(latestPracticedAt(rows)).toBe(daysAgo(3));
  });

  it('returns null when nothing has been practiced', () => {
    expect(latestPracticedAt([{ lastPracticedAt: null }])).toBeNull();
    expect(latestPracticedAt([])).toBeNull();
  });
});

describe('bucketPracticeByDay', () => {
  it('produces exactly `days` zero-filled, chronologically ordered buckets', () => {
    const result = bucketPracticeByDay([], 14, NOW);
    expect(result).toHaveLength(14);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
    expect(result[0].date < result[13].date).toBe(true);
    expect(result[13].date).toBe('2026-07-23');
  });

  it('sums multiple sessions on the same day', () => {
    const sessions = [
      { createdAt: daysAgo(1), durationMinutes: 20 },
      { createdAt: daysAgo(1), durationMinutes: 15 },
      { createdAt: daysAgo(5), durationMinutes: 30 },
    ];
    const result = bucketPracticeByDay(sessions, 14, NOW);
    const byDate = Object.fromEntries(result.map((d) => [d.date, d.minutes]));
    expect(byDate['2026-07-22']).toBe(35);
    expect(byDate['2026-07-18']).toBe(30);
  });

  it('ignores sessions outside the window', () => {
    const sessions = [{ createdAt: daysAgo(30), durationMinutes: 99 }];
    const result = bucketPracticeByDay(sessions, 14, NOW);
    expect(result.reduce((s, d) => s + d.minutes, 0)).toBe(0);
  });
});

describe('weekMinutes', () => {
  it('sums the trailing 7 buckets only', () => {
    const days: PracticeDay[] = Array.from({ length: 14 }, (_, i) => ({
      date: `d${i}`,
      minutes: 10,
    }));
    expect(weekMinutes(days)).toBe(70);
  });
});

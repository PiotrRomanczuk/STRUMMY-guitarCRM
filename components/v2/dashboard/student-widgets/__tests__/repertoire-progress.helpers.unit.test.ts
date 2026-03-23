import {
  formatPracticeTime,
  formatRelativeDate,
  getPriorityIndicator,
  STATUS_CONFIG,
} from '../repertoire-progress.helpers';

describe('formatPracticeTime', () => {
  it('returns "0m" for zero minutes', () => {
    expect(formatPracticeTime(0)).toBe('0m');
  });

  it('returns minutes only when under an hour', () => {
    expect(formatPracticeTime(30)).toBe('30m');
    expect(formatPracticeTime(1)).toBe('1m');
  });

  it('returns hours only when exact hours', () => {
    expect(formatPracticeTime(60)).toBe('1h');
    expect(formatPracticeTime(120)).toBe('2h');
  });

  it('returns combined hours and minutes', () => {
    expect(formatPracticeTime(90)).toBe('1h 30m');
    expect(formatPracticeTime(150)).toBe('2h 30m');
  });
});

describe('formatRelativeDate', () => {
  it('returns "Never" for null', () => {
    expect(formatRelativeDate(null)).toBe('Never');
  });

  it('returns "Today" for current date', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('Today');
  });

  it('returns "1d ago" for yesterday', () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('1d ago');
  });

  it('returns days for less than a week', () => {
    const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('3d ago');
  });

  it('returns weeks for 7+ days', () => {
    const twoWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2w ago');
  });

  it('returns months for 30+ days', () => {
    const twoMonthsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString();
    expect(formatRelativeDate(twoMonthsAgo)).toBe('2mo ago');
  });
});

describe('getPriorityIndicator', () => {
  it('returns visible for high priority', () => {
    const result = getPriorityIndicator('high');
    expect(result.isVisible).toBe(true);
    expect(result.className).toContain('orange');
    expect(result.label).toBe('High priority');
  });

  it('returns not visible for normal priority', () => {
    expect(getPriorityIndicator('normal').isVisible).toBe(false);
  });

  it('returns not visible for low priority', () => {
    expect(getPriorityIndicator('low').isVisible).toBe(false);
  });

  it('returns not visible for archived priority', () => {
    expect(getPriorityIndicator('archived').isVisible).toBe(false);
  });
});

describe('STATUS_CONFIG', () => {
  it('has all five statuses defined', () => {
    expect(STATUS_CONFIG).toHaveProperty('to_learn');
    expect(STATUS_CONFIG).toHaveProperty('started');
    expect(STATUS_CONFIG).toHaveProperty('remembered');
    expect(STATUS_CONFIG).toHaveProperty('with_author');
    expect(STATUS_CONFIG).toHaveProperty('mastered');
  });

  it('each status has a label and className', () => {
    for (const key of Object.keys(STATUS_CONFIG)) {
      const config = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
      expect(config.label).toBeTruthy();
      expect(config.className).toBeTruthy();
    }
  });
});

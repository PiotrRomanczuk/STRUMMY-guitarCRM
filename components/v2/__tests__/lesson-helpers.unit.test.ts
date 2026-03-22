import {
  getLessonStatusStyle,
  getLessonStatusLabel,
  formatLessonDate,
  formatLessonTime,
} from '@/components/v2/lessons/lesson.helpers';

// ──────────────────────────────────────────────────────────────────────────────
// getLessonStatusStyle
// ──────────────────────────────────────────────────────────────────────────────
describe('getLessonStatusStyle', () => {
  it('returns emerald classes for COMPLETED status', () => {
    const result = getLessonStatusStyle('COMPLETED');
    expect(result).toContain('bg-emerald-500/10');
    expect(result).toContain('text-emerald-400');
    expect(result).toContain('border-transparent');
  });

  it('returns destructive classes for CANCELLED status', () => {
    const result = getLessonStatusStyle('CANCELLED');
    expect(result).toContain('bg-destructive/10');
    expect(result).toContain('text-red-400');
    expect(result).toContain('border-transparent');
  });

  it('returns primary classes for IN_PROGRESS status', () => {
    const result = getLessonStatusStyle('IN_PROGRESS');
    expect(result).toContain('bg-primary/15');
    expect(result).toContain('text-primary');
    expect(result).toContain('border-transparent');
  });

  it('returns primary classes for SCHEDULED status', () => {
    const result = getLessonStatusStyle('SCHEDULED');
    expect(result).toContain('bg-primary/15');
    expect(result).toContain('text-primary');
    expect(result).toContain('border-transparent');
  });

  it('returns muted fallback classes for null status', () => {
    const result = getLessonStatusStyle(null);
    expect(result).toContain('bg-muted');
    expect(result).toContain('text-muted-foreground');
    expect(result).toContain('border-transparent');
  });

  it('returns muted fallback classes for undefined status', () => {
    const result = getLessonStatusStyle(undefined);
    expect(result).toContain('bg-muted');
    expect(result).toContain('text-muted-foreground');
  });

  it('returns muted fallback classes for unknown status string', () => {
    const result = getLessonStatusStyle('UNKNOWN_STATUS');
    expect(result).toContain('bg-muted');
    expect(result).toContain('text-muted-foreground');
  });

  it('returns muted fallback for empty string status', () => {
    const result = getLessonStatusStyle('');
    expect(result).toContain('bg-muted');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getLessonStatusLabel
// ──────────────────────────────────────────────────────────────────────────────
describe('getLessonStatusLabel', () => {
  it('returns "Completed" for COMPLETED', () => {
    expect(getLessonStatusLabel('COMPLETED')).toBe('Completed');
  });

  it('returns "Cancelled" for CANCELLED', () => {
    expect(getLessonStatusLabel('CANCELLED')).toBe('Cancelled');
  });

  it('returns "In Progress" for IN_PROGRESS', () => {
    expect(getLessonStatusLabel('IN_PROGRESS')).toBe('In Progress');
  });

  it('returns "Scheduled" for SCHEDULED', () => {
    expect(getLessonStatusLabel('SCHEDULED')).toBe('Scheduled');
  });

  it('returns "Scheduled" as default for null', () => {
    expect(getLessonStatusLabel(null)).toBe('Scheduled');
  });

  it('returns "Scheduled" as default for undefined', () => {
    expect(getLessonStatusLabel(undefined)).toBe('Scheduled');
  });

  it('returns "Scheduled" as default for unknown status', () => {
    expect(getLessonStatusLabel('FOOBAR')).toBe('Scheduled');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatLessonDate
// ──────────────────────────────────────────────────────────────────────────────
describe('formatLessonDate', () => {
  it('returns "Not scheduled" for null', () => {
    expect(formatLessonDate(null)).toBe('Not scheduled');
  });

  it('returns "Not scheduled" for undefined', () => {
    expect(formatLessonDate(undefined)).toBe('Not scheduled');
  });

  it('returns "Not scheduled" for empty string', () => {
    expect(formatLessonDate('')).toBe('Not scheduled');
  });

  it('returns "Invalid date" for garbage string', () => {
    expect(formatLessonDate('not-a-date')).toBe('Invalid date');
  });

  it('formats a valid ISO date string', () => {
    const result = formatLessonDate('2026-03-15');
    // Should include day name abbreviation, month, day number
    expect(result).toBeTruthy();
    expect(result).not.toBe('Not scheduled');
    expect(result).not.toBe('Invalid date');
  });

  it('formats a full ISO datetime string', () => {
    const result = formatLessonDate('2026-06-20T14:00:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Not scheduled');
    expect(result).not.toBe('Invalid date');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatLessonTime
// ──────────────────────────────────────────────────────────────────────────────
describe('formatLessonTime', () => {
  it('returns empty string for null', () => {
    expect(formatLessonTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatLessonTime(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatLessonTime('')).toBe('');
  });

  it('formats HH:mm time string to 12-hour format', () => {
    const result = formatLessonTime('14:30');
    // Should contain 2:30 and PM
    expect(result).toContain('2:30');
    expect(result.toLowerCase()).toContain('pm');
  });

  it('formats morning time correctly', () => {
    const result = formatLessonTime('09:15');
    expect(result).toContain('9:15');
    expect(result.toLowerCase()).toContain('am');
  });

  it('handles ISO datetime with T separator', () => {
    const result = formatLessonTime('2026-03-15T10:00:00Z');
    // Should return a time string, not the raw input
    expect(result).toBeTruthy();
    expect(result).not.toBe('2026-03-15T10:00:00Z');
  });
});

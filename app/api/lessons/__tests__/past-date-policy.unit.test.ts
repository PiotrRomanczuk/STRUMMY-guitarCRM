/**
 * Unit test: create-lesson:past-date-policy
 *
 * Locks the chosen policy: backfilling is ALLOWED. A lesson whose
 * `scheduled_at` is in the past is accepted (no 400) and flagged via
 * `isBackfilledLesson()` so dashboard widgets can exclude or label it.
 */

import { isBackfilledLesson } from '@/app/api/lessons/utils';

const NOW = new Date('2026-05-10T12:00:00.000Z');

describe('isBackfilledLesson', () => {
  it('returns true for a lesson scheduled before `now`', () => {
    expect(isBackfilledLesson({ scheduled_at: '2026-05-09T10:00:00.000Z' }, NOW)).toBe(true);
  });

  it('returns false for a lesson scheduled after `now`', () => {
    expect(isBackfilledLesson({ scheduled_at: '2026-05-11T10:00:00.000Z' }, NOW)).toBe(false);
  });

  it('returns false when scheduled_at exactly equals `now` (boundary not backfilled)', () => {
    expect(isBackfilledLesson({ scheduled_at: NOW.toISOString() }, NOW)).toBe(false);
  });

  it('returns false for missing or null scheduled_at', () => {
    expect(isBackfilledLesson({}, NOW)).toBe(false);
    expect(isBackfilledLesson({ scheduled_at: null }, NOW)).toBe(false);
    expect(isBackfilledLesson(null, NOW)).toBe(false);
    expect(isBackfilledLesson(undefined, NOW)).toBe(false);
  });

  it('returns false for an unparseable scheduled_at string', () => {
    expect(isBackfilledLesson({ scheduled_at: 'not-a-date' }, NOW)).toBe(false);
  });

  it('respects the injected `now` argument (deterministic)', () => {
    const lesson = { scheduled_at: '2026-05-09T10:00:00.000Z' };
    expect(isBackfilledLesson(lesson, new Date('2026-05-08T00:00:00.000Z'))).toBe(false);
    expect(isBackfilledLesson(lesson, new Date('2026-05-10T00:00:00.000Z'))).toBe(true);
  });
});

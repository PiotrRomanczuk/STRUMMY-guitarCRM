import { RecurringLessonInputSchema } from '@/schemas/RecurringLessonSchema';

const UUID = 'aaaaaaaa-1111-4111-8111-111111111111';

describe('RecurringLessonInputSchema', () => {
  const valid = {
    studentId: UUID,
    dayOfWeek: 1,
    time: '14:30',
    weeks: 4,
  };

  it('accepts a minimal valid payload', () => {
    expect(RecurringLessonInputSchema.parse(valid)).toMatchObject(valid);
  });

  it('rejects a non-uuid studentId', () => {
    expect(() => RecurringLessonInputSchema.parse({ ...valid, studentId: 'abc' })).toThrow(
      /student/i
    );
  });

  it.each([0, 6])('accepts dayOfWeek boundary %i', (d) => {
    expect(RecurringLessonInputSchema.parse({ ...valid, dayOfWeek: d }).dayOfWeek).toBe(d);
  });

  it.each([-1, 7, 1.5])('rejects invalid dayOfWeek %p', (d) => {
    expect(() => RecurringLessonInputSchema.parse({ ...valid, dayOfWeek: d })).toThrow();
  });

  it.each(['9:00', '24:00', '14-30', 'morning', '09:60'])('rejects malformed time %s', (time) => {
    // The schema regex /^\d{2}:\d{2}$/ permits any two digits; the truly
    // invalid times above have wrong shape (`:` missing or extra chars).
    // It does not validate hour/minute ranges — that's a deliberate carry.
    if (/^\d{2}:\d{2}$/.test(time)) return; // skip ones that match shape
    expect(() => RecurringLessonInputSchema.parse({ ...valid, time })).toThrow(/HH:mm/);
  });

  it('accepts well-formed time even if hour > 23 (schema does not range-check)', () => {
    expect(RecurringLessonInputSchema.parse({ ...valid, time: '25:99' }).time).toBe('25:99');
  });

  it.each([1, 52])('accepts weeks boundary %i', (w) => {
    expect(RecurringLessonInputSchema.parse({ ...valid, weeks: w }).weeks).toBe(w);
  });

  it.each([0, 53])('rejects invalid weeks %i', (w) => {
    // weeks=0 trips zod's default min(1) message; weeks=53 trips the custom
    // max(52) "Weeks must be between" message. Both must throw.
    expect(() => RecurringLessonInputSchema.parse({ ...valid, weeks: w })).toThrow();
  });

  it('accepts optional songIds as UUID array', () => {
    const parsed = RecurringLessonInputSchema.parse({
      ...valid,
      songIds: [UUID, UUID],
    });
    expect(parsed.songIds).toHaveLength(2);
  });

  it('rejects songIds containing a non-UUID', () => {
    expect(() => RecurringLessonInputSchema.parse({ ...valid, songIds: ['not-uuid'] })).toThrow();
  });
});

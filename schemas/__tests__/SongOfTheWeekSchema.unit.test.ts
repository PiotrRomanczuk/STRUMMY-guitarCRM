import { SetSongOfTheWeekSchema } from '@/schemas/SongOfTheWeekSchema';

const UUID = 'aaaaaaaa-2222-4222-8222-222222222222';

describe('SetSongOfTheWeekSchema', () => {
  it('accepts the minimal payload (just song_id)', () => {
    const parsed = SetSongOfTheWeekSchema.parse({ song_id: UUID });
    expect(parsed.song_id).toBe(UUID);
    expect(parsed.teacher_message).toBeUndefined();
    expect(parsed.active_until).toBeUndefined();
  });

  it('rejects a malformed song_id', () => {
    expect(() => SetSongOfTheWeekSchema.parse({ song_id: 'oops' })).toThrow();
  });

  describe('teacher_message', () => {
    it('caps at 500 characters', () => {
      expect(() =>
        SetSongOfTheWeekSchema.parse({
          song_id: UUID,
          teacher_message: 'm'.repeat(501),
        })
      ).toThrow(/500 characters or less/);
    });

    it('transforms empty string to undefined', () => {
      const parsed = SetSongOfTheWeekSchema.parse({
        song_id: UUID,
        teacher_message: '',
      });
      expect(parsed.teacher_message).toBeUndefined();
    });

    it('preserves non-empty messages', () => {
      const parsed = SetSongOfTheWeekSchema.parse({
        song_id: UUID,
        teacher_message: 'Practice the bridge',
      });
      expect(parsed.teacher_message).toBe('Practice the bridge');
    });
  });

  describe('active_until', () => {
    it('accepts YYYY-MM-DD', () => {
      const parsed = SetSongOfTheWeekSchema.parse({
        song_id: UUID,
        active_until: '2026-12-31',
      });
      expect(parsed.active_until).toBe('2026-12-31');
    });

    it('rejects other date formats', () => {
      expect(() =>
        SetSongOfTheWeekSchema.parse({
          song_id: UUID,
          active_until: '31/12/2026',
        })
      ).toThrow(/valid date/);
    });

    it('rejects empty string (the .transform → undefined branch is dead behind .regex)', () => {
      // The schema chains .regex() then .optional() then .transform() — the
      // regex fires before the transform, so '' fails validation outright.
      // Callers must pass undefined when clearing the field, not ''.
      expect(() =>
        SetSongOfTheWeekSchema.parse({
          song_id: UUID,
          active_until: '',
        })
      ).toThrow(/valid date/);
    });
  });
});

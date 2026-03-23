import { PracticeSessionInputSchema } from '../PracticeSessionSchema';

describe('PracticeSessionInputSchema', () => {
  it('should accept valid input with all fields', () => {
    const input = {
      song_id: '550e8400-e29b-41d4-a716-446655440000',
      duration_minutes: 30,
      notes: 'Practiced chord transitions',
    };
    const result = PracticeSessionInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept minimal input (duration only)', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15,
    });
    expect(result.success).toBe(true);
  });

  it('should reject duration below 1', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject duration above 480', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 481,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer duration', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject notes exceeding 500 characters', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15,
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('should accept notes at exactly 500 characters', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15,
      notes: 'x'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid song_id format', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15,
      song_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept missing song_id (optional)', () => {
    const result = PracticeSessionInputSchema.safeParse({
      duration_minutes: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.song_id).toBeUndefined();
    }
  });

  it('should accept boundary duration values', () => {
    const min = PracticeSessionInputSchema.safeParse({ duration_minutes: 1 });
    const max = PracticeSessionInputSchema.safeParse({ duration_minutes: 480 });
    expect(min.success).toBe(true);
    expect(max.success).toBe(true);
  });
});

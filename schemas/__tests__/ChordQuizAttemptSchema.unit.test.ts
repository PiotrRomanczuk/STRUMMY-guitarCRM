import {
  ChordQuizAttemptInputSchema,
  ChordQuizSessionSchema,
  QUIZ_SESSION_LENGTH,
} from '@/schemas/ChordQuizAttemptSchema';

const validAttempt = {
  chord_id: 'C-major',
  selected_answer: 'C',
  is_correct: true,
  response_time_ms: 1500,
};

describe('ChordQuizAttemptInputSchema', () => {
  it('accepts a valid attempt', () => {
    expect(ChordQuizAttemptInputSchema.parse(validAttempt)).toMatchObject(validAttempt);
  });

  it('response_time_ms is optional', () => {
    const { response_time_ms, ...rest } = validAttempt;
    void response_time_ms;
    expect(ChordQuizAttemptInputSchema.parse(rest).response_time_ms).toBeUndefined();
  });

  it('rejects an empty chord_id', () => {
    expect(() => ChordQuizAttemptInputSchema.parse({ ...validAttempt, chord_id: '' })).toThrow(
      /chord_id is required/
    );
  });

  it('caps chord_id and selected_answer at 64 chars', () => {
    expect(() =>
      ChordQuizAttemptInputSchema.parse({
        ...validAttempt,
        chord_id: 'c'.repeat(65),
      })
    ).toThrow();
    expect(() =>
      ChordQuizAttemptInputSchema.parse({
        ...validAttempt,
        selected_answer: 's'.repeat(65),
      })
    ).toThrow();
  });

  it('rejects negative response_time_ms', () => {
    expect(() =>
      ChordQuizAttemptInputSchema.parse({
        ...validAttempt,
        response_time_ms: -1,
      })
    ).toThrow();
  });

  it('rejects response_time_ms over 10 minutes', () => {
    expect(() =>
      ChordQuizAttemptInputSchema.parse({
        ...validAttempt,
        response_time_ms: 10 * 60 * 1000 + 1,
      })
    ).toThrow(/cannot exceed 10 minutes/);
  });

  it('rejects non-integer response_time_ms', () => {
    expect(() =>
      ChordQuizAttemptInputSchema.parse({
        ...validAttempt,
        response_time_ms: 1.5,
      })
    ).toThrow();
  });
});

describe('ChordQuizSessionSchema', () => {
  it('accepts a single-attempt session', () => {
    expect(ChordQuizSessionSchema.parse([validAttempt])).toHaveLength(1);
  });

  it('accepts up to 50 attempts', () => {
    const session = Array.from({ length: 50 }, () => validAttempt);
    expect(ChordQuizSessionSchema.parse(session)).toHaveLength(50);
  });

  it('rejects an empty array', () => {
    expect(() => ChordQuizSessionSchema.parse([])).toThrow(/at least one attempt/i);
  });

  it('rejects more than 50 attempts', () => {
    const session = Array.from({ length: 51 }, () => validAttempt);
    expect(() => ChordQuizSessionSchema.parse(session)).toThrow(/more than 50/);
  });
});

describe('QUIZ_SESSION_LENGTH', () => {
  it('exposes the canonical session length', () => {
    expect(QUIZ_SESSION_LENGTH).toBe(10);
  });
});

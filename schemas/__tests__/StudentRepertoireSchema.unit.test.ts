import {
  CreateRepertoireInputSchema,
  UpdateRepertoireInputSchema,
  RepertoirePriorityEnum,
} from '@/schemas/StudentRepertoireSchema';

const UUID = 'aaaaaaaa-4444-4444-8444-444444444444';

describe('CreateRepertoireInputSchema', () => {
  const valid = {
    student_id: UUID,
    song_id: UUID,
  };

  it('accepts the minimum required payload', () => {
    expect(CreateRepertoireInputSchema.parse(valid)).toMatchObject(valid);
  });

  it('rejects malformed student_id / song_id', () => {
    expect(() => CreateRepertoireInputSchema.parse({ ...valid, student_id: 'bad' })).toThrow();
    expect(() => CreateRepertoireInputSchema.parse({ ...valid, song_id: 'bad' })).toThrow();
  });

  it.each([0, 20])('accepts capo_fret boundary %i', (capo) => {
    expect(CreateRepertoireInputSchema.parse({ ...valid, capo_fret: capo }).capo_fret).toBe(capo);
  });

  it.each([-1, 21])('rejects capo_fret outside 0..20 (%i)', (capo) => {
    expect(() => CreateRepertoireInputSchema.parse({ ...valid, capo_fret: capo })).toThrow();
  });

  it('caps custom_strumming at 255 chars', () => {
    expect(() =>
      CreateRepertoireInputSchema.parse({
        ...valid,
        custom_strumming: 's'.repeat(256),
      })
    ).toThrow();
  });

  it.each(RepertoirePriorityEnum.options)('accepts priority %s', (p) => {
    expect(CreateRepertoireInputSchema.parse({ ...valid, priority: p }).priority).toBe(p);
  });
});

describe('UpdateRepertoireInputSchema', () => {
  it('accepts an empty update', () => {
    expect(UpdateRepertoireInputSchema.parse({})).toEqual({});
  });

  it.each([1, 5])('accepts difficulty_rating %i', (r) => {
    expect(UpdateRepertoireInputSchema.parse({ difficulty_rating: r }).difficulty_rating).toBe(r);
  });

  it.each([0, 6])('rejects difficulty_rating outside 1..5 (%i)', (r) => {
    expect(() => UpdateRepertoireInputSchema.parse({ difficulty_rating: r })).toThrow();
  });

  it('accepts null custom_strumming and student_notes', () => {
    const parsed = UpdateRepertoireInputSchema.parse({
      custom_strumming: null,
      student_notes: null,
    });
    expect(parsed.custom_strumming).toBeNull();
    expect(parsed.student_notes).toBeNull();
  });
});

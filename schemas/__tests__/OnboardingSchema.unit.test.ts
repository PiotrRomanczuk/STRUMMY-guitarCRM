import { OnboardingSchema } from '@/schemas/OnboardingSchema';

describe('OnboardingSchema', () => {
  const valid = {
    goals: ['learn-rhythm'],
    skillLevel: 'beginner' as const,
  };

  it('accepts the minimal valid payload and applies defaults', () => {
    const parsed = OnboardingSchema.parse(valid);
    expect(parsed).toEqual({
      role: 'student',
      goals: ['learn-rhythm'],
      skillLevel: 'beginner',
      learningStyle: [],
      instrumentPreference: [],
    });
  });

  it.each(['student', 'teacher'])('accepts role %s', (role) => {
    expect(OnboardingSchema.parse({ ...valid, role }).role).toBe(role);
  });

  it('rejects unknown roles', () => {
    expect(() => OnboardingSchema.parse({ ...valid, role: 'admin' })).toThrow();
  });

  it('requires at least one goal', () => {
    expect(() => OnboardingSchema.parse({ ...valid, goals: [] })).toThrow(/at least one goal/);
  });

  it.each(['beginner', 'intermediate', 'advanced'])('accepts skillLevel %s', (skill) => {
    expect(OnboardingSchema.parse({ ...valid, skillLevel: skill }).skillLevel).toBe(skill);
  });

  it('rejects unknown skillLevel', () => {
    expect(() => OnboardingSchema.parse({ ...valid, skillLevel: 'expert' })).toThrow(
      /skill level/i
    );
  });

  it('passes through learningStyle and instrumentPreference arrays', () => {
    const parsed = OnboardingSchema.parse({
      ...valid,
      learningStyle: ['visual', 'kinaesthetic'],
      instrumentPreference: ['acoustic'],
    });
    expect(parsed.learningStyle).toEqual(['visual', 'kinaesthetic']);
    expect(parsed.instrumentPreference).toEqual(['acoustic']);
  });
});

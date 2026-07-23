import {
  StudentIntakeFieldsSchema,
  toProfileColumns,
  type StudentIntakeFields,
} from '../StudentIntakeSchema';

describe('StudentIntakeFieldsSchema', () => {
  it('accepts a fully-populated intake object', () => {
    const parsed = StudentIntakeFieldsSchema.safeParse({
      instrument: 'Guitar',
      skillLevel: 'intermediate',
      startDate: '2026-04-23',
      avatarColor: '#c89523',
      parentName: 'Karen Johnson',
      parentEmail: 'karen@example.com',
      lessonDay: 'Thu',
      lessonTime: '4:00 PM',
      lessonDurationMinutes: 45,
      lessonRate: 65,
      billingCycle: 'monthly',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an out-of-range skill level and a bad billing cycle', () => {
    expect(StudentIntakeFieldsSchema.safeParse({ skillLevel: 'expert' }).success).toBe(false);
    expect(StudentIntakeFieldsSchema.safeParse({ billingCycle: 'annual' }).success).toBe(false);
  });

  it('rejects a malformed start date and avatar colour', () => {
    expect(StudentIntakeFieldsSchema.safeParse({ startDate: '04/23/2026' }).success).toBe(false);
    expect(StudentIntakeFieldsSchema.safeParse({ avatarColor: 'gold' }).success).toBe(false);
  });

  it('rejects a negative rate and an invalid parent email', () => {
    expect(StudentIntakeFieldsSchema.safeParse({ lessonRate: -5 }).success).toBe(false);
    expect(StudentIntakeFieldsSchema.safeParse({ parentEmail: 'not-an-email' }).success).toBe(
      false
    );
  });
});

describe('toProfileColumns', () => {
  it('maps camelCase intake fields to snake_case columns and goals to notes', () => {
    const fields: StudentIntakeFields & { goals?: string } = {
      instrument: 'Bass',
      skillLevel: 'advanced',
      startDate: '2026-01-02',
      avatarColor: '#3a7d3a',
      parentName: 'Karen',
      parentEmail: 'karen@example.com',
      lessonDay: 'Mon',
      lessonTime: '5:00 PM',
      lessonDurationMinutes: 60,
      lessonRate: 90,
      billingCycle: 'weekly',
      goals: 'Play at a wedding',
    };
    expect(toProfileColumns(fields)).toEqual({
      instrument: 'Bass',
      skill_level: 'advanced',
      start_date: '2026-01-02',
      avatar_color: '#3a7d3a',
      parent_name: 'Karen',
      parent_email: 'karen@example.com',
      lesson_day: 'Mon',
      lesson_time: '5:00 PM',
      lesson_duration_minutes: 60,
      lesson_rate: 90,
      billing_cycle: 'weekly',
      notes: 'Play at a wedding',
    });
  });

  it('omits undefined and blank values so partial saves never clobber columns', () => {
    expect(toProfileColumns({ instrument: 'Guitar', parentName: '', goals: '   ' })).toEqual({
      instrument: 'Guitar',
    });
  });
});

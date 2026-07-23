import { z } from 'zod';

/**
 * Student intake fields — backs the full "Add student" editorial form
 * (Identity / Contact / Schedule / Billing). Only `fullName` + `skillLevel`
 * are required; everything else is optional teacher-captured metadata.
 *
 * Canonical option lists live here so the form, the API schema, and the DB
 * CHECK constraints (20260723120200_profiles_student_fields.sql) stay in sync.
 */

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const BILLING_CYCLES = ['per_lesson', 'weekly', 'monthly'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const LESSON_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type LessonDay = (typeof LESSON_DAYS)[number];

export const LESSON_DURATIONS = [30, 45, 60] as const;

export const INSTRUMENTS = ['Guitar', 'Bass', 'Ukulele', 'Piano'] as const;

export const AVATAR_COLORS = [
  '#c89523',
  '#b84a3a',
  '#3a7d3a',
  '#3a5a7d',
  '#6d4fa0',
  '#c17a3a',
] as const;

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  per_lesson: 'Per lesson',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

/** Short suffix for the preview rate line, e.g. "$65/mo". */
export const BILLING_CYCLE_SUFFIX: Record<BillingCycle, string> = {
  per_lesson: '/lesson',
  weekly: '/wk',
  monthly: '/mo',
};

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();

/**
 * The optional student metadata fields, in the camelCase shape the client
 * form submits. Spread into the create/update user schemas at the API boundary.
 */
export const StudentIntakeFieldsSchema = z.object({
  instrument: optionalTrimmed(80),
  skillLevel: z.enum(SKILL_LEVELS).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Avatar color must be a hex value')
    .optional()
    .or(z.literal('')),
  parentName: optionalTrimmed(200),
  parentEmail: z.string().email('Invalid parent email').optional().or(z.literal('')),
  lessonDay: z.enum(LESSON_DAYS).optional(),
  lessonTime: optionalTrimmed(40),
  lessonDurationMinutes: z.number().int().positive().max(600).optional(),
  lessonRate: z.number().nonnegative().max(100000).optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
});

export type StudentIntakeFields = z.infer<typeof StudentIntakeFieldsSchema>;

/**
 * Maps validated camelCase intake fields to the snake_case profiles columns.
 * Only defined, non-empty values are emitted so partial updates never clobber
 * existing data with nulls. The "Goals / notes" textarea maps to `notes`.
 */
export function toProfileColumns(
  fields: StudentIntakeFields & { goals?: string }
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const put = (key: string, value: string | number | undefined) => {
    if (value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    out[key] = value;
  };

  put('instrument', fields.instrument);
  put('skill_level', fields.skillLevel);
  put('start_date', fields.startDate);
  put('avatar_color', fields.avatarColor);
  put('parent_name', fields.parentName);
  put('parent_email', fields.parentEmail);
  put('lesson_day', fields.lessonDay);
  put('lesson_time', fields.lessonTime);
  put('lesson_duration_minutes', fields.lessonDurationMinutes);
  put('lesson_rate', fields.lessonRate);
  put('billing_cycle', fields.billingCycle);
  put('notes', fields.goals);

  return out;
}

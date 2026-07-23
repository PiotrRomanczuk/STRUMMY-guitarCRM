import type { StudentFormValues } from './StudentFields.shared';

export const trimmedOrUndefined = (v: string): string | undefined => {
  const t = v.trim();
  return t === '' ? undefined : t;
};

export const rateOrUndefined = (v: string): number | undefined => {
  const t = v.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** camelCase intake payload the API schemas accept — shared by create + edit. */
export function studentIntakePayload(v: StudentFormValues) {
  return {
    instrument: trimmedOrUndefined(v.instrument),
    skillLevel: v.skillLevel,
    startDate: trimmedOrUndefined(v.startDate),
    avatarColor: trimmedOrUndefined(v.avatarColor),
    parentName: trimmedOrUndefined(v.parentName),
    parentEmail: trimmedOrUndefined(v.parentEmail),
    lessonDay: v.lessonDay,
    lessonTime: trimmedOrUndefined(v.lessonTime),
    lessonDurationMinutes: v.lessonDuration,
    lessonRate: rateOrUndefined(v.lessonRate),
    billingCycle: v.billingCycle,
    goals: trimmedOrUndefined(v.goals),
  };
}

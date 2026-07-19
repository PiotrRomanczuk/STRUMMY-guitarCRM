'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { WEEK_OPTIONS } from '@/schemas/RecurringLessonSchema';

type Props = {
  repeatWeekly: boolean;
  weeks: number;
  disabled: boolean;
  onRepeatWeekly: (v: boolean) => void;
  onWeeks: (v: number) => void;
};

/** LES-3: create-mode-only "repeat weekly for N weeks" option, calling the
 * existing generateRecurringLessons action instead of a single insert. */
export const LessonFormRecurring = ({
  repeatWeekly,
  weeks,
  disabled,
  onRepeatWeekly,
  onWeeks,
}: Props) => (
  <div style={s.field}>
    <label
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      htmlFor="lesson-repeat-weekly"
    >
      <input
        id="lesson-repeat-weekly"
        type="checkbox"
        checked={repeatWeekly}
        disabled={disabled}
        onChange={(e) => onRepeatWeekly(e.target.checked)}
        data-testid="lesson-repeat-weekly-checkbox"
      />
      <span style={{ fontSize: 14 }}>Repeat weekly</span>
    </label>

    {repeatWeekly && (
      <select
        style={{ ...s.input, marginTop: 8, width: 'auto' }}
        value={weeks}
        disabled={disabled}
        onChange={(e) => onWeeks(Number(e.target.value))}
        data-testid="lesson-repeat-weeks-select"
      >
        {WEEK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )}
  </div>
);

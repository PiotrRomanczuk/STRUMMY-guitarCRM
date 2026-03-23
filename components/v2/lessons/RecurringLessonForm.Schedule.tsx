'use client';

import { Repeat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DAY_OF_WEEK_OPTIONS, WEEK_OPTIONS } from '@/schemas/RecurringLessonSchema';

interface RecurringScheduleProps {
  dayOfWeek: number;
  time: string;
  weeks: number;
  titleTemplate: string;
  onDayOfWeekChange: (value: number) => void;
  onTimeChange: (value: string) => void;
  onWeeksChange: (value: number) => void;
  onTitleTemplateChange: (value: string) => void;
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function RecurringSchedule({
  dayOfWeek,
  time,
  weeks,
  titleTemplate,
  onDayOfWeekChange,
  onTimeChange,
  onWeeksChange,
  onTitleTemplateChange,
}: RecurringScheduleProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Schedule</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <select
              id="dayOfWeek"
              value={dayOfWeek}
              onChange={(e) => onDayOfWeekChange(Number(e.target.value))}
              className={selectClassName}
            >
              {DAY_OF_WEEK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weeks">Number of Weeks</Label>
          <select
            id="weeks"
            value={weeks}
            onChange={(e) => onWeeksChange(Number(e.target.value))}
            className={selectClassName}
          >
            {WEEK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titleTemplate">
          Title Template{' '}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="titleTemplate"
          value={titleTemplate}
          onChange={(e) => onTitleTemplateChange(e.target.value)}
          placeholder='e.g., "Guitar Lesson #{n}"'
          className="min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Use {'#{n}'} for auto-incrementing lesson number
        </p>
      </div>
    </>
  );
}

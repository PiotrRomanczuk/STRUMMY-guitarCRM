'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DURATION_PRESETS } from '@/schemas/PracticeSessionSchema';
import { cn } from '@/lib/utils';

interface DurationPickerProps {
  value: number | '';
  onChange: (value: number | '') => void;
}

/**
 * Duration input with quick-pick preset buttons.
 */
export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val === '' ? '' : parseInt(val, 10));
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="practice-duration">Duration (minutes)</Label>
      <Input
        id="practice-duration"
        type="number"
        min={1}
        max={480}
        placeholder="How long did you practice?"
        value={value}
        onChange={handleInputChange}
      />
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={value === preset ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-[48px] text-xs',
              value === preset && 'ring-2 ring-primary/30'
            )}
            onClick={() => onChange(preset)}
          >
            {preset}m
          </Button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Calendar } from 'lucide-react';
import { formatPreviewDate } from '@/lib/lessons/recurring-dates';

interface RecurringPreviewProps {
  dates: string[];
}

export function RecurringPreview({ dates }: RecurringPreviewProps) {
  if (dates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">
          Preview ({dates.length} lessons)
        </h3>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {dates.map((date, i) => (
          <div
            key={date}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground tabular-nums w-6 text-right">
              {i + 1}.
            </span>
            <span>{formatPreviewDate(date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

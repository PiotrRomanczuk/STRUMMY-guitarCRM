'use client';

import { GripVertical } from 'lucide-react';

interface PreviewDateListProps {
  dates: string[];
}

export function PreviewDateList({ dates }: PreviewDateListProps) {
  return (
    <ul className="mt-2 space-y-1.5">
      {dates.map((iso: string, i: number) => {
        const date = new Date(iso);
        const dayStr = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        return (
          <li
            key={iso}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50"
          >
            <span className="shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {dayStr}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{timeStr}</p>
            </div>
            <GripVertical className="h-4 w-4 text-stone-300 dark:text-stone-600 shrink-0" />
          </li>
        );
      })}
    </ul>
  );
}

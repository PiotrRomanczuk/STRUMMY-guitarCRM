'use client';

import { useState } from 'react';
import { LessonFormStitch } from './LessonFormStitch';
import { RecurringLessonFormStitch } from './RecurringLessonFormStitch';
import { cn } from '@/lib/utils';

type TabValue = 'single' | 'recurring';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'single', label: 'Single Lesson' },
  { value: 'recurring', label: 'Recurring Series' },
];

interface NewLessonTabsStitchProps {
  initialData?: { student_id?: string; song_ids?: string[] };
}

export function NewLessonTabsStitch({ initialData }: NewLessonTabsStitchProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('single');

  return (
    <div>
      <div className="sticky top-0 z-20 bg-stone-50 dark:bg-stone-950 px-4 pt-2 pb-1">
        <div className="flex rounded-lg bg-stone-200 dark:bg-stone-800 p-1 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
                activeTab === tab.value
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'single' ? (
        <LessonFormStitch
          initialData={initialData && Object.keys(initialData).length > 0 ? initialData : undefined}
        />
      ) : (
        <RecurringLessonFormStitch
          initialData={initialData && Object.keys(initialData).length > 0 ? initialData : undefined}
        />
      )}
    </div>
  );
}

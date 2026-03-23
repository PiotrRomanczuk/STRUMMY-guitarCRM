'use client';

import { useState } from 'react';
import { LessonFormV2 } from './LessonForm';
import { RecurringLessonForm } from './RecurringLessonForm';
import { cn } from '@/lib/utils';

type TabValue = 'single' | 'recurring';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'single', label: 'Single Lesson' },
  { value: 'recurring', label: 'Recurring Series' },
];

interface NewLessonTabsProps {
  initialData?: { student_id?: string; song_ids?: string[] };
}

export function NewLessonTabs({ initialData }: NewLessonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('single');

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'single' ? (
        <LessonFormV2
          initialData={
            initialData && Object.keys(initialData).length > 0
              ? initialData
              : undefined
          }
        />
      ) : (
        <RecurringLessonForm
          initialData={
            initialData && Object.keys(initialData).length > 0
              ? initialData
              : undefined
          }
        />
      )}
    </div>
  );
}

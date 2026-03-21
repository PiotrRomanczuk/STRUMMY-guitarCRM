'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, BookOpen, RefreshCw, CalendarSync } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fastStaggerContainer, listItem } from '@/lib/animations/variants';

import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import { LessonCard } from './LessonList.Card';
import { LESSON_STATUS_OPTIONS } from './lesson.types';
import type { LessonListV2Props } from './lesson.types';

export function LessonListMobile({
  initialLessons,
  role,
  currentYear,
  onRefresh,
  isRefreshing,
  onSyncCalendar,
  isSyncing,
  onYearChange,
}: LessonListV2Props) {
  const router = useRouter();
  const thisYear = new Date().getFullYear();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredLessons = statusFilter
    ? initialLessons.filter((l) => l.status === statusFilter)
    : initialLessons;

  const canCreate = role === 'admin' || role === 'teacher';

  const handleNavigate = useCallback(
    (id: string) => router.push(`/dashboard/lessons/${id}`),
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => router.push(`/dashboard/lessons/${id}/edit`),
    [router]
  );

  return (
    <MobilePageShell
      title="Lessons"
      subtitle={
        <span className="flex items-center gap-2">
          {filteredLessons.length} lesson
          {filteredLessons.length !== 1 ? 's' : ''}
          {onYearChange && (
            <span className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onYearChange(currentYear - 1)}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                aria-label="Previous year"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="tabular-nums font-medium">{currentYear}</span>
              <button
                type="button"
                onClick={() => onYearChange(currentYear + 1)}
                disabled={currentYear >= thisYear}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Next year"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </span>
      }
      showBack={false}
      headerActions={
        <div className="flex items-center gap-1">
          {onSyncCalendar && (
            <button
              type="button"
              onClick={onSyncCalendar}
              disabled={isSyncing}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Sync from Google Calendar"
            >
              <CalendarSync
                className={cn('h-5 w-5', isSyncing && 'animate-spin')}
              />
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Refresh lessons"
            >
              <RefreshCw
                className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
              />
            </button>
          )}
        </div>
      }
      fab={
        canCreate ? (
          <FloatingActionButton
            onClick={() => router.push('/dashboard/lessons/new')}
            icon={<Plus className="h-6 w-6" />}
            label="Create new lesson"
          />
        ) : undefined
      }
    >
      <CollapsibleFilterBar
        filters={LESSON_STATUS_OPTIONS.map((s) => ({
          label: s.label,
          value: s.value,
        }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {filteredLessons.length === 0 ? (
        <LessonListEmpty canCreate={canCreate} router={router} />
      ) : (
        <motion.div
          variants={filteredLessons.length > 30 ? undefined : fastStaggerContainer}
          initial={filteredLessons.length > 30 ? false : 'hidden'}
          animate="visible"
          className="space-y-2"
        >
          {filteredLessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              variants={filteredLessons.length > 30 ? undefined : listItem}
            >
              <SwipeableListItem
                onEdit={canCreate ? () => handleEdit(lesson.id!) : undefined}
              >
                <LessonCard
                  lesson={lesson}
                  role={role}
                  onTap={() => handleNavigate(lesson.id!)}
                />
              </SwipeableListItem>
            </motion.div>
          ))}
        </motion.div>
      )}
    </MobilePageShell>
  );
}

function LessonListEmpty({ canCreate, router }: { canCreate: boolean; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No lessons found</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {canCreate ? 'Schedule your first lesson to get started.' : 'No upcoming lessons scheduled yet.'}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={() => router.push('/dashboard/lessons/new')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground text-sm font-medium min-h-[44px]'
          )}
        >
          <Plus className="h-4 w-4" />
          New Lesson
        </button>
      )}
    </div>
  );
}

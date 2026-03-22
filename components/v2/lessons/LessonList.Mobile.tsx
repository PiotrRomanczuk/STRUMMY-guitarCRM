'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, BookOpen, RefreshCw } from 'lucide-react';
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
  onRefresh,
  isRefreshing,
}: LessonListV2Props) {
  const router = useRouter();
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
      subtitle={`${filteredLessons.length} lesson${filteredLessons.length !== 1 ? 's' : ''}`}
      showBack={false}
      headerActions={
        onRefresh ? (
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
        ) : undefined
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
      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">No lessons found</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-[280px] leading-relaxed">
        {canCreate ? 'Schedule your first lesson to get started.' : 'No upcoming lessons scheduled yet.'}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={() => router.push('/dashboard/lessons/new')}
          className={cn(
            'inline-flex items-center gap-2 h-11 px-10 rounded-[10px]',
            'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
            'text-sm font-bold shadow-lg shadow-primary/10',
            'active:scale-95 transition-transform'
          )}
        >
          <Plus className="h-4 w-4" />
          New Lesson
        </button>
      )}
    </div>
  );
}

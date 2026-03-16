'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, User, Plus, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fastStaggerContainer, listItem } from '@/lib/animations/variants';

import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import {
  formatLessonDate,
  formatLessonTime,
  getLessonStatusStyle,
  getLessonStatusLabel,
} from './lesson.helpers';
import { LESSON_STATUS_OPTIONS } from './lesson.types';
import type { LessonListV2Props } from './lesson.types';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

export function LessonListMobile({
  initialLessons,
  role,
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

function LessonCard({
  lesson,
  role,
  onTap,
}: {
  lesson: LessonWithProfiles;
  role: string;
  onTap: () => void;
}) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'w-full text-left bg-card rounded-xl border border-border p-4 space-y-2',
        'active:bg-muted/50 transition-colors'
      )}
    >
      {/* Row 1: Title + Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate text-foreground">
          {lesson.title || 'Untitled Lesson'}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5',
            'text-[11px] sm:text-xs font-medium border shrink-0',
            getLessonStatusStyle(lesson.status)
          )}
        >
          {getLessonStatusLabel(lesson.status)}
        </span>
      </div>

      {/* Row 2: Date + Time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>{formatLessonDate(displayDate)}</span>
        {displayTime && (
          <>
            <span aria-hidden>·</span>
            <span>{formatLessonTime(displayTime)}</span>
          </>
        )}
      </div>

      {/* Row 3: Student (or Teacher for student view) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {role === 'student'
            ? lesson.teacher_profile?.full_name ||
              lesson.teacher_profile?.email ||
              'Teacher'
            : lesson.profile?.full_name ||
              lesson.profile?.email ||
              'Student'}
        </span>
      </div>
    </button>
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

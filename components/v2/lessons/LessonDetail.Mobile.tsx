'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, MoreHorizontal, Play, Music, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance, staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { BottomActionSheet } from '@/components/v2/primitives/BottomActionSheet';
import { DateBlock } from '@/components/v2/primitives/DateBlock';
import { LessonStatusPill } from '@/components/v2/primitives/LessonStatusPill';
import { StageStepper } from '@/components/v2/primitives/StageStepper';
import { Button } from '@/components/ui/button';
import { formatLessonTime } from './lesson.helpers';
import type { LessonDetailV2Props } from './LessonDetail';

export function LessonDetailMobile({ lesson, canEdit, canDelete, onDelete }: LessonDetailV2Props) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const isCancelled = lesson.status === 'CANCELLED';
  const isCompleted = lesson.status === 'COMPLETED';
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;
  const studentName = lesson.profile?.full_name || lesson.profile?.email || 'Student';
  const studentInitials = studentName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLiveMode = useCallback(
    () => router.push(`/dashboard/lessons/${lesson.id}/live`),
    [router, lesson.id]
  );

  return (
    <MobilePageShell
      title={`Lesson #${lesson.lesson_teacher_number ?? lesson.lesson_number ?? ''}`}
      headerActions={
        canEdit ? (
          <Button variant="ghost" size="icon" onClick={() => setActionsOpen(true)} className="min-h-[44px] min-w-[44px]">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        ) : undefined
      }
    >
      {/* Hero */}
      <motion.div variants={cardEntrance} initial="hidden" animate="visible" className="flex gap-3 items-start">
        <DateBlock date={displayDate} size="md" />
        <div className="flex-1 min-w-0">
          <LessonStatusPill status={lesson.status} compact />
          <h1 className={cn(
            'mt-1.5 font-serif font-normal text-[22px] tracking-[-0.02em] leading-tight',
            lesson.title ? 'text-foreground' : 'text-muted-foreground italic'
          )}>
            {lesson.title || 'Untitled lesson'}
          </h1>
          <div className="font-mono text-[11px] text-muted-foreground mt-1">
            {formatLessonTime(displayTime)}
          </div>
        </div>
      </motion.div>

      {/* Student card */}
      <div className="bg-card border border-border rounded-[10px] px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {studentInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{studentName}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {lesson.teacher_profile?.full_name || 'Teacher'}
          </div>
        </div>
      </div>

      {/* Start live lesson CTA */}
      {canEdit && !isCancelled && (
        <button
          type="button"
          onClick={handleLiveMode}
          className="w-full py-3.5 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
        >
          <Play className="h-3.5 w-3.5" />
          {isCompleted ? 'Review lesson' : 'Start live lesson'}
        </button>
      )}

      {/* Songs */}
      {lesson.lesson_songs.length > 0 && (
        <MobileSection title="Songs" count={lesson.lesson_songs.length} icon={Music}>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {lesson.lesson_songs.filter((ls) => ls.song).map((ls, i) => (
              <motion.div key={ls.id} variants={listItem}
                className={cn('py-3', i > 0 && 'border-t border-border')}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center font-serif text-xs font-medium text-primary-foreground shrink-0">
                    {ls.song!.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[15px] italic font-medium truncate">{ls.song!.title}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{ls.song!.author}</div>
                  </div>
                </div>
                <StageStepper status={ls.status ?? 'to_learn'} readOnly compact />
              </motion.div>
            ))}
          </motion.div>
        </MobileSection>
      )}

      {/* Notes */}
      {lesson.notes && (
        <MobileSection title="Notes" icon={FileText}>
          <div className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {lesson.notes}
          </div>
        </MobileSection>
      )}

      {/* Assignments */}
      {lesson.assignments.length > 0 && (
        <MobileSection title="Assignments" count={lesson.assignments.length}>
          {lesson.assignments.map((a, i) => (
            <div key={a.id} className={cn('flex gap-2.5 py-2.5', i > 0 && 'border-t border-border')}>
              <div className={cn(
                'w-4 h-4 mt-0.5 rounded border-[1.5px] shrink-0 flex items-center justify-center',
                a.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-border bg-card'
              )}>
                {a.status === 'completed' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-[13px] leading-snug', a.status === 'completed' && 'line-through text-muted-foreground')}>
                  {a.title}
                </div>
                {a.due_date && (
                  <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    Due {a.due_date.slice(5).replace('-', '/')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </MobileSection>
      )}

      {/* Actions bottom sheet */}
      {canEdit && (
        <BottomActionSheet
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title="Lesson Actions"
          actions={[
            { icon: <Pencil className="h-5 w-5" />, label: 'Edit Lesson', onClick: () => router.push(`/dashboard/lessons/${lesson.id}/edit`) },
            ...(canDelete ? [{ icon: <Trash2 className="h-5 w-5" />, label: 'Delete Lesson', onClick: onDelete, variant: 'destructive' as const }] : []),
          ]}
        />
      )}
    </MobilePageShell>
  );
}

function MobileSection({ title, count, icon: Icon, children }: {
  title: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-0.5 py-1.5 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em]">{title}</span>
        {count != null && <span className="font-mono text-[10px] text-muted-foreground">· {count}</span>}
      </div>
      <div className="bg-card border border-border rounded-[10px] px-3.5 py-2.5">
        {children}
      </div>
    </div>
  );
}

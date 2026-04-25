'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { ArrowLeft, Play, Mail, Pencil, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DateBlock } from '@/components/v2/primitives/DateBlock';
import { LessonStatusPill } from '@/components/v2/primitives/LessonStatusPill';
import { LessonDetailSongs, DetailCard } from './LessonDetail.Songs';
import { formatLessonTime } from './lesson.helpers';
import type { LessonDetailV2Props } from './LessonDetail';

export default function LessonDetailDesktop({ lesson, canEdit, canDelete, onDelete }: LessonDetailV2Props) {
  const router = useRouter();
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;
  const studentName = lesson.profile?.full_name || lesson.profile?.email || 'Student';
  const teacherName = lesson.teacher_profile?.full_name || lesson.teacher_profile?.email || 'Teacher';
  const isScheduled = lesson.status === 'SCHEDULED';
  const isCompleted = lesson.status === 'COMPLETED';

  const handleLive = useCallback(() => router.push(`/dashboard/lessons/${lesson.id}/live`), [router, lesson.id]);
  const handleEdit = useCallback(() => router.push(`/dashboard/lessons/${lesson.id}/edit`), [router, lesson.id]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Breadcrumb + actions */}
      <div className="px-8 pt-5 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/lessons')}>
          <ArrowLeft className="h-3 w-3" /> Lessons
        </Button>
        <span className="font-mono text-[11px] text-muted-foreground">/</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          #{lesson.lesson_teacher_number ?? lesson.lesson_number ?? '—'} · {studentName}
        </span>
        <div className="flex-1" />
        {canEdit && (isScheduled || isCompleted) && (
          <Button size="sm" onClick={handleLive} className="bg-primary text-primary-foreground gap-1.5">
            <Play className="h-3 w-3" /> {isCompleted ? 'Review' : 'Start live lesson'}
          </Button>
        )}
        {canEdit && (
          <>
            <Button variant="outline" size="sm"><Mail className="h-3 w-3" /> Recap email</Button>
            <Button variant="outline" size="sm" onClick={handleEdit}><Pencil className="h-3 w-3" /> Edit</Button>
            {canDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Hero */}
      <div className="px-8 pt-5 pb-4 flex gap-5 items-start">
        <DateBlock date={displayDate} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <LessonStatusPill status={lesson.status} />
            <span className="font-mono text-[11px] text-muted-foreground px-2 py-0.5 bg-muted rounded">
              Lesson #{lesson.lesson_teacher_number ?? lesson.lesson_number ?? '—'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              with {studentName.split(' ')[0]}
            </span>
          </div>
          <h1 className={cn(
            'font-serif font-normal text-[34px] tracking-[-0.02em] leading-[1.08]',
            lesson.title ? 'text-foreground' : 'text-muted-foreground italic'
          )}>
            {lesson.title || 'Untitled lesson'}
          </h1>
          <div className="flex gap-4 mt-2.5 text-xs text-muted-foreground">
            <span>
              <span className="text-muted-foreground/60">Time · </span>
              <span className="font-mono">{formatLessonTime(displayTime)}</span>
            </span>
            <span>
              <span className="text-muted-foreground/60">Student · </span>{studentName}
            </span>
            <span>
              <span className="text-muted-foreground/60">Teacher · </span>{teacherName}
            </span>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="grid grid-cols-[1.5fr_1fr] gap-5">
          {/* LEFT column */}
          <div className="flex flex-col gap-5">
            <LessonDetailSongs lessonId={lesson.id!} songs={lesson.lesson_songs} canEdit={canEdit} />

            {/* Lesson notes */}
            <DetailCard eyebrow="Plan & observations" title="Lesson notes">
              <div className="px-6 pb-5">
                {canEdit ? (
                  <textarea
                    defaultValue={lesson.notes ?? ''}
                    placeholder="Lesson plan, goals, observations..."
                    className="w-full min-h-[96px] p-3 border border-border rounded-lg bg-background text-foreground text-[13px] leading-relaxed resize-y font-sans"
                  />
                ) : (
                  <div className="p-3.5 bg-muted/30 border border-border rounded-lg text-[13px] leading-relaxed text-foreground/80">
                    {lesson.notes || <em className="text-muted-foreground">No notes.</em>}
                  </div>
                )}
              </div>
            </DetailCard>
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-5">
            {/* Lesson info */}
            <DetailCard eyebrow="Details" title="Lesson info">
              <div className="px-6 pb-5 flex flex-col gap-3">
                <InfoRow label="Scheduled">
                  <span className="font-mono text-[13px]">{displayDate ? new Date(displayDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                  <span className="font-mono text-[13px] text-muted-foreground ml-2">· {formatLessonTime(displayTime)}</span>
                </InfoRow>
                <InfoRow label="Student">
                  <div className="flex items-center gap-2">
                    <div className="w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold shrink-0">
                      {studentName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium">{studentName}</span>
                  </div>
                </InfoRow>
                <InfoRow label="Teacher">
                  <span className="text-[13px]">{teacherName}</span>
                </InfoRow>
                {(lesson.lesson_teacher_number || lesson.lesson_number) && (
                  <InfoRow label="Sequence">
                    <span className="font-mono text-[13px]">Lesson #{lesson.lesson_teacher_number ?? lesson.lesson_number} with {studentName.split(' ')[0]}</span>
                  </InfoRow>
                )}
              </div>
            </DetailCard>

            {/* Assignments */}
            <DetailCard
              eyebrow="Homework"
              title={<>Assignments <span className="text-muted-foreground text-sm font-normal">· {lesson.assignments.length}</span></>}
              action={canEdit ? <Button variant="outline" size="sm"><Plus className="h-3 w-3" /> Add</Button> : undefined}
            >
              <div className="px-6 pb-5">
                {lesson.assignments.map((a, i) => (
                  <div key={a.id} className={cn('flex items-start gap-2.5 py-2.5', i > 0 && 'border-t border-border')}>
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
                {lesson.assignments.length === 0 && !canEdit && (
                  <div className="py-4 text-muted-foreground text-xs italic font-serif">No homework yet.</div>
                )}
              </div>
            </DetailCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.12em]">{label}</div>
      <div>{children}</div>
    </div>
  );
}

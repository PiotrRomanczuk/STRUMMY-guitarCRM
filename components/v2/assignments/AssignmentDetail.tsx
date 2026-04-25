'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Edit,
  AlertCircle,
  CheckCircle,
  Play,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAssignment } from '@/components/assignments/hooks/useAssignment';
import { useAssignmentMutations } from '@/components/assignments/hooks/useAssignmentMutations';
import { pageTransition } from '@/lib/animations/variants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';

interface AssignmentDetailProps {
  assignmentId: string;
  canEdit?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  not_started: { label: 'Not Started', icon: Clock, className: 'bg-muted text-muted-foreground dark:text-zinc-400' },
  in_progress: { label: 'In Progress', icon: Play, className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

export function AssignmentDetail({ assignmentId, canEdit = false }: AssignmentDetailProps) {
  const router = useRouter();
  const { assignment, isLoading, refresh } = useAssignment(assignmentId);
  const { updateAssignment, isLoading: isMutating } = useAssignmentMutations();

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!assignment || isMutating) return;
      try {
        await updateAssignment(assignment.id, { status: newStatus as Assignment['status'] });
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        refresh();
      } catch {
        toast.error('Failed to update status');
      }
    },
    [assignment, isMutating, updateAssignment, refresh]
  );

  if (isLoading || !assignment) return <DetailSkeleton />;

  const config = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.not_started;
  const StatusIcon = config.icon;

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" className="flex flex-col h-full min-h-0 bg-background">
      {/* Breadcrumb bar */}
      <div className="px-8 pt-5 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/assignments')}>
          <ArrowLeft className="h-3 w-3" /> Assignments
        </Button>
        <span className="font-mono text-[11px] text-muted-foreground">/</span>
        <span className="font-mono text-[11px] text-muted-foreground truncate">
          {assignment.title}
        </span>
        <div className="flex-1" />
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/assignments/${assignment.id}/edit`}><Edit className="h-3 w-3" /> Edit</Link>
          </Button>
        )}
      </div>

      {/* Hero */}
      <div className="px-8 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', config.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        </div>
        <h1 className="font-serif font-normal text-[34px] tracking-[-0.02em] leading-[1.08]">
          {assignment.title}
        </h1>
        {assignment.description && (
          <p className="text-[13px] text-muted-foreground mt-2">{assignment.description}</p>
        )}
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="grid grid-cols-[1.5fr_1fr] gap-5">
          {/* LEFT column - Details */}
          <div className="flex flex-col gap-5">
            <div className="bg-card border border-border rounded-[10px] overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
                  Details
                </div>
                <div className="font-serif text-xl mt-0.5">Assignment info</div>
              </div>
              <div className="px-6 py-5 flex flex-col gap-3">
                <InfoRow label="Student">{assignment.student_profile?.full_name || 'Unknown'}</InfoRow>
                <InfoRow label="Due date">
                  <span className={cn('font-mono text-[13px]', assignment.status === 'overdue' && 'text-destructive')}>
                    {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'}
                  </span>
                </InfoRow>
                <InfoRow label="Status">
                  <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium', config.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </div>
                </InfoRow>
              </div>
            </div>

            {/* Actions card */}
            <div className="bg-card border border-border rounded-[10px] overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
                  Workflow
                </div>
                <div className="font-serif text-xl mt-0.5">Actions</div>
              </div>
              <div className="px-6 py-5 flex flex-wrap gap-2">
                {assignment.status === 'not_started' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('in_progress')} disabled={isMutating}>
                    <Play className="h-3 w-3" /> Start
                  </Button>
                )}
                {(assignment.status === 'in_progress' || assignment.status === 'overdue') && (
                  <Button size="sm" onClick={() => handleStatusChange('completed')} disabled={isMutating}>
                    <CheckCircle className="h-3 w-3" /> Complete
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/assignments/${assignment.id}/edit`}><Edit className="h-3 w-3" /> Edit</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT column - Linked items */}
          <div className="flex flex-col gap-5">
            {assignment.song && (
              <div className="bg-card border border-border rounded-[10px] overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
                    Practice material
                  </div>
                  <div className="font-serif text-xl mt-0.5">Linked Song</div>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Link href={`/dashboard/songs/${assignment.song.id}`} className="text-[13px] font-medium hover:text-primary transition-colors">
                      {assignment.song.title} - {assignment.song.author}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {assignment.lesson && (
              <div className="bg-card border border-border rounded-[10px] overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
                    Context
                  </div>
                  <div className="font-serif text-xl mt-0.5">Linked Lesson</div>
                </div>
                <div className="px-6 py-5">
                  <Link href={`/dashboard/lessons/${assignment.lesson.id}`} className="text-[13px] font-medium hover:text-primary transition-colors">
                    Lesson #{assignment.lesson.lesson_teacher_number} - {format(new Date(assignment.lesson.scheduled_at), 'MMM d, yyyy')}
                  </Link>
                </div>
              </div>
            )}

            {!assignment.song && !assignment.lesson && (
              <div className="bg-card border border-border rounded-[10px] p-8 text-center">
                <p className="font-serif text-base italic text-muted-foreground">No linked items.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-3">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.12em]">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="px-8 pt-5 flex items-center gap-3">
        <div className="h-8 bg-muted rounded w-28 animate-pulse" />
        <div className="h-3 bg-muted rounded w-4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-32 animate-pulse" />
      </div>
      <div className="px-8 pt-5 pb-4 space-y-2">
        <div className="h-6 bg-muted rounded-full w-24 animate-pulse" />
        <div className="h-9 bg-muted rounded w-64 animate-pulse" />
      </div>
      <div className="px-8 pb-10">
        <div className="grid grid-cols-[1.5fr_1fr] gap-5">
          <div className="bg-card border border-border rounded-[10px] p-6 space-y-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-5 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="bg-card border border-border rounded-[10px] p-6 space-y-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-5 bg-muted rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetail;

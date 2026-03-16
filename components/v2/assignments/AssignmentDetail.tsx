'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Edit,
  AlertCircle,
  CheckCircle,
  Play,
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
  not_started: { label: 'Not Started', icon: Clock, className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Play, className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

export function AssignmentDetail({ assignmentId, canEdit = false }: AssignmentDetailProps) {
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
    <motion.div variants={pageTransition} initial="hidden" animate="visible" className="px-4 space-y-4 pb-safe">
      <Link href="/dashboard/assignments" className="inline-flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]">
        <ArrowLeft className="h-4 w-4" />
        Assignments
      </Link>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-bold leading-tight flex-1 mr-2">{assignment.title}</h1>
          <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', config.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        </div>
        {assignment.description && <p className="text-sm text-muted-foreground">{assignment.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon={User} label="Student" value={assignment.student_profile?.full_name || 'Unknown'} />
        <InfoCard icon={Calendar} label="Due Date" value={assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'} highlight={assignment.status === 'overdue'} />
      </div>

      <div className="sticky bottom-0 bg-background py-4 pb-safe space-y-2">
        <h2 className="text-base font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {assignment.status === 'not_started' && (
            <Button variant="outline" className="min-h-[44px]" onClick={() => handleStatusChange('in_progress')} disabled={isMutating}>
              <Play className="h-4 w-4 mr-1" />Start
            </Button>
          )}
          {(assignment.status === 'in_progress' || assignment.status === 'overdue') && (
            <Button variant="default" className="min-h-[44px]" onClick={() => handleStatusChange('completed')} disabled={isMutating}>
              <CheckCircle className="h-4 w-4 mr-1" />Complete
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" className="min-h-[44px]" asChild>
              <Link href={`/dashboard/assignments/${assignment.id}/edit`}><Edit className="h-4 w-4 mr-1" />Edit</Link>
            </Button>
          )}
        </div>
      </div>

      {assignment.lesson && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Linked Lesson</p>
          <Link href={`/dashboard/lessons/${assignment.lesson.id}`} className="text-sm font-medium hover:text-primary transition-colors">
            Lesson #{assignment.lesson.lesson_teacher_number} - {format(new Date(assignment.lesson.scheduled_at), 'MMM d, yyyy')}
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function InfoCard({ icon: Icon, label, value, highlight = false }: { icon: typeof User; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <p className={cn('text-sm font-medium truncate', highlight && 'text-destructive')}>{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-4 space-y-4">
      <div className="h-5 bg-muted rounded w-24 animate-pulse" />
      <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssignmentDetail;

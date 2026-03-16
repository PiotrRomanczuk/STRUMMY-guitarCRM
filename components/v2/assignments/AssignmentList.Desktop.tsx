'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';
import { format } from 'date-fns';

const STATUS_STYLES = {
  not_started: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-primary/10 text-primary dark:text-primary border-primary/20 dark:border-primary/30',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/30',
  overdue: 'bg-destructive/10 text-destructive dark:text-red-400 border-destructive/20 dark:border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-border dark:border-border',
} as const;

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

interface DesktopAssignmentListProps {
  assignments: Assignment[];
  isLoading: boolean;
  canCreate: boolean;
}

export default function DesktopAssignmentList({
  assignments,
  isLoading,
  canCreate,
}: DesktopAssignmentListProps) {
  if (isLoading) {
    return <DesktopSkeleton />;
  }

  return (
    <div className="px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assignments.length} total assignment{assignments.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/assignments/new" className="gap-1">
              <Plus className="h-4 w-4" />
              New Assignment
            </Link>
          </Button>
        )}
      </div>

      {/* Table */}
      {assignments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No assignments found.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {assignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/assignments/${assignment.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {assignment.student_profile?.full_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {assignment.due_date
                      ? format(new Date(assignment.due_date), 'MMM d, yyyy')
                      : 'No due date'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5',
                        'text-xs font-medium border',
                        STATUS_STYLES[assignment.status as keyof typeof STATUS_STYLES] ??
                          STATUS_STYLES.not_started
                      )}
                    >
                      {STATUS_LABELS[assignment.status] ?? assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DesktopSkeleton() {
  return (
    <div className="px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/50 px-6 py-4">
          <div className="flex gap-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded w-20 animate-pulse" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-t border-border">
            <div className="flex gap-12">
              <div className="h-4 bg-muted rounded w-40 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              <div className="h-4 bg-muted rounded-full w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

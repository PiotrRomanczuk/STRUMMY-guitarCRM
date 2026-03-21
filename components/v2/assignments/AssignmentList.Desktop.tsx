'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { StatusBadge } from '@/components/v2/primitives/StatusBadge';
import { ASSIGNMENT_STATUS_STYLES, ASSIGNMENT_STATUS_LABELS } from './assignment.styles';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';
import { format } from 'date-fns';

interface DesktopAssignmentListProps {
  assignments: Assignment[];
  isLoading: boolean;
  canCreate: boolean;
}

export default function DesktopAssignmentList({ assignments, isLoading, canCreate }: DesktopAssignmentListProps) {
  if (isLoading) return <DesktopSkeleton />;

  return (
    <div className="px-8 space-y-6">
      <ListPageHeader
        title="Assignments"
        count={assignments.length}
        countLabel={`total assignment${assignments.length !== 1 ? 's' : ''}`}
        action={canCreate ? { label: 'New Assignment', href: '/dashboard/assignments/new' } : undefined}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found"
          message="Create your first assignment to get started."
          actionLabel={canCreate ? 'New Assignment' : undefined}
          actionHref={canCreate ? '/dashboard/assignments/new' : undefined}
        />
      ) : (
        <div className="rounded-xl overflow-hidden bg-card shadow-2xl shadow-black/20">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-transparent">
                {['Title', 'Student', 'Due Date', 'Status'].map((h) => (
                  <TableHead key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/50 transition-colors border-transparent">
                  <TableCell>
                    <Link href={`/dashboard/assignments/${a.id}`} className="text-sm font-semibold hover:text-primary transition-colors">{a.title}</Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.student_profile?.full_name || 'Unknown'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.due_date ? format(new Date(a.due_date), 'MMM d, yyyy') : 'No due date'}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={a.status}
                      styleMap={ASSIGNMENT_STATUS_STYLES}
                      labelMap={ASSIGNMENT_STATUS_LABELS}
                      className="text-[10px] font-bold uppercase tracking-widest"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <div className="h-8 bg-card rounded w-48 animate-pulse" />
          <div className="h-4 bg-card rounded w-32 animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="bg-card px-6 py-4">
          <div className="flex gap-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded w-20 animate-pulse" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 bg-card">
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

'use client';

import { lazy, Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Plus } from 'lucide-react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useAssignmentList } from '@/components/assignments/hooks/useAssignmentList';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import type { Assignment } from '@/components/assignments/hooks/useAssignment';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { AssignmentListSkeleton } from './AssignmentList.Skeleton';
import { AssignmentCardMobile } from './AssignmentCard.Mobile';

const DesktopView = lazy(() => import('./AssignmentList.Desktop'));

const FILTER_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface AssignmentListProps {
  canCreate?: boolean;
  studentId?: string;
}

export function AssignmentList({ canCreate = false, studentId }: AssignmentListProps) {
  const mode = useLayoutMode();
  const { assignments, isLoading } = useAssignmentList(
    studentId ? { student_id: studentId } : undefined
  );

  if (mode !== 'mobile') {
    return (
      <Suspense fallback={<MobileView assignments={assignments} isLoading={isLoading} canCreate={canCreate} />}>
        <DesktopView assignments={assignments} isLoading={isLoading} canCreate={canCreate} />
      </Suspense>
    );
  }

  return <MobileView assignments={assignments} isLoading={isLoading} canCreate={canCreate} />;
}

interface MobileViewProps {
  assignments: Assignment[];
  isLoading: boolean;
  canCreate: boolean;
}

function MobileView({ assignments, isLoading, canCreate }: MobileViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return assignments;
    return assignments.filter((a) => a.status === filter);
  }, [assignments, filter]);

  if (isLoading) return <AssignmentListSkeleton />;

  return (
    <div className="px-4 space-y-4">
      <CollapsibleFilterBar
        filters={FILTER_OPTIONS}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState canCreate={canCreate} />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          {filtered.map((assignment) => (
            <motion.div key={assignment.id} variants={listItem}>
              <AssignmentCardMobile assignment={assignment} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {canCreate && (
        <FloatingActionButton
          onClick={() => router.push('/dashboard/assignments/new')}
          label="Create assignment"
        />
      )}
    </div>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <ClipboardList className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No assignments yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {canCreate
          ? 'Create your first assignment to start tracking student tasks.'
          : 'Your teacher hasn\'t assigned anything yet.'}
      </p>
      {canCreate && (
        <Link
          href="/dashboard/assignments/new"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </Link>
      )}
    </div>
  );
}

export default AssignmentList;

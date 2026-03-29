'use client';

import { useState, useCallback } from 'react';
import { Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { VALID_STATUS_TRANSITIONS } from '@/schemas/AssignmentSchema';
import type { AssignmentStatus } from '@/schemas/AssignmentSchema';
import { updateAssignmentStatus } from '@/app/actions/assignments';
import { toast } from 'sonner';

interface AssignmentStatusActionsProps {
  assignmentId: string;
  currentStatus: AssignmentStatus;
  onStatusChanged?: (newStatus: AssignmentStatus) => void;
}

/**
 * Contextual action buttons for students to update assignment status.
 * Shows appropriate buttons based on current status and valid transitions.
 */
export function AssignmentStatusActions({
  assignmentId,
  currentStatus,
  onStatusChanged,
}: AssignmentStatusActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const transitions = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];

  const handleStatusChange = useCallback(
    async (newStatus: AssignmentStatus) => {
      if (isUpdating) return;
      setIsUpdating(true);

      try {
        const result = await updateAssignmentStatus(assignmentId, newStatus);

        if ('error' in result) {
          toast.error(result.error);
          return;
        }

        toast.success(
          newStatus === 'completed'
            ? 'Assignment completed! Great work!'
            : 'Assignment started. Good luck!'
        );
        onStatusChanged?.(newStatus);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to update status';
        toast.error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [assignmentId, isUpdating, onStatusChanged]
  );

  // Terminal states: no actions available
  if (transitions.length === 0) return null;

  const canStart = transitions.includes('in_progress');
  const canComplete = transitions.includes('completed');

  return (
    <div className="flex gap-2">
      {canStart && currentStatus !== 'in_progress' && (
        <Button
          variant="outline"
          className="min-h-[44px] flex-1"
          onClick={() => handleStatusChange('in_progress')}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Start Working
        </Button>
      )}

      {canComplete && (
        <CompleteConfirmDialog
          isUpdating={isUpdating}
          onConfirm={() => handleStatusChange('completed')}
        />
      )}
    </div>
  );
}

/**
 * Confirmation dialog before marking an assignment as complete.
 */
function CompleteConfirmDialog({
  isUpdating,
  onConfirm,
}: {
  isUpdating: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="min-h-[44px] flex-1" disabled={isUpdating}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Mark Complete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete this assignment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the assignment as completed. Your teacher will be able
            to see your progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, mark complete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

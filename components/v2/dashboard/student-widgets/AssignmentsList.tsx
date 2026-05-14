import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  status: AssignmentStatus;
  description: string | null;
}

interface AssignmentsListProps {
  assignments: Assignment[];
}

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; className: string }> = {
  not_started: {
    label: 'Not Started',
    className: 'bg-secondary text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-primary/10 text-primary',
  },
  completed: {
    label: 'Done',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-secondary text-muted-foreground',
  },
};

function formatDueDate(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 7) return `Due in ${days} days`;
  return `Due ${new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const config = STATUS_CONFIG[assignment.status];
  return (
    <Link
      href={`/dashboard/assignments/${assignment.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3
                 hover:bg-secondary/50 transition-colors rounded-lg"
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-foreground truncate">{assignment.title}</p>
        {assignment.due_date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDueDate(assignment.due_date)}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${config.className}`}>
        {config.label}
      </span>
    </Link>
  );
}

export function AssignmentsList({ assignments }: AssignmentsListProps) {
  return (
    <section className="bg-card rounded-[10px] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-muted-foreground text-xs font-black uppercase tracking-widest">
            Assignments
          </h2>
        </div>
        {assignments.length > 0 && (
          <Link
            href="/dashboard/assignments"
            className="text-xs font-bold uppercase tracking-widest
                       text-muted-foreground hover:text-primary transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="px-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            No active assignments right now. Great work!
          </p>
          <Link
            href="/dashboard/assignments?status=completed"
            className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
          >
            View past assignments
          </Link>
        </div>
      ) : (
        <ul className="-mx-2 space-y-1">
          {assignments.map((a) => (
            <li key={a.id}>
              <AssignmentRow assignment={a} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  studentName: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  songTitle?: string;
}

interface AssignmentListProps {
  assignments: Assignment[];
}

const statusConfig = {
  not_started: { label: 'Not Started', color: 'bg-muted text-muted-foreground border-0' },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary border-0' },
  completed: { label: 'Completed', color: 'bg-success/15 text-success border-0' },
  overdue: { label: 'Overdue', color: 'bg-destructive/10 text-destructive border-0' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground border-0' },
};

export function AssignmentList({ assignments }: AssignmentListProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden opacity-0 animate-fade-in"
      style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
    >
      <div className="p-6 border-b border-border">
        <h3 className="font-semibold">Assignments</h3>
        <p className="text-sm text-muted-foreground mt-1">Track student assignments</p>
      </div>

      <div className="divide-y divide-border">
        {assignments.map((assignment) => {
          const { label, color } = statusConfig[assignment.status];
          return (
            <div key={assignment.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{assignment.title}</p>
                  {assignment.songTitle && (
                    <p className="text-sm text-primary truncate">{assignment.songTitle}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {assignment.studentName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {assignment.dueDate}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className={cn('flex-shrink-0', color)}>
                  {label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

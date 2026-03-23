import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  description: string | null;
}

interface AssignmentsCardProps {
  assignments: Assignment[];
}

export function AssignmentsCard({ assignments }: AssignmentsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Pending Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending assignments.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isOverdue = assignment.due_date && isPast(new Date(assignment.due_date));

              return (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{assignment.title}</p>
                    {assignment.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          Due {format(new Date(assignment.due_date), 'MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                    {isOverdue
                      ? 'Overdue'
                      : assignment.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-primary"
          >
            <Link href="/dashboard/assignments">View All Assignments</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  teacher_id: string;
  student_id: string;
  lesson_id: string | null;
  created_at: string;
  updated_at: string;
  teacher_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface FilterState {
  status: string;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-success/10 text-success border-success/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function StudentAssignmentsPageClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    status: '',
  });

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);

      const response = await fetch(`/api/assignments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assignments');

      const data = await response.json();
      setAssignments(data.assignments ?? data);
      // setError(null);
    } catch (err) {
      logger.error('Error loading assignments:', err);
      // setError(err instanceof Error ? err.message : 'Error loading assignments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-3xl font-semibold">
          <span className="text-primary">My Assignments</span>
        </h1>
        <p className="text-muted-foreground mt-1">Track your progress and upcoming tasks</p>
      </div>

      <div className="flex justify-end mb-6">
        <Select
          value={filter.status}
          onValueChange={(value) => setFilter({ ...filter, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No assignments found</h3>
          <p className="text-muted-foreground">You don&apos;t have any assignments yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-300 opacity-0 animate-fade-in flex flex-col"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={cn('capitalize', statusColors[assignment.status])}
                >
                  {statusLabels[assignment.status]}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-1" title={assignment.title}>
                {assignment.title}
              </h3>

              {assignment.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 grow">
                  {assignment.description}
                </p>
              )}

              <div className="space-y-3 mt-auto pt-4 border-t border-border/50">
                {assignment.due_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                    Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2 text-primary/70" />
                  Assigned: {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                </div>

                {assignment.teacher_profile && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary/70" />
                    By: {assignment.teacher_profile.full_name || assignment.teacher_profile.email}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/assignments/${assignment.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

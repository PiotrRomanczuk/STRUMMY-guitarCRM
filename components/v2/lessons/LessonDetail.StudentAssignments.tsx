'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  formatLessonDate,
  getAssignmentStatusStyle,
  getAssignmentStatusLabel,
} from './lesson.helpers';
import type { Database } from '@/database.types';

interface StudentAssignmentsProps {
  studentId: string;
  currentLessonId: string;
}

interface AssignmentRow {
  id: string;
  title: string;
  status: Database['public']['Enums']['assignment_status'];
  due_date: string | null;
  lesson_id: string | null;
}

export function StudentAssignments({ studentId, currentLessonId }: StudentAssignmentsProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAssignments() {
      const supabase = createClient();
      const { data } = await supabase
        .from('assignments')
        .select('id, title, status, due_date, lesson_id')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('due_date', { ascending: false })
        .limit(10);

      if (!cancelled) {
        setAssignments(data ?? []);
        setLoading(false);
      }
    }
    fetchAssignments();
    return () => { cancelled = true; };
  }, [studentId]);

  return (
    <div className="bg-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Recent Assignments
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-2">
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No assignments yet</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2',
                a.lesson_id === currentLessonId
                  ? 'bg-primary/5 ring-1 ring-primary/10'
                  : 'bg-muted/30'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                {a.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Due {formatLessonDate(a.due_date)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5',
                    'text-[11px] font-medium border',
                    getAssignmentStatusStyle(a.status)
                  )}
                >
                  {getAssignmentStatusLabel(a.status)}
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/assignments/${a.id}/edit`)}
                  className="p-0.5 rounded hover:bg-background/50 transition-colors"
                  aria-label={`Edit ${a.title}`}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

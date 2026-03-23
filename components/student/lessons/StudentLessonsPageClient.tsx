'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface LessonWithDetails {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  lesson_teacher_number: number;
  teacher: { full_name: string | null; email: string } | null;
  student: { full_name: string | null; email: string } | null;
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-primary/10 text-primary border-primary/20',
  IN_PROGRESS: 'bg-warning/10 text-warning border-warning/20',
  COMPLETED: 'bg-success/10 text-success border-success/20',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  RESCHEDULED: 'bg-muted text-muted-foreground dark:text-zinc-400 border-border',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

export function StudentLessonsPageClient() {
  const [lessons, setLessons] = useState<LessonWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLessons() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('lessons')
          .select(
            `
            id,
            scheduled_at,
            status,
            notes,
            lesson_teacher_number,
            teacher:profiles!lessons_teacher_id_fkey(full_name, email),
            student:profiles!lessons_student_id_fkey(full_name, email)
          `
          )
          .eq('student_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (error) throw error;

        // Transform data to match LessonWithDetails interface
        // Supabase FK joins may return arrays; extract first element
        const transformedLessons: LessonWithDetails[] = (data || []).map((lesson) => ({
          id: lesson.id,
          scheduled_at: lesson.scheduled_at,
          status: lesson.status,
          notes: lesson.notes,
          lesson_teacher_number: lesson.lesson_teacher_number,
          teacher: Array.isArray(lesson.teacher) ? lesson.teacher[0] ?? null : lesson.teacher,
          student: Array.isArray(lesson.student) ? lesson.student[0] ?? null : lesson.student,
        }));

        setLessons(transformedLessons);
      } catch (error) {
        logger.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [supabase]);

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
          <span className="text-primary">Lessons</span>
        </h1>
        <p className="text-muted-foreground mt-1">View and manage all scheduled lessons</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No lessons found</h3>
          <p className="text-muted-foreground">You haven&apos;t been assigned any lessons yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-300 opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">
                        Lesson #{lesson.lesson_teacher_number}
                      </h3>
                      <Badge variant="outline" className={cn(statusColors[lesson.status])}>
                        {statusLabels[lesson.status]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(lesson.scheduled_at), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(lesson.scheduled_at), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {lesson.teacher?.full_name || 'Unknown Teacher'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {lesson.notes && (
                    <div className="hidden md:block md:max-w-xs lg:max-w-md bg-secondary/30 rounded-lg p-3 text-sm truncate">
                      <p className="text-muted-foreground italic truncate">
                        &quot;{lesson.notes}&quot;
                      </p>
                    </div>
                  )}

                  <Button asChild variant="ghost" size="sm" className="ml-auto">
                    <Link href={`/dashboard/lessons/${lesson.id}`}>
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

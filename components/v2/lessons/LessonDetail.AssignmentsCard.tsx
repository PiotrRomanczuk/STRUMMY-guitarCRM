'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  formatLessonDate,
  getAssignmentStatusStyle,
  getAssignmentStatusLabel,
} from './lesson.helpers';
import type { Database } from '@/database.types';

interface AssignmentsCardProps {
  assignments: {
    id: string;
    title: string;
    status: Database['public']['Enums']['assignment_status'];
    due_date: string | null;
  }[];
  lessonId?: string;
  studentId?: string;
}

export function AssignmentsCard({ assignments, lessonId, studentId }: AssignmentsCardProps) {
  const router = useRouter();

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary/60" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Assignments ({assignments.length})
          </h3>
        </div>
        {lessonId && (
          <Link
            href={`/dashboard/assignments/new?${new URLSearchParams({ ...(lessonId ? { lesson_id: lessonId } : {}), ...(studentId ? { student_id: studentId } : {}) }).toString()}`}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="New assignment"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments yet</p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {assignments.map((a) => (
            <motion.div
              key={a.id}
              variants={listItem}
              className="flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors rounded-lg px-4 py-3 cursor-pointer"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/assignments/${a.id}`}
                  className="text-sm font-medium truncate hover:text-primary transition-colors"
                >
                  {a.title}
                </Link>
                {a.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Due {formatLessonDate(a.due_date)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5',
                    'text-xs font-medium border',
                    getAssignmentStatusStyle(a.status)
                  )}
                >
                  {getAssignmentStatusLabel(a.status)}
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/assignments/${a.id}/edit`)}
                  className="p-1 rounded-md hover:bg-background/50 transition-colors"
                  aria-label={`Edit ${a.title}`}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

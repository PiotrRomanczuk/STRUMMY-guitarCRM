'use client';

import { formatDistanceToNow } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { StudentV2 } from '@/types/teacher-dashboard-v2';

interface StudentsWidgetProps {
  students: StudentV2[];
}

function sortByAttentionPriority(students: StudentV2[]): StudentV2[] {
  return [...students].sort((a, b) => {
    // 1. overdue assignments first
    if (b.overdueAssignmentCount !== a.overdueAssignmentCount) {
      return b.overdueAssignmentCount - a.overdueAssignmentCount;
    }
    // 2. last lesson >14 days ago
    const aDays = daysSince(a.lastLessonAt);
    const bDays = daysSince(b.lastLessonAt);
    if (bDays !== aDays) return bDays - aDays;
    // 3. alphabetical
    return a.name.localeCompare(b.name);
  });
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function lastLessonLabel(iso: string | null): { label: string; className: string } {
  if (!iso) return { label: 'No lessons yet', className: 'text-muted-foreground' };
  const days = daysSince(iso);
  const label = formatDistanceToNow(new Date(iso), { addSuffix: true });
  if (days > 14) return { label, className: 'text-destructive' };
  if (days > 7) return { label, className: 'text-amber-600 dark:text-amber-400' };
  return { label, className: 'text-muted-foreground' };
}

function nextLessonLabel(iso: string | null): { label: string; className: string } {
  if (!iso) return { label: 'None scheduled', className: 'text-muted-foreground' };
  const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
  const label = formatDistanceToNow(new Date(iso), { addSuffix: true });
  if (days <= 2) return { label, className: 'text-emerald-600 dark:text-emerald-400' };
  return { label, className: 'text-muted-foreground' };
}

export function StudentsWidget({ students }: StudentsWidgetProps) {
  const displayStudents = sortByAttentionPriority(students).slice(0, 6);

  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      <div className="px-6 pt-5 pb-1 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">
            Studio
          </div>
          <div className="font-serif text-lg font-normal tracking-[-0.01em] mt-0.5">
            {students.length} active {students.length === 1 ? 'student' : 'students'}
          </div>
        </div>
        <Link
          href="/dashboard/users"
          className="text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          View all &rarr;
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-serif text-base italic text-muted-foreground">No students yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Invite students to get started</p>
          <Link
            href="/dashboard/users/invite"
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Invite a student
          </Link>
        </div>
      ) : (
        <div className="px-6 pb-5">
          {displayStudents.map((student) => {
            const initials = student.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const last = lastLessonLabel(student.lastLessonAt);
            const next = nextLessonLabel(student.nextLessonAt);
            const hasOverdue = student.overdueAssignmentCount > 0;

            return (
              <Link
                key={student.id}
                href={`/dashboard/users/${student.id}`}
                className="flex flex-col py-3 border-b border-border last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors gap-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {initials}
                  </div>
                  <span className="text-[13px] font-medium flex-1 truncate">{student.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {student.level}
                  </span>
                </div>

                <div className="pl-[36px] flex flex-col gap-0.5">
                  <div className="font-mono text-[11px]">
                    <span className="text-muted-foreground">Last: </span>
                    <span className={last.className}>{last.label}</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    <span className="text-muted-foreground">Next: </span>
                    <span className={next.className}>{next.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {student.repertoireCount} songs
                    </span>
                    {hasOverdue && (
                      <span
                        className={cn(
                          'px-1.5 py-px rounded-full text-[10px] font-medium',
                          'bg-destructive/10 text-destructive'
                        )}
                      >
                        {student.overdueAssignmentCount} overdue
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

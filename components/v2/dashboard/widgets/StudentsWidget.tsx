'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

interface StudentSummary {
  id: string;
  name: string;
  level: string;
  lessonsCompleted: number;
  nextLesson: string;
}

interface StudentsWidgetProps {
  students: StudentSummary[];
}

export function StudentsWidget({ students }: StudentsWidgetProps) {
  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      <div className="px-6 pt-5 pb-1 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">Studio</div>
          <div className="font-serif text-lg font-normal tracking-[-0.01em] mt-0.5">
            {students.length} active {students.length === 1 ? 'student' : 'students'}
          </div>
        </div>
        <Link href="/dashboard/users" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
          View all &rarr;
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-serif text-base italic text-muted-foreground">No students yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Invite students to get started</p>
        </div>
      ) : (
        <div className="px-6 pb-5">
          {students.slice(0, 6).map((student, i) => {
            const initials = student.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            const isToday = student.nextLesson.toLowerCase().includes('today');

            return (
              <Link
                key={student.id}
                href={`/dashboard/users/${student.id}`}
                className="grid grid-cols-[auto_1fr_auto] gap-2.5 items-center py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium truncate">{student.name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    {student.lessonsCompleted} lessons · {student.level}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-right shrink-0">
                  {isToday ? (
                    <span className="text-primary font-medium">{student.nextLesson}</span>
                  ) : (
                    <span className="text-muted-foreground">{student.nextLesson}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

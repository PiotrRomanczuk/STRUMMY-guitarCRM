'use client';

import { Users, ChevronRight } from 'lucide-react';
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

const levelStyles: Record<string, string> = {
  Advanced: 'bg-primary/10 text-primary border-primary/20',
  Intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

export function StudentsWidget({ students }: StudentsWidgetProps) {
  const displayStudents = students.slice(0, 6);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Students ({students.length})
        </h3>
        <Link
          href="/dashboard/users"
          className="text-xs text-primary font-medium hover:underline"
        >
          View all
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No students yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Invite students to get started
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {displayStudents.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/users/${student.id}`}
              className="flex items-center justify-between px-4 py-3
                         hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student.lessonsCompleted} lessons &middot; Next: {student.nextLesson}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5
                              text-[11px] font-medium border
                              ${levelStyles[student.level] || levelStyles.Beginner}`}
                >
                  {student.level}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

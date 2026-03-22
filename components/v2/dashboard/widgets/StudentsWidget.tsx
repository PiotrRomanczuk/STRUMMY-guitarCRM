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
  const displayStudents = students.slice(0, 4);

  return (
    <section className="bg-card rounded-[10px] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground font-bold text-lg">
          Student Progress
        </h2>
        <Link
          href="/dashboard/users"
          className="text-xs text-muted-foreground hover:text-primary transition-colors
                     flex items-center gap-1 font-bold"
        >
          VIEW ALL
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
        <div className="space-y-5">
          {displayStudents.map((student) => {
            const pct = Math.min(Math.round((student.lessonsCompleted / 20) * 100), 100);
            return (
              <Link key={student.id} href={`/dashboard/users/${student.id}`} className="block group">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="text-foreground font-bold text-sm">{student.name}</h4>
                    <p className="text-muted-foreground text-[10px]">{student.level}</p>
                  </div>
                  <span className="text-primary font-bold text-xs">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-warning rounded-full
                               transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

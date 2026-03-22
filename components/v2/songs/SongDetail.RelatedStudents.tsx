'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  getSongStatusStyle,
  getSongStatusLabel,
} from '@/components/v2/lessons/lesson.helpers';

interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  bestStatus: string;
}

interface RelatedStudentsProps {
  songId: string;
}

const STATUS_PRIORITY: Record<string, number> = {
  mastered: 3,
  remembered: 2,
  started: 1,
  to_learn: 0,
};

export function RelatedStudents({ songId }: RelatedStudentsProps) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      const supabase = createClient();
      const { data } = await supabase
        .from('lesson_songs')
        .select(`
          id,
          status,
          lessons!lesson_songs_lesson_id_fkey (
            student_id,
            profiles!lessons_student_id_fkey ( id, full_name, email )
          )
        `)
        .eq('song_id', songId);

      if (!cancelled) {
        const studentMap = new Map<string, StudentRow>();

        (data ?? []).forEach((row) => {
          const profile = (row.lessons as unknown as {
            student_id: string;
            profiles: { id: string; full_name: string | null; email: string | null } | null;
          })?.profiles;
          if (!profile) return;

          const priority = STATUS_PRIORITY[row.status ?? ''] ?? 0;
          const existing = studentMap.get(profile.id);

          if (!existing || priority > (STATUS_PRIORITY[existing.bestStatus] ?? 0)) {
            studentMap.set(profile.id, {
              id: profile.id,
              fullName: profile.full_name ?? 'Unknown',
              email: profile.email ?? '',
              bestStatus: row.status ?? 'to_learn',
            });
          }
        });

        setStudents(Array.from(studentMap.values()));
        setLoading(false);
      }
    }

    fetchStudents();
    return () => { cancelled = true; };
  }, [songId]);

  return (
    <div className="bg-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Students Learning This ({!loading ? students.length : '...'})
        </h3>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No students assigned this song yet</p>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <Link key={student.id} href={`/dashboard/users/${student.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{student.fullName}</p>
                {student.email && (
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                )}
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 shrink-0 ml-3',
                'text-[11px] font-medium border',
                getSongStatusStyle(student.bestStatus),
              )}>
                {getSongStatusLabel(student.bestStatus)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center justify-between py-2">
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-muted rounded" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

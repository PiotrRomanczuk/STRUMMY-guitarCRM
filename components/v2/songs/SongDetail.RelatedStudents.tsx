'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { getSongStatusStyle, getSongStatusLabel } from '@/components/v2/lessons/lesson.helpers';
import {
  getSongStudentsFromRepertoire,
  type RepertoireStudentItem,
} from '@/app/dashboard/songs/[id]/actions';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  to_learn: { label: 'To Learn', color: 'bg-slate-500/10 text-slate-500' },
  started: { label: 'Started', color: 'bg-blue-500/10 text-blue-500' },
  remembered: { label: 'Remembered', color: 'bg-amber-500/10 text-amber-500' },
  with_author: { label: 'With Author', color: 'bg-purple-500/10 text-purple-500' },
  mastered: { label: 'Mastered', color: 'bg-green-500/10 text-green-500' },
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatPracticeTime(minutes: number): string {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SelfRatingStars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function StudentRow({ entry }: { entry: RepertoireStudentItem }) {
  const student = Array.isArray(entry.student) ? entry.student[0] : entry.student;
  if (!student) return null;

  const status = STATUS_LABELS[entry.current_status] ?? STATUS_LABELS.to_learn;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <Avatar className="h-8 w-8 shrink-0">
        {student.avatar_url && (
          <AvatarImage src={student.avatar_url} alt={student.full_name ?? ''} />
        )}
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {getInitials(student.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/users/${student.id}`}
          className="text-sm font-medium text-foreground hover:underline truncate block"
        >
          {student.full_name || student.email || 'Unknown'}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${status.color}`}
          >
            {status.label}
          </span>
          <SelfRatingStars rating={entry.self_rating} />
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
          <Clock className="h-3 w-3" />
          {formatPracticeTime(entry.total_practice_minutes)}
        </div>
        {entry.last_practiced_at && (
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(entry.last_practiced_at), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}

export function SongDetailRelatedStudents({ songId }: { songId: string }) {
  const [entries, setEntries] = useState<RepertoireStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSongStudentsFromRepertoire(songId);
      setEntries(result);
    } finally {
      setIsLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Students Learning This Song
        {!isLoading && entries.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-foreground">{entries.length}</span>
        )}
      </h3>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No students are learning this song yet
        </p>
      ) : (
        <div>
          {entries.map((entry) => (
            <StudentRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lightweight lesson-based Related Students (used by desktop layout) ── */

interface LessonStudentRow {
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
  const [students, setStudents] = useState<LessonStudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      const supabase = createClient();
      const { data } = await supabase
        .from('lesson_songs')
        .select(
          `
          id,
          status,
          lessons!lesson_songs_lesson_id_fkey (
            student_id,
            profiles!lessons_student_id_fkey ( id, full_name, email )
          )
        `
        )
        .eq('song_id', songId);

      if (!cancelled) {
        const studentMap = new Map<string, LessonStudentRow>();

        (data ?? []).forEach((row) => {
          const profile = (
            row.lessons as unknown as {
              student_id: string;
              profiles: { id: string; full_name: string | null; email: string | null } | null;
            }
          )?.profiles;
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
    return () => {
      cancelled = true;
    };
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
            <Link
              key={student.id}
              href={`/dashboard/users/${student.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{student.fullName}</p>
                {student.email && (
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                )}
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 shrink-0 ml-3',
                  'text-[11px] font-medium border',
                  getSongStatusStyle(student.bestStatus)
                )}
              >
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

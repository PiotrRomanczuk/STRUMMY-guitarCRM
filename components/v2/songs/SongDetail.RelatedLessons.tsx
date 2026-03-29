'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  formatLessonDate,
  getSongStatusStyle,
  getSongStatusLabel,
} from '@/components/v2/lessons/lesson.helpers';

interface LessonRow {
  id: string;
  title: string | null;
  scheduledAt: string;
  studentName: string;
  songStatus: string;
}

interface RelatedLessonsProps {
  songId: string;
}

export function RelatedLessons({ songId }: RelatedLessonsProps) {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLessons() {
      const supabase = createClient();
      const { data } = await supabase
        .from('lesson_songs')
        .select(`
          id,
          status,
          lessons!lesson_songs_lesson_id_fkey (
            id,
            title,
            scheduled_at,
            status,
            profiles!lessons_student_id_fkey ( id, full_name )
          )
        `)
        .eq('song_id', songId)
        .limit(10);

      if (!cancelled) {
        const rows: LessonRow[] = (data ?? [])
          .filter((row) => row.lessons)
          .map((row) => {
            const lesson = row.lessons as unknown as {
              id: string;
              title: string | null;
              scheduled_at: string;
              status: string;
              profiles: { id: string; full_name: string | null } | null;
            };
            return {
              id: lesson.id,
              title: lesson.title,
              scheduledAt: lesson.scheduled_at,
              studentName: lesson.profiles?.full_name ?? 'Unknown student',
              songStatus: row.status ?? 'to_learn',
            };
          });
        setLessons(rows);
        setLoading(false);
      }
    }

    fetchLessons();
    return () => { cancelled = true; };
  }, [songId]);

  return (
    <div className="bg-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Related Lessons {!loading && `(${lessons.length})`}
        </h3>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No lessons reference this song yet</p>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/dashboard/lessons/${lesson.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lesson.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLessonDate(lesson.scheduledAt)} &middot; {lesson.studentName}
                </p>
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 shrink-0 ml-3',
                'text-[11px] font-medium border',
                getSongStatusStyle(lesson.songStatus),
              )}>
                {getSongStatusLabel(lesson.songStatus)}
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
            <div className="h-3.5 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

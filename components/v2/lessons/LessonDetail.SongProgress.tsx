'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getSongStatusStyle, getSongStatusLabel, formatLessonDate } from './lesson.helpers';

interface SongProgressProps {
  songId: string;
  studentId: string;
}

interface HistoryEntry {
  id: string;
  changed_at: string | null;
  previous_status: string | null;
  new_status: string;
}

export function SongProgress({ songId, studentId }: SongProgressProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      const supabase = createClient();
      const { data } = await supabase
        .from('song_status_history')
        .select('id, changed_at, previous_status, new_status')
        .eq('song_id', songId)
        .eq('student_id', studentId)
        .order('changed_at', { ascending: false })
        .limit(5);

      if (!cancelled) {
        setEntries(data ?? []);
        setLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [songId, studentId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-4">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading history…</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2 px-4">
        No previous history
      </p>
    );
  }

  return (
    <div className="space-y-1.5 py-2 px-4">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground shrink-0 w-20">
            {formatLessonDate(entry.changed_at)}
          </span>
          {entry.previous_status && (
            <>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5',
                  'text-[10px] font-medium border',
                  getSongStatusStyle(entry.previous_status)
                )}
              >
                {getSongStatusLabel(entry.previous_status)}
              </span>
              <span className="text-muted-foreground">→</span>
            </>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5',
              'text-[10px] font-medium border',
              getSongStatusStyle(entry.new_status)
            )}
          >
            {getSongStatusLabel(entry.new_status)}
          </span>
        </div>
      ))}
    </div>
  );
}

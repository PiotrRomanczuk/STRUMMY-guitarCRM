'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { updateRepertoireEntryAction } from '@/app/actions/repertoire';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';

interface RepertoireCardProps {
  entry: StudentRepertoireWithSong;
  /** Students may edit notes + difficulty inline; otherwise read-only. */
  canEdit: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  to_learn: 'To learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'With author',
  mastered: 'Mastered',
};

export function RepertoireCard({ entry, canEdit }: RepertoireCardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(entry.student_notes ?? '');
  const [difficulty, setDifficulty] = useState<number | ''>(entry.difficulty_rating ?? '');
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateRepertoireEntryAction(entry.id, {
        student_notes: notes.trim() || null,
        difficulty_rating: difficulty === '' ? null : Number(difficulty),
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Saved');
      router.refresh();
    });
  }, [entry.id, notes, difficulty, router]);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.song.title}</p>
          {entry.song.author && (
            <p className="truncate text-sm text-muted-foreground">{entry.song.author}</p>
          )}
        </div>
        <Badge variant="secondary">
          {STATUS_LABELS[entry.current_status] ?? entry.current_status}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {entry.total_practice_minutes}m practiced
        </span>
        {entry.last_practiced_at && (
          <span>last {new Date(entry.last_practiced_at).toLocaleDateString()}</span>
        )}
      </div>

      {canEdit ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`notes-${entry.id}`} className="text-xs">
              My notes
            </Label>
            <Textarea
              id={`notes-${entry.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add a personal note"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Difficulty</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDifficulty(n)}
                  aria-label={`Set difficulty to ${n}`}
                  aria-pressed={difficulty === n}
                  className={cn(
                    'h-8 w-8 rounded-full border text-sm transition-colors',
                    difficulty === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      ) : (
        entry.student_notes && (
          <p className="mt-3 text-sm text-muted-foreground">{entry.student_notes}</p>
        )
      )}
    </div>
  );
}

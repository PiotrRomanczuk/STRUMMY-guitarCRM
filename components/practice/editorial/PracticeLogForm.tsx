'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { logPracticeSession } from '@/app/actions/practice';
import { DURATION_PRESETS } from '@/schemas/PracticeSessionSchema';
import { cn } from '@/lib/utils';

export interface RepertoireSongOption {
  songId: string;
  title: string;
  author: string | null;
}

interface PracticeLogFormProps {
  songs: RepertoireSongOption[];
}

const NO_SONG = '';

export function PracticeLogForm({ songs }: PracticeLogFormProps) {
  const router = useRouter();
  const [songId, setSongId] = useState<string>(NO_SONG);
  const [duration, setDuration] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const durationNum = typeof duration === 'number' ? duration : 0;
      if (durationNum < 1 || durationNum > 480) {
        toast.error('Enter a duration between 1 and 480 minutes');
        return;
      }

      startTransition(async () => {
        const result = await logPracticeSession({
          duration_minutes: durationNum,
          ...(songId !== NO_SONG && { song_id: songId }),
          ...(notes.trim() && { notes: notes.trim() }),
        });

        if ('error' in result) {
          toast.error(result.error);
          return;
        }

        toast.success('Practice logged');
        setSongId(NO_SONG);
        setDuration('');
        setNotes('');
        router.refresh();
      });
    },
    [duration, songId, notes, router]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="practice-song">
          Song <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <select
          id="practice-song"
          value={songId}
          onChange={(e) => setSongId(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm dark:bg-background"
        >
          <option value={NO_SONG}>General technique (no song)</option>
          {songs.map((s) => (
            <option key={s.songId} value={s.songId}>
              {s.title}
              {s.author ? ` — ${s.author}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Duration (minutes)</Label>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDuration(preset)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                duration === preset
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              )}
            >
              {preset}m
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={480}
            inputMode="numeric"
            aria-label="Custom duration in minutes"
            value={duration}
            onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Custom"
            className="h-9 w-24 rounded-lg border border-border bg-card px-3 text-sm dark:bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="practice-notes">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="practice-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What did you work on?"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log practice
      </Button>
    </form>
  );
}

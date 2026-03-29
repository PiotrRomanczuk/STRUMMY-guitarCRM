'use client';

import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { logPracticeSession } from '@/app/actions/practice';
import { SongPicker, NO_SONG_VALUE } from './SongPicker';
import { DurationPicker } from './DurationPicker';

interface PracticeLogFormProps {
  onClose: () => void;
}

export function PracticeLogForm({ onClose }: PracticeLogFormProps) {
  const [selectedSongId, setSelectedSongId] = useState<string>(NO_SONG_VALUE);
  const [duration, setDuration] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const isValid = typeof duration === 'number' && duration >= 1 && duration <= 480;

  const handleSubmit = useCallback(() => {
    const durationNum = typeof duration === 'number' ? duration : 0;
    if (durationNum < 1 || durationNum > 480) {
      toast.error('Please enter a duration between 1 and 480 minutes');
      return;
    }

    startTransition(async () => {
      const input = {
        duration_minutes: durationNum,
        ...(selectedSongId !== NO_SONG_VALUE && { song_id: selectedSongId }),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      const result = await logPracticeSession(input);

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success('Practice logged!');
      onClose();
    });
  }, [duration, selectedSongId, notes, onClose]);

  return (
    <div className="space-y-5 pb-4">
      <SongPicker value={selectedSongId} onChange={setSelectedSongId} />
      <DurationPicker value={duration} onChange={setDuration} />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="practice-notes">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="practice-notes"
          placeholder="What did you work on?"
          maxLength={500}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
        />
        {notes.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {notes.length}/500
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging...
          </>
        ) : (
          'Log Practice'
        )}
      </Button>
    </div>
  );
}

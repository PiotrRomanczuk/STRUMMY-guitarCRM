'use client';

import { User, Music, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface StudentStepProps {
  selectedStudent?: { id: string; full_name: string | null; email: string };
  error?: string;
  onOpen: () => void;
}

export function StudentStep({ selectedStudent, error, onOpen }: StudentStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Select Student</h2>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full text-left rounded-lg border p-4 min-h-[44px]',
          'active:bg-muted/50 transition-colors',
          error ? 'border-destructive' : 'border-border'
        )}
      >
        {selectedStudent ? (
          <div>
            <p className="text-sm font-medium">
              {selectedStudent.full_name || selectedStudent.email}
            </p>
            {selectedStudent.full_name && (
              <p className="text-xs text-muted-foreground">
                {selectedStudent.email}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tap to select a student...</p>
        )}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface SongsStepProps {
  selectedSongs: { id: string; title: string; author: string }[];
  onOpen: () => void;
}

export function SongsStep({ selectedSongs, onOpen }: SongsStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Music className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Select Songs</h2>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full text-left rounded-lg border border-border p-4 min-h-[44px]',
          'active:bg-muted/50 transition-colors'
        )}
      >
        <p className="text-sm text-muted-foreground">
          Tap to add or remove songs...
        </p>
      </button>
      {selectedSongs.length > 0 && (
        <div className="space-y-1">
          {selectedSongs.map((s) => (
            <div
              key={s.id}
              className="bg-card rounded-lg border border-border px-4 py-3"
            >
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.author}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScheduleStepProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

export function ScheduleStep({ value, error, onChange, onBlur }: ScheduleStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Schedule</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">Date &amp; Time</Label>
        <Input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={cn('min-h-[44px] text-base', error && 'border-destructive')}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

interface NotesStepProps {
  title: string;
  notes: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function NotesStep({ title, notes, onChange }: NotesStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Details</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={onChange}
          placeholder="e.g., Barre Chord Practice"
          className="min-h-[44px] text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={onChange}
          placeholder="Lesson plan, goals, observations..."
          className="min-h-[120px] text-base resize-y"
        />
      </div>
    </div>
  );
}

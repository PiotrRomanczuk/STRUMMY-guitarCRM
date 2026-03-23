'use client';

import { useCallback, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { updateLessonSongNotes } from '@/app/dashboard/lessons/actions';

interface SongNotesProps {
  lessonId: string;
  songId: string;
  initialNotes: string | null;
}

/** Collapsible per-song quick notes that auto-save on blur. */
export function SongNotes({ lessonId, songId, initialNotes }: SongNotesProps) {
  const [isOpen, setIsOpen] = useState(!!initialNotes);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNotes = useCallback(
    async (value: string) => {
      setIsSaving(true);
      const result = await updateLessonSongNotes(lessonId, songId, value);
      setIsSaving(false);
      if ('error' in result) {
        toast.error(result.error);
      }
    },
    [lessonId, songId]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNotes(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveNotes(value), 1500);
    },
    [saveNotes]
  );

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveNotes(notes);
  }, [notes, saveNotes]);

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
      >
        <MessageSquare className="size-3.5" />
        <span>{isOpen ? 'Hide notes' : 'Add notes'}</span>
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {isSaving && (
          <span className="text-xs text-muted-foreground ml-1">Saving...</span>
        )}
      </button>
      {isOpen && (
        <Textarea
          value={notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Quick notes for this song..."
          className="mt-2 min-h-[60px] resize-y text-sm"
          rows={2}
        />
      )}
    </div>
  );
}

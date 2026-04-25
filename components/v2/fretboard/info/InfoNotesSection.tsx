'use client';

import { type NoteName, formatNote } from '@/lib/music-theory';
import { cn } from '@/lib/utils';

interface InfoNotesSectionProps {
  highlightedNotes: NoteName[];
  rootNote: NoteName;
  useFlats: boolean;
}

export function InfoNotesSection({ highlightedNotes, rootNote, useFlats }: InfoNotesSectionProps) {
  if (highlightedNotes.length === 0) {
    return (
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
          Scale notes
        </h3>
        <p className="text-[13px] text-muted-foreground mt-2">Select a scale to see notes.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium mb-2.5">
        Scale notes
      </h3>
      <div className="grid grid-cols-4 gap-1">
        {highlightedNotes.map((note, i) => {
          const isRoot = note === rootNote;
          return (
            <div
              key={`${note}-${i}`}
              className={cn(
                'py-2.5 rounded-md text-center',
                isRoot
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border'
              )}
            >
              <div className="font-serif text-xl font-medium leading-none tracking-[-0.01em]">
                {formatNote(note, useFlats)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

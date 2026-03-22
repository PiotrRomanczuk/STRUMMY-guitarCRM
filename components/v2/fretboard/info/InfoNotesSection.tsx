'use client';

import { type NoteName, formatNote } from '@/lib/music-theory';

interface InfoNotesSectionProps {
  highlightedNotes: NoteName[];
  rootNote: NoteName;
  useFlats: boolean;
}

export function InfoNotesSection({ highlightedNotes, rootNote, useFlats }: InfoNotesSectionProps) {
  if (highlightedNotes.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
          Notes in Scale
        </h3>
        <p className="text-sm text-[#d5c4ad]">Select a scale to see notes.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Notes in Scale
      </h3>
      <div className="flex flex-wrap gap-2">
        {highlightedNotes.map((note, i) => {
          const isRoot = note === rootNote;
          return (
            <span
              key={`${note}-${i}`}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                isRoot
                  ? 'bg-[#ffd183] text-[#422c00]'
                  : 'bg-[#201f1f] text-[#d5c4ad]'
              }`}
            >
              {formatNote(note, useFlats)}
            </span>
          );
        })}
      </div>
    </section>
  );
}

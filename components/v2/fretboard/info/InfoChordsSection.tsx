'use client';

import { type NoteName, formatNote, getScaleNotes } from '@/lib/music-theory';
import { cn } from '@/lib/utils';

interface InfoChordsSectionProps {
  rootNote: NoteName;
  scaleKey: string;
  useFlats: boolean;
}

const DIATONIC_SUFFIXES = ['', 'm', 'm', '', '', 'm', 'dim'];
const ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

export function InfoChordsSection({ rootNote, scaleKey, useFlats }: InfoChordsSectionProps) {
  const scaleNotes = getScaleNotes(rootNote, scaleKey);
  if (scaleNotes.length === 0) return null;

  const chords = scaleNotes.slice(0, 7).map((note, i) => ({
    name: `${formatNote(note, useFlats)}${DIATONIC_SUFFIXES[i] ?? ''}`,
    roman: ROMAN_NUMERALS[i] ?? '',
    quality: DIATONIC_SUFFIXES[i] ?? '',
    note,
    isRoot: note === rootNote,
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
          Diatonic chords
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {chords.map((chord) => (
          <div key={chord.name} className="bg-muted/50 rounded-md py-2 text-center">
            <div className="font-mono text-[9px] text-muted-foreground tracking-[.08em]">
              {chord.roman}
            </div>
            <div className="font-serif text-base font-medium leading-none mt-0.5">
              {formatNote(chord.note, useFlats)}
              <span className="font-mono text-[10px] text-muted-foreground ml-px">
                {chord.quality}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

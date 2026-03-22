'use client';

import { type NoteName, formatNote, getScaleNotes } from '@/lib/music-theory';

interface InfoChordsSectionProps {
  rootNote: NoteName;
  scaleKey: string;
  useFlats: boolean;
}

/** Diatonic chord qualities for a major scale pattern */
const DIATONIC_SUFFIXES = ['', 'm', 'm', '', '', 'm', 'dim'];

export function InfoChordsSection({ rootNote, scaleKey, useFlats }: InfoChordsSectionProps) {
  const scaleNotes = getScaleNotes(rootNote, scaleKey);
  if (scaleNotes.length === 0) return null;

  // Build diatonic chords from the scale degrees
  const chords = scaleNotes.slice(0, 7).map((note, i) => ({
    name: `${formatNote(note, useFlats)}${DIATONIC_SUFFIXES[i] ?? ''}`,
    note,
    isRoot: note === rootNote,
  }));

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Related Chords
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {chords.slice(0, 4).map((chord) => (
          <div
            key={chord.name}
            className={`bg-[#201f1f] p-3 rounded-lg flex flex-col items-center gap-2 transition-transform hover:scale-105 ${
              chord.isRoot
                ? 'border-2 border-[#ffd183] ring-4 ring-[#ffd183]/10'
                : 'border border-transparent hover:border-[#504534]/40'
            }`}
          >
            <span className={`text-lg font-black ${
              chord.isRoot ? 'text-[#ffd183]' : 'text-[#e5e2e1]'
            }`}>
              {chord.name}
            </span>
            <div className="w-full aspect-[3/4] bg-[#353534]/30 rounded flex items-center justify-center relative overflow-hidden">
              <ChordDiagramPlaceholder />
              {chord.isRoot && (
                <div className="w-2 h-2 bg-[#ffd183] rounded-full absolute top-1/4 left-1/4" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChordDiagramPlaceholder() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20">
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} className="border-r border-b border-[#9d8f7a]" />
      ))}
    </div>
  );
}

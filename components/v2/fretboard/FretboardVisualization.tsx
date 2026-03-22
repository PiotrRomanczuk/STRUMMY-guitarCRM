'use client';

import { TOTAL_FRETS, type NoteName } from '@/lib/music-theory';
import { type NoteDisplayType } from '@/components/fretboard/useFretboard';
import { FretboardStrings } from './FretboardStrings';

/** Frets that get single inlay dots */
const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
/** Fret 12 gets double dot */
const DOUBLE_DOT_FRET = 12;

interface FretboardVisualizationProps {
  fretboard: NoteName[][];
  highlightedNotes: NoteName[];
  rootNote: NoteName;
  useFlats: boolean;
  showAllNotes: boolean;
  noteDisplayType: NoteDisplayType;
  audioEnabled: boolean;
  isReady: boolean;
  playNote: (stringIndex: number, fret: number, note: NoteName) => Promise<void>;
}

export function FretboardVisualization({
  fretboard,
  highlightedNotes,
  rootNote,
  useFlats,
  showAllNotes,
  noteDisplayType,
  audioEnabled,
  isReady,
  playNote,
}: FretboardVisualizationProps) {
  const fretCount = TOTAL_FRETS;
  const fretNumbers = Array.from({ length: fretCount }, (_, i) => i + 1);
  const reversedFretboard = [...fretboard].reverse();

  const handleClick = async (displayIdx: number, fret: number, note: NoteName) => {
    if (!audioEnabled || !isReady) return;
    const actualStringIndex = 5 - displayIdx;
    await playNote(actualStringIndex, fret, note);
  };

  return (
    <div className="flex-1 flex items-center justify-center -mx-12 overflow-x-auto pb-12 relative">
      <div className="relative bg-[#2a2621] rounded-sm shadow-2xl min-w-[1100px] h-[300px] flex flex-col justify-between overflow-hidden ring-4 ring-[#1c1b1b]">
        <FretWires fretCount={fretCount} />
        <FretboardStrings
          reversedFretboard={reversedFretboard}
          fretNumbers={fretNumbers}
          highlightedNotes={highlightedNotes}
          rootNote={rootNote}
          useFlats={useFlats}
          showAllNotes={showAllNotes}
          noteDisplayType={noteDisplayType}
          onNoteClick={handleClick}
        />
      </div>
      <FretNumbers fretNumbers={fretNumbers} />
    </div>
  );
}

function FretWires({ fretCount }: { fretCount: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${fretCount}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: fretCount }, (_, i) => (
        <div
          key={i}
          className={`h-full ${
            i + 1 === DOUBLE_DOT_FRET
              ? 'border-r-4 border-[#ffd183]/20'
              : 'border-r-2 border-[#504534]/40'
          }`}
        />
      ))}
    </div>
  );
}

function FretNumbers({ fretNumbers }: { fretNumbers: number[] }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-[2%]"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${fretNumbers.length}, minmax(0, 1fr))` }}
    >
      {fretNumbers.map((fret) => {
        const isMarked = SINGLE_DOT_FRETS.includes(fret) || fret === DOUBLE_DOT_FRET;
        return (
          <div
            key={fret}
            className={`flex justify-center text-[10px] font-bold py-1 ${
              isMarked ? 'text-[#ffd183]' : 'text-[#9d8f7a]'
            }`}
          >
            {fret}
          </div>
        );
      })}
    </div>
  );
}

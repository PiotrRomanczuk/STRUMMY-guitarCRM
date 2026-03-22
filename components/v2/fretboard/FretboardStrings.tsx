'use client';

import { TOTAL_FRETS, type NoteName, formatNote } from '@/lib/music-theory';
import { type NoteDisplayType } from '@/components/fretboard/useFretboard';
import { isHighlighted, isRoot, getNoteInterval } from '@/components/fretboard/fretboard.helpers';
import { FretboardNoteMarker } from './FretboardNoteMarker';

interface FretboardStringsProps {
  reversedFretboard: NoteName[][];
  fretNumbers: number[];
  highlightedNotes: NoteName[];
  rootNote: NoteName;
  useFlats: boolean;
  showAllNotes: boolean;
  noteDisplayType: NoteDisplayType;
  onNoteClick: (displayIdx: number, fret: number, note: NoteName) => void;
}

/** String thickness increases from high E (top) to low E (bottom) */
const STRING_THICKNESS = [1, 1.5, 2, 2.5, 3, 4];

export function FretboardStrings({
  reversedFretboard,
  fretNumbers,
  highlightedNotes,
  rootNote,
  useFlats,
  showAllNotes,
  noteDisplayType,
  onNoteClick,
}: FretboardStringsProps) {
  return (
    <div className="relative flex-1 flex flex-col justify-between py-6 z-10">
      {reversedFretboard.map((stringNotes, displayIdx) => {
        const thickness = STRING_THICKNESS[displayIdx];
        const isWound = displayIdx >= 3;

        return (
          <div
            key={displayIdx}
            className="w-full flex items-center relative"
            style={{ height: `${thickness}px` }}
          >
            <div
              className="absolute inset-0"
              style={{
                height: `${thickness}px`,
                background: isWound
                  ? `rgba(255, 209, 131, ${0.3 + displayIdx * 0.05})`
                  : `rgba(213, 196, 173, ${0.3 + displayIdx * 0.03})`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
            {fretNumbers.map((fret) => {
              const note = stringNotes[fret];
              if (!note) return null;
              const highlighted = isHighlighted(note, highlightedNotes);
              const root = isRoot(note, highlightedNotes, rootNote);
              const shouldShow = highlighted || showAllNotes || highlightedNotes.length === 0;
              if (!shouldShow) return null;

              const noteText = noteDisplayType === 'interval' && highlighted
                ? getNoteInterval(note, rootNote)
                : formatNote(note, useFlats);

              const leftPercent = ((fret - 0.5) / TOTAL_FRETS) * 100;

              return (
                <FretboardNoteMarker
                  key={fret}
                  noteText={noteText}
                  isHighlighted={highlighted}
                  isRoot={root}
                  leftPercent={leftPercent}
                  onClick={() => onNoteClick(displayIdx, fret, note)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { formatNote } from '@/lib/music-theory';
import { SCALE_DEFINITIONS } from '@/lib/music-theory/scales';
import { FretboardSidebar } from './FretboardSidebar';
import { FretboardVisualization } from './FretboardVisualization';
import { FretboardInfoPanel } from './FretboardInfoPanel';

type DesktopProps = FretboardState & FretboardActions;

export function FretboardDesktop(props: DesktopProps) {
  const {
    rootNote, scaleKey, displayMode, useFlats,
    highlightedNotes, fretboard, showAllNotes,
    noteDisplayType, audioEnabled, isReady, playNote,
  } = props;

  const scaleDef = SCALE_DEFINITIONS[scaleKey];
  const scaleTitle = displayMode === 'scale' && scaleDef
    ? `${formatNote(rootNote, useFlats)} ${scaleDef.name.split(' (')[0]} Scale`
    : displayMode === 'chord'
      ? `${formatNote(rootNote, useFlats)} Chord`
      : 'Fretboard Explorer';

  return (
    <div className="flex h-full overflow-hidden">
      <FretboardSidebar {...props} />

      <main className="flex-1 flex flex-col bg-[#131313] p-12 overflow-x-hidden relative">
        <FretboardHeader title={scaleTitle} scaleKey={scaleKey} />
        <FretboardVisualization
          fretboard={fretboard}
          highlightedNotes={highlightedNotes}
          rootNote={rootNote}
          useFlats={useFlats}
          showAllNotes={showAllNotes}
          noteDisplayType={noteDisplayType}
          audioEnabled={audioEnabled}
          isReady={isReady}
          playNote={playNote}
        />
        <FretboardLegend />
      </main>

      <FretboardInfoPanel {...props} />
    </div>
  );
}

function FretboardHeader({ title, scaleKey }: { title: string; scaleKey: string }) {
  const scaleDef = SCALE_DEFINITIONS[scaleKey];
  const formula = scaleDef
    ? scaleDef.intervals.map((v, i, arr) =>
      i === arr.length - 1 ? '' : (arr[i + 1] - v) === 2 ? 'W' : (arr[i + 1] - v) === 1 ? 'H' : `${arr[i + 1] - v}`
    ).filter(Boolean).join(' ')
    : '';

  return (
    <div className="mb-12 flex flex-col gap-2">
      <h1 className="text-5xl font-black text-[#ffd183] tracking-tighter">
        {title}
      </h1>
      {formula && (
        <div className="flex items-center gap-4 text-[#d5c4ad]">
          <span className="px-3 py-1 bg-[#201f1f] rounded-lg text-sm font-mono tracking-[0.3em]">
            {formula}
          </span>
          <span className="text-xs text-[#9d8f7a] uppercase tracking-widest font-bold">
            Standard Formula
          </span>
        </div>
      )}
    </div>
  );
}

function FretboardLegend() {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#201f1f]/80 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-8 shadow-2xl border border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ffd183]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">
          Root (I)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ffd183]/60" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#e5e2e1]">
          Scale Note
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#353534]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#9d8f7a]">
          In-between
        </span>
      </div>
    </div>
  );
}

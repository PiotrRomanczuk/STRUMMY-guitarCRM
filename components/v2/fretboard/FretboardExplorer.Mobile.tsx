'use client';

import { useState } from 'react';
import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { formatNote, CHROMATIC_NOTES, type NoteName } from '@/lib/music-theory';
import { SCALE_DEFINITIONS } from '@/lib/music-theory/scales';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { FretboardVisualization } from './FretboardVisualization';

type MobileProps = FretboardState & FretboardActions;

export function FretboardMobile(props: MobileProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scaleDef = SCALE_DEFINITIONS[props.scaleKey];
  const title = props.displayMode === 'scale' && scaleDef
    ? `${formatNote(props.rootNote, props.useFlats)} ${scaleDef.name.split(' (')[0]}`
    : 'Fretboard Explorer';

  return (
    <div className="flex flex-col min-h-[calc(100vh-72px)] bg-[#131313]">
      {/* Mobile header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-[#ffd183] tracking-tight">{title}</h1>
      </div>

      {/* Quick key selector */}
      <MobileKeyStrip rootNote={props.rootNote} onRootChange={props.setRootNote} />

      {/* Horizontal scrollable fretboard */}
      <div className="flex-1 overflow-x-auto px-2 py-4">
        <FretboardVisualization
          fretboard={props.fretboard}
          highlightedNotes={props.highlightedNotes}
          rootNote={props.rootNote}
          useFlats={props.useFlats}
          showAllNotes={props.showAllNotes}
          noteDisplayType={props.noteDisplayType}
          audioEnabled={props.audioEnabled}
          isReady={props.isReady}
          playNote={props.playNote}
        />
      </div>

      {/* Bottom sheet trigger */}
      <button
        onClick={() => setIsSheetOpen(!isSheetOpen)}
        className="fixed bottom-0 left-0 right-0 bg-[#201f1f] border-t border-[#504534]/30 px-6 py-3 flex items-center justify-between z-40"
      >
        <span className="text-sm font-semibold text-[#d5c4ad]">Controls</span>
        <MaterialIcon
          icon={isSheetOpen ? 'expand_more' : 'expand_less'}
          className="text-[#9d8f7a]"
        />
      </button>

      {/* Bottom sheet overlay */}
      {isSheetOpen && (
        <MobileBottomSheet
          {...props}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </div>
  );
}

function MobileKeyStrip({ rootNote, onRootChange }: {
  rootNote: NoteName;
  onRootChange: (note: NoteName) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
      {CHROMATIC_NOTES.map((note) => (
        <button
          key={note}
          onClick={() => onRootChange(note)}
          className={`shrink-0 h-8 px-3 rounded-lg text-xs font-bold transition-all ${
            rootNote === note
              ? 'bg-[#ffd183] text-[#422c00]'
              : 'bg-[#201f1f] text-[#e5e2e1]'
          }`}
        >
          {note}
        </button>
      ))}
    </div>
  );
}

function MobileBottomSheet(props: MobileProps & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <div className="bg-[#1c1b1b] rounded-t-2xl max-h-[70vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e5e2e1]">Controls</h2>
          <button onClick={props.onClose} className="text-[#9d8f7a]">
            <MaterialIcon icon="close" />
          </button>
        </div>

        {/* Scale quick select */}
        <MobileScaleSelect
          scaleKey={props.scaleKey}
          onScaleChange={props.setScaleKey}
        />

        {/* Play button */}
        <button
          onClick={props.togglePlayback}
          className="w-full bg-gradient-to-br from-[#ffd183] to-[#f2b127] text-[#422c00] py-3 rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <MaterialIcon icon={props.isPlaying ? 'pause' : 'play_arrow'} fill />
          {props.isPlaying ? 'Pause' : 'Play Scale'}
        </button>
      </div>
    </div>
  );
}

function MobileScaleSelect({ scaleKey, onScaleChange }: {
  scaleKey: string;
  onScaleChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Scale
      </span>
      <select
        value={scaleKey}
        onChange={(e) => onScaleChange(e.target.value)}
        className="w-full bg-[#0e0e0e] text-[#e5e2e1] border-0 px-4 py-3 rounded-lg text-sm"
      >
        {Object.entries(SCALE_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.name}</option>
        ))}
      </select>
    </div>
  );
}

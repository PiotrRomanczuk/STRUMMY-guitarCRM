'use client';

import { useState } from 'react';
import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { formatNote, CHROMATIC_NOTES, type NoteName } from '@/lib/music-theory';
import { SCALE_DEFINITIONS } from '@/lib/music-theory/scales';
import { SlidersHorizontal, Play, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FretboardVisualization } from './FretboardVisualization';

type MobileProps = FretboardState & FretboardActions;

export function FretboardMobile(props: MobileProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scaleDef = SCALE_DEFINITIONS[props.scaleKey];
  const scaleLabel = props.displayMode === 'scale' && scaleDef
    ? scaleDef.name.split(' (')[0]
    : 'Explorer';

  return (
    <div className="flex flex-col min-h-[calc(100vh-72px)] bg-background">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border bg-card flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em]">
            Fretboard
          </div>
          <div className="font-serif text-[22px] font-medium tracking-[-0.02em] leading-none mt-0.5">
            {formatNote(props.rootNote, props.useFlats)}{' '}
            <em className="text-primary">{scaleLabel}</em>
          </div>
        </div>
        <button
          onClick={() => setIsSheetOpen(true)}
          className="px-2.5 py-1.5 rounded-md border border-border bg-card text-xs text-foreground/80 flex items-center gap-1.5"
        >
          <SlidersHorizontal className="h-3 w-3" /> Controls
        </button>
      </div>

      {/* Key selector */}
      <MobileKeyStrip rootNote={props.rootNote} onRootChange={props.setRootNote} useFlats={props.useFlats} />

      {/* Fretboard */}
      <div className="flex-1 overflow-x-auto px-3 py-4">
        <div className="bg-card border border-border rounded-[10px] p-2.5 overflow-x-auto">
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
      </div>

      {/* Scale notes */}
      <div className="px-4 pb-3">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] mb-1.5">Notes</div>
        <div className="grid grid-cols-5 gap-1">
          {props.highlightedNotes.map((n, i) => (
            <div key={`${n}-${i}`} className={cn(
              'py-2 rounded-md text-center font-serif text-base font-medium',
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            )}>
              {formatNote(n, props.useFlats)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom sheet trigger */}
      <button
        onClick={() => setIsSheetOpen(!isSheetOpen)}
        className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex items-center justify-between z-40"
      >
        <span className="text-sm font-medium text-foreground">Controls</span>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Bottom sheet */}
      {isSheetOpen && (
        <MobileBottomSheet {...props} onClose={() => setIsSheetOpen(false)} />
      )}
    </div>
  );
}

function MobileKeyStrip({ rootNote, onRootChange, useFlats }: {
  rootNote: NoteName; onRootChange: (note: NoteName) => void; useFlats: boolean;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-2.5 scrollbar-none">
      {CHROMATIC_NOTES.map((note) => (
        <button
          key={note}
          onClick={() => onRootChange(note)}
          className={cn(
            'shrink-0 h-9 px-3 rounded-lg font-serif text-sm font-medium transition-all',
            rootNote === note
              ? 'bg-primary/10 border border-primary/30 text-primary'
              : 'bg-card border border-border text-foreground/80'
          )}
        >
          {formatNote(note, useFlats)}
        </button>
      ))}
    </div>
  );
}

function MobileBottomSheet(props: MobileProps & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <div className="bg-card border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium">Controls</h2>
          <button onClick={props.onClose} className="text-muted-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scale */}
        <div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] mb-2">Scale</div>
          <select
            value={props.scaleKey}
            onChange={(e) => props.setScaleKey(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm"
          >
            {Object.entries(SCALE_DEFINITIONS).map(([key, def]) => (
              <option key={key} value={key}>{def.name}</option>
            ))}
          </select>
        </div>

        {/* Play */}
        <button
          onClick={props.togglePlayback}
          className={cn(
            'w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2',
            props.isPlaying
              ? 'bg-primary/10 border border-primary/30 text-primary'
              : 'bg-foreground text-background'
          )}
        >
          {props.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {props.isPlaying ? 'Pause' : 'Play Scale'}
        </button>
      </div>
    </div>
  );
}

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
  const scaleLabel = displayMode === 'scale' && scaleDef
    ? scaleDef.name.split(' (')[0]
    : displayMode === 'chord' ? 'Chord' : 'Chromatic';
  const noteCount = highlightedNotes.length;

  return (
    <div className="flex h-full overflow-hidden">
      <FretboardSidebar {...props} />

      <main className="flex-1 flex flex-col bg-background overflow-x-hidden relative min-w-0">
        {/* Header */}
        <div className="px-7 pt-6 pb-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] mb-1 flex items-center gap-2.5">
                <span>Fretboard Explorer</span>
              </div>
              <h1 className="font-serif font-normal text-[40px] tracking-[-0.02em] leading-none">
                {formatNote(rootNote, useFlats)}{' '}
                <em className="italic text-primary">{scaleLabel}</em>
              </h1>
              <div className="text-muted-foreground text-[13px] font-mono mt-1.5">
                {noteCount > 0 && <>{noteCount} notes</>}
                {scaleDef && displayMode === 'scale' && (
                  <> · {scaleDef.intervals.map((v, i, arr) =>
                    i === arr.length - 1 ? '' : (arr[i + 1] - v) === 2 ? 'W' : (arr[i + 1] - v) === 1 ? 'H' : `${arr[i + 1] - v}`
                  ).filter(Boolean).join('-')}</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 px-7 pb-6 overflow-y-auto">
          <div className="bg-card border border-border rounded-[14px] p-4">
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
            {/* Caption */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border font-mono text-[11px] text-muted-foreground">
              <span>15 FRETS · 6 STRINGS · STANDARD TUNING</span>
              <span>TAP A NOTE TO HEAR IT</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl px-5 py-2.5 rounded-full flex items-center gap-6 shadow-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[.1em] text-foreground">Root</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
            <span className="text-[10px] font-mono uppercase tracking-[.1em] text-foreground">Scale note</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-mono uppercase tracking-[.1em] text-muted-foreground">Other</span>
          </div>
        </div>
      </main>

      <FretboardInfoPanel {...props} />
    </div>
  );
}

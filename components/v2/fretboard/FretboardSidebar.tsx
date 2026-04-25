'use client';

import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { SidebarScaleSection } from './sidebar/SidebarScaleSection';
import { SidebarKeySection } from './sidebar/SidebarKeySection';
import { SidebarDisplaySection } from './sidebar/SidebarDisplaySection';
import { SidebarAudioSection } from './sidebar/SidebarAudioSection';

type SidebarProps = FretboardState & FretboardActions;

export function FretboardSidebar(props: SidebarProps) {
  return (
    <aside className="w-[280px] border-r border-border bg-card flex flex-col gap-5 py-5 px-5 overflow-y-auto shrink-0">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.16em]">
          Studio tool
        </div>
        <h2 className="font-serif font-medium text-2xl tracking-[-0.02em] leading-tight mt-1">
          Fretboard
        </h2>
        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
          STANDARD · E-A-D-G-B-e
        </div>
      </div>

      <SidebarScaleSection
        scaleKey={props.scaleKey}
        onScaleChange={props.setScaleKey}
        displayMode={props.displayMode}
        onModeChange={props.setDisplayMode}
      />

      <SidebarKeySection
        rootNote={props.rootNote}
        onRootChange={props.setRootNote}
      />

      <SidebarDisplaySection
        noteDisplayType={props.noteDisplayType}
        showFunctionalColors={props.showFunctionalColors}
        showAllNotes={props.showAllNotes}
        onNoteDisplayTypeChange={props.setNoteDisplayType}
        onToggleFunctionalColors={props.toggleFunctionalColors}
        onToggleAllNotes={props.toggleShowAllNotes}
      />

      <SidebarAudioSection
        isPlaying={props.isPlaying}
        bpm={props.bpm}
        onTogglePlayback={props.togglePlayback}
        onBpmChange={props.setBpm}
      />
    </aside>
  );
}

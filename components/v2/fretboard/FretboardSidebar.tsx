'use client';

import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { SidebarScaleSection } from './sidebar/SidebarScaleSection';
import { SidebarKeySection } from './sidebar/SidebarKeySection';
import { SidebarDisplaySection } from './sidebar/SidebarDisplaySection';
import { SidebarAudioSection } from './sidebar/SidebarAudioSection';

type SidebarProps = FretboardState & FretboardActions;

export function FretboardSidebar(props: SidebarProps) {
  return (
    <aside className="w-[250px] bg-[#1c1b1b] flex flex-col gap-8 py-8 px-6 overflow-y-auto shrink-0">
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

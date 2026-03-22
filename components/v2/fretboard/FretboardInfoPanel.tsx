'use client';

import { type FretboardState, type FretboardActions } from '@/components/fretboard/useFretboard';
import { InfoNotesSection } from './info/InfoNotesSection';
import { InfoChordsSection } from './info/InfoChordsSection';
import { InfoPositionsSection } from './info/InfoPositionsSection';
import { InfoProTip } from './info/InfoProTip';

type InfoPanelProps = FretboardState & FretboardActions;

export function FretboardInfoPanel(props: InfoPanelProps) {
  const { rootNote, scaleKey, highlightedNotes, useFlats, cagedShape } = props;

  return (
    <aside className="w-[280px] bg-[#1c1b1b] flex flex-col py-8 px-6 gap-8 overflow-y-auto shrink-0">
      <InfoNotesSection
        highlightedNotes={highlightedNotes}
        rootNote={rootNote}
        useFlats={useFlats}
      />

      <InfoChordsSection
        rootNote={rootNote}
        scaleKey={scaleKey}
        useFlats={useFlats}
      />

      <InfoPositionsSection
        cagedShape={cagedShape}
        onCagedShapeChange={props.setCagedShape}
      />

      <InfoProTip rootNote={rootNote} scaleKey={scaleKey} useFlats={useFlats} />
    </aside>
  );
}

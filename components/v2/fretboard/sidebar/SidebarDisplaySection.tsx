'use client';

import { type NoteDisplayType } from '@/components/fretboard/useFretboard';

interface SidebarDisplaySectionProps {
  noteDisplayType: NoteDisplayType;
  showFunctionalColors: boolean;
  showAllNotes: boolean;
  onNoteDisplayTypeChange: (type: NoteDisplayType) => void;
  onToggleFunctionalColors: () => void;
  onToggleAllNotes: () => void;
}

export function SidebarDisplaySection({
  noteDisplayType,
  showFunctionalColors,
  showAllNotes,
  onNoteDisplayTypeChange,
  onToggleFunctionalColors,
  onToggleAllNotes,
}: SidebarDisplaySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Display
      </h3>

      {/* Note/Interval toggle */}
      <div className="flex flex-col gap-3">
        <RadioOption
          label="Notes"
          isActive={noteDisplayType === 'name'}
          onSelect={() => onNoteDisplayTypeChange('name')}
        />
        <RadioOption
          label="Intervals"
          isActive={noteDisplayType === 'interval'}
          onSelect={() => onNoteDisplayTypeChange('interval')}
        />
      </div>

      {/* Toggle switches */}
      <div className="pt-4 border-t border-[#504534]/20 flex flex-col gap-4">
        <ToggleSwitch
          label="Highlight Root"
          isActive={showFunctionalColors}
          onToggle={onToggleFunctionalColors}
        />
        <ToggleSwitch
          label="Show All Notes"
          isActive={showAllNotes}
          onToggle={onToggleAllNotes}
        />
      </div>
    </section>
  );
}

function RadioOption({ label, isActive, onSelect }: {
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-3 cursor-pointer group ${isActive ? '' : 'opacity-60'}`}
      onClick={onSelect}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        isActive ? 'border-[#ffd183] bg-[#ffd183]' : 'border-[#504534]'
      }`}>
        {isActive && <div className="w-2 h-2 bg-[#422c00] rounded-full" />}
      </div>
      <span className="text-sm text-[#e5e2e1]">{label}</span>
    </button>
  );
}

function ToggleSwitch({ label, isActive, onToggle }: {
  label: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#d5c4ad]">{label}</span>
      <button
        onClick={onToggle}
        className={`w-8 h-4 rounded-full relative flex items-center px-0.5 transition-colors ${
          isActive ? 'bg-[#ffd183]' : 'bg-[#353534]'
        }`}
      >
        <div className={`w-3 h-3 rounded-full transition-all ${
          isActive ? 'bg-[#422c00] ml-auto' : 'bg-[#9d8f7a]'
        }`} />
      </button>
    </div>
  );
}

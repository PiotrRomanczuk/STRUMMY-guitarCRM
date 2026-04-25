'use client';

import { type NoteDisplayType } from '@/components/fretboard/useFretboard';
import { cn } from '@/lib/utils';

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
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
        Display
      </h3>

      {/* Note/Interval toggle */}
      <div className="flex flex-col gap-2.5">
        <RadioOption label="Notes" isActive={noteDisplayType === 'name'} onSelect={() => onNoteDisplayTypeChange('name')} />
        <RadioOption label="Intervals" isActive={noteDisplayType === 'interval'} onSelect={() => onNoteDisplayTypeChange('interval')} />
      </div>

      {/* Toggle switches */}
      <div className="pt-3 border-t border-border flex flex-col gap-3">
        <ToggleSwitch label="Highlight root" isActive={showFunctionalColors} onToggle={onToggleFunctionalColors} />
        <ToggleSwitch label="Show all notes" isActive={showAllNotes} onToggle={onToggleAllNotes} />
      </div>
    </section>
  );
}

function RadioOption({ label, isActive, onSelect }: { label: string; isActive: boolean; onSelect: () => void }) {
  return (
    <button type="button" className="flex items-center gap-2.5 cursor-pointer group" onClick={onSelect}>
      <div className={cn(
        'w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center',
        isActive ? 'border-primary bg-primary' : 'border-border'
      )}>
        {isActive && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />}
      </div>
      <span className={cn('text-[13px]', isActive ? 'text-foreground font-medium' : 'text-muted-foreground')}>{label}</span>
    </button>
  );
}

function ToggleSwitch({ label, isActive, onToggle }: { label: string; isActive: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border last:border-b-0">
      <span className="text-[13px] text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-9 h-5 rounded-full relative transition-colors',
          isActive ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
          isActive ? 'left-[18px]' : 'left-0.5'
        )} />
      </button>
    </div>
  );
}

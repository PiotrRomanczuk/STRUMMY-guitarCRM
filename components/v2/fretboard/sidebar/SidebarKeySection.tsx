'use client';

import { CHROMATIC_NOTES, type NoteName } from '@/lib/music-theory';
import { cn } from '@/lib/utils';

interface SidebarKeySectionProps {
  rootNote: NoteName;
  onRootChange: (note: NoteName) => void;
}

export function SidebarKeySection({ rootNote, onRootChange }: SidebarKeySectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
        Key
      </h3>
      <div className="grid grid-cols-6 gap-1">
        {CHROMATIC_NOTES.map((note) => {
          const isActive = rootNote === note;
          const isAccidental = note.length > 1;
          return (
            <button
              key={note}
              onClick={() => onRootChange(note)}
              className={cn(
                'py-2.5 rounded-lg font-serif text-base font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isAccidental
                    ? 'bg-muted hover:bg-muted/80 text-foreground'
                    : 'bg-card border border-border hover:bg-muted text-foreground'
              )}
            >
              {note}
            </button>
          );
        })}
      </div>
    </section>
  );
}

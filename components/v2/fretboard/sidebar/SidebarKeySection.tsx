'use client';

import { CHROMATIC_NOTES, type NoteName } from '@/lib/music-theory';

interface SidebarKeySectionProps {
  rootNote: NoteName;
  onRootChange: (note: NoteName) => void;
}

export function SidebarKeySection({ rootNote, onRootChange }: SidebarKeySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Key
      </h3>
      <div className="grid grid-cols-4 gap-1">
        {CHROMATIC_NOTES.map((note) => {
          const isActive = rootNote === note;
          return (
            <button
              key={note}
              onClick={() => onRootChange(note)}
              className={`h-9 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#ffd183] text-[#422c00]'
                  : 'bg-[#201f1f] hover:bg-[#353534] text-[#e5e2e1]'
              }`}
            >
              {note}
            </button>
          );
        })}
      </div>
    </section>
  );
}

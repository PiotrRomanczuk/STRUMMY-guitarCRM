'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface SidebarAudioSectionProps {
  isPlaying: boolean;
  bpm: number;
  onTogglePlayback: () => void;
  onBpmChange: (bpm: number) => void;
}

export function SidebarAudioSection({
  isPlaying,
  bpm,
  onTogglePlayback,
  onBpmChange,
}: SidebarAudioSectionProps) {
  return (
    <section className="mt-auto flex flex-col gap-4">
      <button
        onClick={onTogglePlayback}
        className="w-full bg-gradient-to-br from-[#ffd183] to-[#f2b127] text-[#422c00] py-3 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <MaterialIcon
          icon={isPlaying ? 'pause' : 'play_arrow'}
          fill
          className="text-lg"
        />
        {isPlaying ? 'Pause' : 'Play Scale'}
      </button>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px] text-[#9d8f7a] uppercase font-bold tracking-tighter">
          <span>Tempo</span>
          <span>{bpm} BPM</span>
        </div>
        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full h-1 bg-[#353534] rounded-full appearance-none cursor-pointer accent-[#ffd183]"
        />
      </div>
    </section>
  );
}

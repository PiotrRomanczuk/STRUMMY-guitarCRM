'use client';

import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <section className="mt-auto flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
          Playback
        </h3>
      </div>

      <button
        onClick={onTogglePlayback}
        className={cn(
          'w-full py-2.5 rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 transition-all',
          isPlaying
            ? 'bg-primary/10 border border-primary/30 text-primary'
            : 'bg-foreground text-background'
        )}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {isPlaying ? 'Stop' : 'Play scale'}
      </button>

      <div>
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground mb-1">
          <span>BPM</span>
          <span className="text-foreground">{bpm}</span>
        </div>
        <input
          type="range"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-primary"
        />
      </div>
    </section>
  );
}

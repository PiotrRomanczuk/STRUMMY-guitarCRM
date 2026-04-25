'use client';

import { SCALE_DEFINITIONS } from '@/lib/music-theory/scales';
import { type DisplayMode } from '@/components/fretboard/useFretboard';
import { cn } from '@/lib/utils';

const QUICK_SCALES = [
  { key: 'major', label: 'Major' },
  { key: 'natural_minor', label: 'Minor' },
  { key: 'pentatonic_minor', label: 'Pentatonic' },
  { key: 'blues', label: 'Blues' },
] as const;

interface SidebarScaleSectionProps {
  scaleKey: string;
  displayMode: DisplayMode;
  onScaleChange: (key: string) => void;
  onModeChange: (mode: DisplayMode) => void;
}

export function SidebarScaleSection({
  scaleKey,
  displayMode,
  onScaleChange,
  onModeChange,
}: SidebarScaleSectionProps) {
  const handleScaleSelect = (key: string) => {
    if (displayMode !== 'scale') onModeChange('scale');
    onScaleChange(key);
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
        Scale
      </h3>

      {/* Quick picks */}
      <div className="grid grid-cols-2 gap-1">
        {QUICK_SCALES.map(({ key, label }) => {
          const isActive = displayMode === 'scale' && scaleKey === key;
          return (
            <button
              key={key}
              onClick={() => handleScaleSelect(key)}
              className={cn(
                'px-2.5 py-[7px] rounded-lg text-xs font-medium text-left transition-all',
                isActive
                  ? 'bg-primary/10 border border-primary/30 text-primary'
                  : 'border border-border text-foreground/70 hover:bg-muted'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Full dropdown */}
      <select
        value={scaleKey}
        onChange={(e) => handleScaleSelect(e.target.value)}
        className="w-full px-2.5 py-[7px] rounded-lg border border-border bg-card text-foreground/80 text-xs font-sans cursor-pointer"
      >
        {Object.entries(SCALE_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.name}</option>
        ))}
      </select>
    </section>
  );
}

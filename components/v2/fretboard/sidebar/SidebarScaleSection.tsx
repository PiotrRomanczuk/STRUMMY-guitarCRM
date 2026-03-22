'use client';

import { SCALE_DEFINITIONS } from '@/lib/music-theory/scales';
import { type DisplayMode } from '@/components/fretboard/useFretboard';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

/** Subset of scales to show as quick-select buttons */
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
    <section className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
        Scale
      </h3>
      <div className="flex flex-col gap-1">
        {QUICK_SCALES.map(({ key, label }) => {
          const isActive = displayMode === 'scale' && scaleKey === key;
          return (
            <button
              key={key}
              onClick={() => handleScaleSelect(key)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#ffd183] text-[#422c00]'
                  : 'text-[#d5c4ad] hover:bg-[#353534]'
              }`}
            >
              {label}
              {isActive && <MaterialIcon icon="check" className="text-sm" />}
            </button>
          );
        })}
      </div>

      {/* Full scale select for advanced scales */}
      <select
        value={scaleKey}
        onChange={(e) => handleScaleSelect(e.target.value)}
        className="w-full bg-[#0e0e0e] text-[#e5e2e1] border-0 px-4 py-3 rounded-lg text-sm mt-2"
      >
        {Object.entries(SCALE_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.name}</option>
        ))}
      </select>
    </section>
  );
}

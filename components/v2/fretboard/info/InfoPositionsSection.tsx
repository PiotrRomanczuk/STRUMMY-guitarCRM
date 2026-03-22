'use client';

import { type CAGEDShape } from '@/components/fretboard/caged.helpers';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

const CAGED_SHAPES: CAGEDShape[] = ['C', 'A', 'G', 'E', 'D'];

interface InfoPositionsSectionProps {
  cagedShape: CAGEDShape | 'all' | 'none';
  onCagedShapeChange: (shape: CAGEDShape | 'all' | 'none') => void;
}

export function InfoPositionsSection({
  cagedShape,
  onCagedShapeChange,
}: InfoPositionsSectionProps) {
  const handleToggle = (shape: CAGEDShape) => {
    if (cagedShape === shape) {
      onCagedShapeChange('none');
    } else {
      onCagedShapeChange(shape);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-[#9d8f7a] font-semibold">
          Positions
        </h3>
        <span className="text-[10px] text-[#ffd183] bg-[#ffd183]/10 px-2 py-0.5 rounded font-bold uppercase">
          CAGED
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {CAGED_SHAPES.map((shape, i) => {
          const isActive = cagedShape === shape || cagedShape === 'all';
          return (
            <button
              key={shape}
              onClick={() => handleToggle(shape)}
              className="flex items-center justify-between p-3 bg-[#201f1f] hover:bg-[#353534] rounded-lg text-sm text-left group transition-all"
            >
              <span className="text-[#e5e2e1]">Position {i + 1} ({shape})</span>
              <MaterialIcon
                icon={isActive ? 'visibility' : 'visibility_off'}
                className={`text-base transition-colors ${
                  isActive ? 'text-[#ffd183]' : 'text-[#9d8f7a] group-hover:text-[#ffd183]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

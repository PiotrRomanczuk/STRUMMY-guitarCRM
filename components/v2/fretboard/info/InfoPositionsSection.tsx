'use client';

import { type CAGEDShape } from '@/components/fretboard/caged.helpers';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

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
    onCagedShapeChange(cagedShape === shape ? 'none' : shape);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
          CAGED positions
        </h3>
        <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">
          CAGED
        </span>
      </div>
      <div className="flex gap-1">
        {CAGED_SHAPES.map((shape) => {
          const isActive = cagedShape === shape || cagedShape === 'all';
          return (
            <button
              key={shape}
              onClick={() => handleToggle(shape)}
              className={cn(
                'flex-1 py-2.5 rounded-md text-center font-serif text-[15px] font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground/80 hover:bg-muted'
              )}
            >
              {shape}
            </button>
          );
        })}
      </div>
    </section>
  );
}

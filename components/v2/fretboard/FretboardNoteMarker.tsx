'use client';

import { useState, useCallback } from 'react';

interface FretboardNoteMarkerProps {
  noteText: string;
  isHighlighted: boolean;
  isRoot: boolean;
  leftPercent: number;
  onClick: () => void;
}

export function FretboardNoteMarker({
  noteText,
  isHighlighted,
  isRoot,
  leftPercent,
  onClick,
}: FretboardNoteMarkerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    onClick();
    setTimeout(() => setIsAnimating(false), 300);
  }, [onClick]);

  const sizeClass = isRoot
    ? 'w-8 h-8 ring-4 ring-[#201f1f] shadow-xl'
    : isHighlighted
      ? 'w-6 h-6 ring-2 ring-[#201f1f]'
      : 'w-5 h-5';

  const colorClass = isRoot
    ? 'bg-[#f2b127] text-[#422c00] font-bold'
    : isHighlighted
      ? 'bg-[#ffd183]/80 text-[#422c00] font-bold'
      : 'bg-[#353534] text-[#d5c4ad]';

  const textSize = isRoot ? 'text-xs' : isHighlighted ? 'text-[10px]' : 'text-[9px]';

  return (
    <button
      className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 ${sizeClass} ${colorClass} ${textSize} ${
        isAnimating ? 'scale-125' : 'scale-100 hover:scale-110'
      }`}
      style={{
        left: `${leftPercent}%`,
        transform: `translateX(-50%) translateY(-50%) ${isAnimating ? 'scale(1.25)' : ''}`,
        top: '50%',
      }}
      onClick={handleClick}
      type="button"
    >
      {noteText}
    </button>
  );
}

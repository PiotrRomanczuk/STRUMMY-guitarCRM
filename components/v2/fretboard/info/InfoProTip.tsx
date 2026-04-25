'use client';

import { Sparkles } from 'lucide-react';
import { type NoteName, formatNote, getScaleNotes } from '@/lib/music-theory';

interface InfoProTipProps {
  rootNote: NoteName;
  scaleKey: string;
  useFlats: boolean;
}

function getTip(rootNote: NoteName, scaleKey: string, useFlats: boolean): string {
  const note = formatNote(rootNote, useFlats);

  if (scaleKey === 'major') {
    const scaleNotes = getScaleNotes(rootNote, scaleKey);
    const relMinor = scaleNotes[5] ? formatNote(scaleNotes[5], useFlats) : 'A';
    return `The ${note} Major scale shares the same notes as ${relMinor} Minor. Try switching to explore relative theory.`;
  }

  if (scaleKey === 'pentatonic_minor') {
    return `The ${note} Minor Pentatonic is the most common scale for blues and rock soloing. Add the b5 to turn it into a Blues scale.`;
  }

  if (scaleKey === 'blues') {
    return `The blue note (b5) creates classic bluesy tension. Try bending into it from the 4th for an authentic sound.`;
  }

  if (scaleKey === 'natural_minor') {
    const scaleNotes = getScaleNotes(rootNote, scaleKey);
    const relMajor = scaleNotes[2] ? formatNote(scaleNotes[2], useFlats) : 'C';
    return `${note} Minor is the relative minor of ${relMajor} Major. They share all the same notes but start from different positions.`;
  }

  return `Practice this scale ascending and descending at a slow tempo. Focus on even note timing before increasing speed.`;
}

export function InfoProTip({ rootNote, scaleKey, useFlats }: InfoProTipProps) {
  const tip = getTip(rootNote, scaleKey, useFlats);

  return (
    <div className="mt-auto border border-dashed border-primary/30 bg-primary/5 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-primary font-medium">
          Pro tip
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-foreground/70 font-serif italic">
        {tip}
      </p>
    </div>
  );
}

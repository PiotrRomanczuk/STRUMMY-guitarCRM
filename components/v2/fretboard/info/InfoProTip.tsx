'use client';

import { type NoteName, formatNote, getScaleNotes } from '@/lib/music-theory';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface InfoProTipProps {
  rootNote: NoteName;
  scaleKey: string;
  useFlats: boolean;
}

/** Generate a contextual tip based on current scale */
function getTip(rootNote: NoteName, scaleKey: string, useFlats: boolean): string {
  const note = formatNote(rootNote, useFlats);

  if (scaleKey === 'major') {
    // Find relative minor (6th degree)
    const scaleNotes = getScaleNotes(rootNote, scaleKey);
    const relMinor = scaleNotes[5] ? formatNote(scaleNotes[5], useFlats) : 'A';
    return `The ${note} Major scale shares the same notes as ${relMinor} Minor. Try switching to the Minor scale to explore relative theory.`;
  }

  if (scaleKey === 'pentatonic_minor') {
    return `The ${note} Minor Pentatonic is the most common scale for blues and rock soloing. Add the b5 to turn it into a Blues scale.`;
  }

  if (scaleKey === 'blues') {
    return `The blue note (b5) creates that classic bluesy tension. Try bending into it from the 4th for an authentic sound.`;
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
    <div className="mt-auto p-4 bg-[#201f1f] rounded-xl flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <MaterialIcon icon="lightbulb" className="text-[#ffd183]" />
        <span className="text-xs font-bold text-[#e5e2e1]">Pro Tip</span>
      </div>
      <p className="text-[11px] leading-relaxed text-[#d5c4ad] italic">
        {tip}
      </p>
    </div>
  );
}

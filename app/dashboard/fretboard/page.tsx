import type { Metadata } from 'next';
import { FretboardExplorer } from '@/components/v2/fretboard';

export const metadata: Metadata = {
  title: 'Fretboard Explorer | Strummy',
  description: 'Explore scales, chords, and notes across the guitar fretboard with interactive audio.',
};

export default function FretboardPage() {
  return (
    <>
      {/* Material Symbols font for fretboard icons */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <FretboardExplorer />
    </>
  );
}

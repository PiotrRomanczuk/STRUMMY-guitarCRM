/**
 * chord-grid.test — ChordGrid must not silently substitute a wrong diagram
 * for an unrecognized chord name (docs-vs-implementation audit, finding #2).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChordGrid } from '@/components/songs/editorial/primitives';

describe('ChordGrid', () => {
  it('renders a known chord shape without the unknown-chord marker', () => {
    render(<ChordGrid name="G" />);
    const svg = screen.getByRole('img', { name: /chord diagram for g/i });
    expect(svg).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /no chord diagram available/i })).toBeNull();
    // A real shape renders at least one fret-dot circle.
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('renders an explicit unknown-chord placeholder for an unrecognized name, not the G shape', () => {
    render(<ChordGrid name="Csus4add9" />);
    const svg = screen.getByRole('img', { name: /no chord diagram available for csus4add9/i });
    expect(svg).toBeInTheDocument();
    // The placeholder says so plainly (the consuming card renders the chord
    // name itself — the SVG must not duplicate it).
    expect(screen.getByText('no chart')).toBeInTheDocument();
    // The unknown-chord placeholder has no fret dots — a real shape (like G's)
    // always renders at least one <circle> for a fretted note.
    expect(svg.querySelectorAll('circle')).toHaveLength(0);
  });
});

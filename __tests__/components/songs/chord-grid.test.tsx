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
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /no chord diagram available/i })).toBeNull();
  });

  it('renders an explicit unknown-chord placeholder for an unrecognized name, not the G shape', () => {
    render(<ChordGrid name="Csus4add9" />);
    const svg = screen.getByRole('img', { name: /no chord diagram available for csus4add9/i });
    expect(svg).toBeInTheDocument();
    expect(screen.getByText('Csus4add9')).toBeInTheDocument();
    // The unknown-chord placeholder has no fret dots — a real shape (like G's)
    // always renders at least one <circle> for a fretted note.
    expect(svg.querySelectorAll('circle')).toHaveLength(0);
  });
});

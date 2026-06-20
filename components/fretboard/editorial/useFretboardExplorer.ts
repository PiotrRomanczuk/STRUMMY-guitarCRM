'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { getScaleNotes, getChordNotes, type NoteName } from '@/lib/music-theory';

import {
  annotateBoard,
  parseStateFromSearch,
  stateToSearch,
  type FretMode,
  type FretState,
} from './fretboard.helpers';

const DEFAULT_STATE: FretState = {
  key: 'A',
  mode: 'scale',
  scaleKey: 'pentatonic_minor',
  chordKey: 'minor',
};

export interface ClickedCell {
  row: number;
  fret: number;
  note: NoteName;
}

export function useFretboardExplorer() {
  // Seed state from the URL on first render (consistent across SSR/hydration).
  const searchParams = useSearchParams();
  const initial = parseStateFromSearch(searchParams.toString(), DEFAULT_STATE);

  const [key, setKey] = useState<NoteName>(initial.key);
  const [mode, setMode] = useState<FretMode>(initial.mode);
  const [scaleKey, setScaleKey] = useState(initial.scaleKey);
  const [chordKey, setChordKey] = useState(initial.chordKey);
  const [useFlats, setUseFlats] = useState(false);
  const [showIntervals, setShowIntervals] = useState(false);
  const [hideNonScale, setHideNonScale] = useState(false);
  const [highlightRoot, setHighlightRoot] = useState(true);
  const [clicked, setClicked] = useState<ClickedCell | null>(null);

  // Persist state to the URL so the current view is shareable.
  useEffect(() => {
    const search = stateToSearch({ key, mode, scaleKey, chordKey });
    window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }, [key, mode, scaleKey, chordKey]);

  const activeNotes = useMemo<NoteName[]>(() => {
    if (mode === 'scale') return getScaleNotes(key, scaleKey);
    if (mode === 'chord') return getChordNotes(key, chordKey);
    return [];
  }, [mode, key, scaleKey, chordKey]);

  const board = useMemo(() => annotateBoard(key, activeNotes), [key, activeNotes]);

  const selectCell = useCallback((row: number, fret: number, note: NoteName) => {
    setClicked({ row, fret, note });
  }, []);

  return {
    key,
    setKey,
    mode,
    setMode,
    scaleKey,
    setScaleKey,
    chordKey,
    setChordKey,
    useFlats,
    setUseFlats,
    showIntervals,
    setShowIntervals,
    hideNonScale,
    setHideNonScale,
    highlightRoot,
    setHighlightRoot,
    clicked,
    selectCell,
    activeNotes,
    board,
  };
}

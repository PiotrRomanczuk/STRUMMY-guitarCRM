// Music theory engine for the Fretboard Explorer.
// Pure functions — no React, no side effects.

const CHROMATIC_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const CHROMATIC_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

// Canonical (sharp) index lookup — all internal math uses sharp names.
const NOTE_INDEX = Object.fromEntries(CHROMATIC_SHARP.map((n,i)=>[n,i]));
// Also accept flat names as input
CHROMATIC_FLAT.forEach((n,i) => { if (!(n in NOTE_INDEX)) NOTE_INDEX[n] = i; });

const noteAt = (i) => CHROMATIC_SHARP[((i % 12) + 12) % 12];
const formatNote = (note, useFlats) => {
  const i = NOTE_INDEX[note];
  return useFlats ? CHROMATIC_FLAT[i] : CHROMATIC_SHARP[i];
};

// ─── Tuning ────────────────────────────────────────────────
// Standard tuning, ordered string 6 (low E) → string 1 (high E).
// Index 0 = low E (bottom row visually), index 5 = high e (top row).
const TUNING = ['E','A','D','G','B','E'];
const TOTAL_FRETS = 15;

// Build a 6 × (TOTAL_FRETS+1) grid of note names (includes open = fret 0).
const buildFretboard = () => {
  return TUNING.map(openNote => {
    const openIdx = NOTE_INDEX[openNote];
    const row = [];
    for (let f = 0; f <= TOTAL_FRETS; f++) row.push(noteAt(openIdx + f));
    return row;
  });
};

// ─── Scales ────────────────────────────────────────────────
// Intervals in semitones from the root.
const SCALE_DEFINITIONS = {
  major:            { label:'Major',            intervals:[0,2,4,5,7,9,11],   formula:'W-W-H-W-W-W-H' },
  natural_minor:    { label:'Natural Minor',    intervals:[0,2,3,5,7,8,10],   formula:'W-H-W-W-H-W-W' },
  pentatonic_major: { label:'Pentatonic Major', intervals:[0,2,4,7,9],        formula:'W-W-W½-W-W½' },
  pentatonic_minor: { label:'Pentatonic Minor', intervals:[0,3,5,7,10],       formula:'W½-W-W-W½-W' },
  blues:            { label:'Blues',            intervals:[0,3,5,6,7,10],     formula:'W½-W-H-H-W½-W' },
  dorian:           { label:'Dorian',           intervals:[0,2,3,5,7,9,10],   formula:'W-H-W-W-W-H-W' },
  mixolydian:       { label:'Mixolydian',       intervals:[0,2,4,5,7,9,10],   formula:'W-W-H-W-W-H-W' },
  phrygian:         { label:'Phrygian',         intervals:[0,1,3,5,7,8,10],   formula:'H-W-W-W-H-W-W' },
  lydian:           { label:'Lydian',           intervals:[0,2,4,6,7,9,11],   formula:'W-W-W-H-W-W-H' },
  harmonic_minor:   { label:'Harmonic Minor',   intervals:[0,2,3,5,7,8,11],   formula:'W-H-W-W-H-W½-H' },
  melodic_minor:    { label:'Melodic Minor',    intervals:[0,2,3,5,7,9,11],   formula:'W-H-W-W-W-W-H' },
  chromatic:        { label:'Chromatic',        intervals:[0,1,2,3,4,5,6,7,8,9,10,11], formula:'H×12' },
};

// Interval name lookup (semitones → interval label relative to root).
const INTERVAL_NAMES = ['R','b2','2','b3','3','4','b5','5','b6','6','b7','7'];

const getScaleNotes = (root, scaleKey) => {
  const def = SCALE_DEFINITIONS[scaleKey];
  if (!def) return [];
  const rootIdx = NOTE_INDEX[root];
  return def.intervals.map(iv => noteAt(rootIdx + iv));
};

const getScaleIntervals = (scaleKey) => {
  const def = SCALE_DEFINITIONS[scaleKey];
  if (!def) return [];
  return def.intervals.map(iv => INTERVAL_NAMES[iv]);
};

// ─── Chords ────────────────────────────────────────────────
const CHORD_DEFINITIONS = {
  major: { label:'Major',   symbol:'',    intervals:[0,4,7] },
  minor: { label:'Minor',   symbol:'m',   intervals:[0,3,7] },
  dom7:  { label:'Dom 7',   symbol:'7',   intervals:[0,4,7,10] },
  maj7:  { label:'Maj 7',   symbol:'maj7',intervals:[0,4,7,11] },
  min7:  { label:'Min 7',   symbol:'m7',  intervals:[0,3,7,10] },
  sus2:  { label:'Sus 2',   symbol:'sus2',intervals:[0,2,7] },
  sus4:  { label:'Sus 4',   symbol:'sus4',intervals:[0,5,7] },
  dim:   { label:'Dim',     symbol:'°',   intervals:[0,3,6] },
  aug:   { label:'Aug',     symbol:'+',   intervals:[0,4,8] },
  power: { label:'Power 5', symbol:'5',   intervals:[0,7] },
  dim7:  { label:'Dim 7',   symbol:'°7',  intervals:[0,3,6,9] },
  add9:  { label:'Add 9',   symbol:'add9',intervals:[0,4,7,14] },
};

const getChordNotes = (root, chordKey) => {
  const def = CHORD_DEFINITIONS[chordKey];
  if (!def) return [];
  const rootIdx = NOTE_INDEX[root];
  return def.intervals.map(iv => noteAt(rootIdx + iv));
};

// ─── CAGED ─────────────────────────────────────────────────
// Each CAGED shape is defined by its root-note location offsets on the low-E
// open position. We find each shape's actual fret by matching the root note
// at the shape's "anchor" string.
//
// Simplification: each shape spans ~5 frets and is anchored by a specific
// root-fingering pattern. We store the anchor string (1-6, low-E=6) and the
// relative fret-span around that root.
//
// String indexing here: string index 0 = low E (6th string), 5 = high e (1st).

const CAGED_SHAPES = {
  // C-shape: root on A-string (index 1), shape spans -3..+0 relative to root
  C: { anchorString: 1, span: [-3, 1], rootOffsets: [[1,0],[3,0]] },
  // A-shape: root on A-string (index 1), spans 0..3
  A: { anchorString: 1, span: [0, 3],  rootOffsets: [[1,0],[3,2]] },
  // G-shape: root on low E (index 0), spans -3..0
  G: { anchorString: 0, span: [-3, 2], rootOffsets: [[0,0],[2,0],[5,3]] },
  // E-shape: root on low E, spans 0..3
  E: { anchorString: 0, span: [0, 3],  rootOffsets: [[0,0],[3,2],[5,0]] },
  // D-shape: root on D-string (index 2), spans 0..3
  D: { anchorString: 2, span: [0, 3],  rootOffsets: [[2,0],[4,3]] },
};

const CAGED_ORDER = ['C','A','G','E','D'];

// Find the lowest fret on a given string where a note appears (returns fret or -1).
const findNoteOnString = (fretboard, stringIdx, note, minFret = 0) => {
  const row = fretboard[stringIdx];
  for (let f = minFret; f <= TOTAL_FRETS; f++) {
    if (row[f] === note) return f;
  }
  return -1;
};

// Get active CAGED shape positions for a given root.
// Returns array of { shape, startFret, endFret, rootFret } sorted by startFret.
const getActiveCAGEDShapes = (root, fretboard) => {
  const canonicalRoot = noteAt(NOTE_INDEX[root]);
  const result = [];
  CAGED_ORDER.forEach(shape => {
    const def = CAGED_SHAPES[shape];
    // Find the first occurrence of the root on the anchor string within reasonable range.
    const rootFret = findNoteOnString(fretboard, def.anchorString, canonicalRoot, 0);
    if (rootFret < 0) return;
    const startFret = Math.max(0, rootFret + def.span[0]);
    const endFret   = Math.min(TOTAL_FRETS, rootFret + def.span[1]);
    if (endFret <= startFret) return;
    result.push({ shape, startFret, endFret, rootFret });
  });
  // sort by startFret
  result.sort((a,b) => a.startFret - b.startFret);
  return result;
};

// ─── Helpers for rendering ─────────────────────────────────

// Given a root + set of "active" notes (by canonical name), return info for
// each fretboard cell: { note, interval, isRoot, isActive }.
const annotateFretboard = (root, activeNotes) => {
  const fb = buildFretboard();
  const rootIdx = NOTE_INDEX[root];
  const canonicalActive = new Set(activeNotes.map(n => noteAt(NOTE_INDEX[n])));
  return fb.map(row => row.map(note => {
    const noteIdx = NOTE_INDEX[note];
    const semitones = ((noteIdx - rootIdx) % 12 + 12) % 12;
    return {
      note,
      interval: INTERVAL_NAMES[semitones],
      isRoot: note === noteAt(rootIdx),
      isActive: canonicalActive.has(note),
    };
  }));
};

// Diatonic chord qualities by scale degree (for major & natural minor).
const DIATONIC_QUALITIES = {
  major:         ['','m','m','','','m','°'],
  natural_minor: ['m','°','','m','m','',''],
  dorian:        ['m','m','','','m','°',''],
  mixolydian:    ['','m','°','','m','m',''],
  harmonic_minor:['m','°','+','m','','','°'],
};

const getDiatonicChords = (root, scaleKey) => {
  const qualities = DIATONIC_QUALITIES[scaleKey];
  if (!qualities) return [];
  const notes = getScaleNotes(root, scaleKey);
  return notes.slice(0, qualities.length).map((n, i) => ({
    root: n,
    quality: qualities[i],
    roman: ['I','ii','iii','IV','V','vi','vii°'][i], // display only, sign may differ
  }));
};

// Export
Object.assign(window, {
  CHROMATIC_SHARP, CHROMATIC_FLAT, NOTE_INDEX,
  TUNING, TOTAL_FRETS,
  SCALE_DEFINITIONS, CHORD_DEFINITIONS, INTERVAL_NAMES,
  CAGED_SHAPES, CAGED_ORDER,
  buildFretboard, noteAt, formatNote,
  getScaleNotes, getScaleIntervals,
  getChordNotes,
  getActiveCAGEDShapes,
  annotateFretboard,
  getDiatonicChords,
});

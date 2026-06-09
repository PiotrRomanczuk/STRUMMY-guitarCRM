import type { RelatedSong, SongDetailData, SongLearner } from './types';

export const SONG_DETAIL: SongDetailData = {
  id: 'sg-hc',
  title: 'Hotel California',
  author: 'Eagles',
  album: 'Hotel California',
  year: 1976,
  key: 'Bm',
  capo: 7,
  tempo: 75,
  timeSig: '4/4',
  level: 'Intermediate',
  duration: '6:30',
  tags: ['fingerpicking', 'arpeggio', 'iconic-intro', 'classic-rock'],
  chords: ['Bm', 'F#7', 'A', 'E', 'G', 'D', 'Em'],
  assignedTo: 4,
  inLibrarySince: 'Aug 2024',
  usedInLessons: 12,
  sections: [
    { name: 'Intro', bars: 8, chords: ['Bm', 'F#7', 'A', 'E', 'G', 'D', 'Em', 'F#7'] },
    {
      name: 'Verse 1',
      bars: 16,
      chords: [
        'Bm',
        'F#7',
        'A',
        'E',
        'G',
        'D',
        'Em',
        'F#7',
        'Bm',
        'F#7',
        'A',
        'E',
        'G',
        'D',
        'Em',
        'F#7',
      ],
    },
    { name: 'Chorus', bars: 8, chords: ['G', 'D', 'F#7', 'Bm', 'G', 'D', 'Em', 'F#7'] },
    {
      name: 'Verse 2',
      bars: 16,
      chords: [
        'Bm',
        'F#7',
        'A',
        'E',
        'G',
        'D',
        'Em',
        'F#7',
        'Bm',
        'F#7',
        'A',
        'E',
        'G',
        'D',
        'Em',
        'F#7',
      ],
    },
    { name: 'Solo', bars: 32, chords: ['Bm', 'F#7', 'A', 'E', 'G', 'D', 'Em', 'F#7'] },
    { name: 'Outro', bars: 8, chords: ['Bm', 'F#7', 'A', 'E', 'G', 'D', 'Em', 'F#7'] },
  ],
};

export const SONG_LEARNERS: SongLearner[] = [
  { studentIndex: 0, stage: 'started', mins: 42 },
  { studentIndex: 2, stage: 'with_author', mins: 128 },
  { studentIndex: 4, stage: 'mastered', mins: 240 },
  { studentIndex: 5, stage: 'remembered', mins: 76 },
];

export const RELATED_SONGS: RelatedSong[] = [
  { title: 'Wish You Were Here', author: 'Pink Floyd', songKey: 'G' },
  { title: 'Tears in Heaven', author: 'Eric Clapton', songKey: 'A' },
  { title: 'Landslide', author: 'Fleetwood Mac', songKey: 'C' },
];

// Intro tab notation — 8 measures × 6 strings
export const INTRO_TAB_MEASURES: string[][] = [
  ['—', '—', '—', '—', '—', '2'],
  ['—', '—', '—', '2', '3', '—'],
  ['—', '0', '—', '2', '—', '—'],
  ['—', '—', '3', '—', '—', '—'],
  ['—', '—', '—', '—', '—', '2'],
  ['—', '—', '—', '2', '3', '—'],
  ['—', '0', '—', '2', '—', '—'],
  ['—', '—', '3', '—', '—', '—'],
];

export const STRING_LABELS: string[] = ['e', 'B', 'G', 'D', 'A', 'E'];

import type { SongStatusKey } from '@/components/design-preview/lib/types';

export type SongSection = {
  name: string;
  bars: number;
  chords: string[];
};

export type SongDetailData = {
  id: string;
  title: string;
  author: string;
  album: string;
  year: number;
  key: string;
  capo: number;
  tempo: number;
  timeSig: string;
  level: string;
  duration: string;
  tags: string[];
  chords: string[];
  assignedTo: number;
  inLibrarySince: string;
  usedInLessons: number;
  sections: SongSection[];
};

export type LyricChord = { c: string; pos: number };

export type SongLearner = {
  studentIndex: number;
  stage: SongStatusKey;
  mins: number;
};

export type RelatedSong = {
  title: string;
  author: string;
  songKey: string;
};

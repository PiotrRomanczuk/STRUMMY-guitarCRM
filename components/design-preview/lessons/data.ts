import { STUDENTS } from '../lib/mock-data';

import type {
  LessonRecord,
  LessonSongLib,
  LessonStatusKey,
  LessonStatusMeta,
  LessonTeacher,
} from './types';

const SARAH: LessonTeacher = { id: 't1', name: 'Sarah Chen', avatar: 'SC', color: '#1a1613' };

export const LESSON_SONGS_LIB: LessonSongLib[] = [
  {
    id: 'sg-hc',
    title: 'Hotel California',
    author: 'Eagles',
    year: 1976,
    key: 'Bm',
    level: 'Intermediate',
  },
  {
    id: 'sg-bb',
    title: 'Blackbird',
    author: 'The Beatles',
    year: 1968,
    key: 'G',
    level: 'Intermediate',
  },
  { id: 'sg-ww', title: 'Wonderwall', author: 'Oasis', year: 1995, key: 'Em', level: 'Beginner' },
  {
    id: 'sg-ls',
    title: 'Landslide',
    author: 'Fleetwood Mac',
    year: 1975,
    key: 'C',
    level: 'Intermediate',
  },
  {
    id: 'sg-hr',
    title: 'House of the Rising Sun',
    author: 'Traditional',
    year: null,
    key: 'Am',
    level: 'Beginner',
  },
  {
    id: 'sg-wy',
    title: 'Wish You Were Here',
    author: 'Pink Floyd',
    year: 1975,
    key: 'G',
    level: 'Intermediate',
  },
  {
    id: 'sg-cg',
    title: 'Classical Gas',
    author: 'Mason Williams',
    year: 1968,
    key: 'Am',
    level: 'Advanced',
  },
  {
    id: 'sg-st',
    title: 'Scarborough Fair',
    author: 'Traditional',
    year: null,
    key: 'Am',
    level: 'Beginner',
  },
  {
    id: 'sg-gs',
    title: 'Greensleeves',
    author: 'Traditional',
    year: null,
    key: 'Am',
    level: 'Beginner',
  },
  {
    id: 'sg-mr',
    title: 'Mr. Tambourine Man',
    author: 'Bob Dylan',
    year: 1965,
    key: 'D',
    level: 'Beginner',
  },
  {
    id: 'sg-fm',
    title: 'F major barre drill',
    author: 'Technique',
    year: null,
    key: 'F',
    level: 'Beginner',
  },
  {
    id: 'sg-am',
    title: 'Am arpeggio exercise',
    author: 'Technique',
    year: null,
    key: 'Am',
    level: 'Beginner',
  },
  {
    id: 'sg-tr',
    title: 'Tears in Heaven',
    author: 'Eric Clapton',
    year: 1992,
    key: 'A',
    level: 'Intermediate',
  },
  {
    id: 'sg-bh',
    title: 'Before He Cheats',
    author: 'Carrie Underwood',
    year: 2005,
    key: 'F#m',
    level: 'Intermediate',
  },
];

export const LESSONS: LessonRecord[] = [
  {
    id: 'L-042',
    number: 42,
    title: 'Blackbird — right-hand drills',
    student: STUDENTS[0],
    teacher: SARAH,
    scheduledAt: '2026-04-23T16:00:00',
    duration: 45,
    status: 'scheduled',
    songs: [
      {
        songId: 'sg-bb',
        progress: 'started',
        note: 'Alternating bass is clean; melody on B string still hesitant.',
      },
      {
        songId: 'sg-ls',
        progress: 'remembered',
        note: 'Verse shape solid. Bridge transition loses tempo.',
      },
    ],
    notes:
      'Open with 10-min warmup on Em–G transitions. Blackbird: slow to 60 BPM, isolate pinch. End with Landslide bridge twice at tempo.',
    assignments: [
      {
        id: 'as1',
        title: 'Blackbird · bars 1–8 @ 60 BPM × 10 min/day',
        status: 'open',
        due: '2026-04-30',
      },
      { id: 'as2', title: 'Landslide · bridge at 80 BPM', status: 'open', due: '2026-04-30' },
    ],
  },
  {
    id: 'L-041',
    number: 41,
    title: 'Review · catch-up',
    student: STUDENTS[1],
    teacher: SARAH,
    scheduledAt: '2026-04-23T17:00:00',
    duration: 30,
    status: 'scheduled',
    songs: [{ songId: 'sg-ww', progress: 'to_learn', note: '' }],
    notes: 'Re-introduce D–Cadd9–G progression. Check capo position; last time he flipped 5→7.',
    assignments: [],
  },
  {
    id: 'L-040',
    number: 40,
    title: 'Barre chord intro',
    student: STUDENTS[2],
    teacher: SARAH,
    scheduledAt: '2026-04-23T18:30:00',
    duration: 45,
    status: 'scheduled',
    songs: [
      { songId: 'sg-hr', progress: 'started', note: '' },
      { songId: 'sg-fm', progress: 'to_learn', note: '' },
    ],
    notes: 'Am–C–D–F arpeggio at 80 BPM. Introduce F-shape barre. Spend 15 min on thumb position.',
    assignments: [],
  },
  {
    id: 'L-039',
    number: 39,
    title: '',
    student: STUDENTS[4],
    teacher: SARAH,
    scheduledAt: '2026-04-22T17:00:00',
    duration: 60,
    status: 'completed',
    songs: [
      {
        songId: 'sg-cg',
        progress: 'with_author',
        note: 'Intro section clean at 120. Pushing to 140 reveals timing slips in bar 14.',
      },
    ],
    notes: 'Strong session. Send metronome program for home practice.',
    assignments: [
      {
        id: 'as3',
        title: 'Classical Gas · intro at 140 BPM, 4 clean takes',
        status: 'open',
        due: '2026-04-29',
      },
    ],
  },
  {
    id: 'L-038',
    number: 38,
    title: 'Fingerpicking foundations',
    student: STUDENTS[0],
    teacher: SARAH,
    scheduledAt: '2026-04-21T16:00:00',
    duration: 45,
    status: 'completed',
    songs: [
      {
        songId: 'sg-bb',
        progress: 'started',
        note: 'First 8 bars from memory; struggles keeping bass steady under melody.',
      },
      { songId: 'sg-ls', progress: 'started', note: '' },
    ],
    notes: 'Breakthrough on PIMA pattern. Homework: 10 min/day, metronome at 60.',
    assignments: [
      { id: 'as4', title: 'PIMA drill, 10 min/day × 7 days', status: 'done', due: '2026-04-21' },
    ],
  },
  {
    id: 'L-037',
    number: 37,
    title: '',
    student: STUDENTS[5],
    teacher: SARAH,
    scheduledAt: '2026-04-21T19:00:00',
    duration: 45,
    status: 'completed',
    songs: [
      {
        songId: 'sg-wy',
        progress: 'started',
        note: 'Added to repertoire. Intro riff in progress.',
      },
    ],
    notes: '',
    assignments: [],
  },
  {
    id: 'L-036',
    number: 36,
    title: 'Make-up · cancelled',
    student: STUDENTS[3],
    teacher: SARAH,
    scheduledAt: '2026-04-20T17:30:00',
    duration: 30,
    status: 'cancelled',
    songs: [],
    notes: 'Student cancelled 2h before. Offered make-up slot Fri.',
    assignments: [],
  },
  {
    id: 'L-035',
    number: 35,
    title: 'Weekly · Emma',
    student: STUDENTS[0],
    teacher: SARAH,
    scheduledAt: '2026-04-16T16:00:00',
    duration: 45,
    status: 'completed',
    songs: [
      {
        songId: 'sg-bb',
        progress: 'to_learn',
        note: 'Introduced the piece. Played the recording, walked through form.',
      },
    ],
    notes: '',
    assignments: [],
  },
  {
    id: 'L-034',
    number: 34,
    title: '',
    student: STUDENTS[2],
    teacher: SARAH,
    scheduledAt: '2026-04-17T18:30:00',
    duration: 45,
    status: 'completed',
    songs: [{ songId: 'sg-hr', progress: 'started', note: '' }],
    notes: '',
    assignments: [],
  },
  {
    id: 'L-033',
    number: 33,
    title: '',
    student: STUDENTS[1],
    teacher: SARAH,
    scheduledAt: '2026-04-09T17:00:00',
    duration: 30,
    status: 'completed',
    songs: [{ songId: 'sg-ww', progress: 'to_learn', note: '' }],
    notes: '',
    assignments: [],
  },
  {
    id: 'L-032',
    number: 32,
    title: '',
    student: STUDENTS[4],
    teacher: SARAH,
    scheduledAt: '2026-04-18T17:00:00',
    duration: 60,
    status: 'completed',
    songs: [{ songId: 'sg-cg', progress: 'remembered', note: 'Pushing intro to 120. Clean.' }],
    notes: '',
    assignments: [],
  },
  {
    id: 'L-031',
    number: 31,
    title: '',
    student: STUDENTS[5],
    teacher: SARAH,
    scheduledAt: '2026-04-14T19:00:00',
    duration: 45,
    status: 'completed',
    songs: [{ songId: 'sg-wy', progress: 'to_learn', note: '' }],
    notes: '',
    assignments: [],
  },
];

export const LESSON_STATUS: Record<LessonStatusKey, LessonStatusMeta> = {
  scheduled: { label: 'Scheduled', color: 'var(--info)', tint: '#3a5a7d18' },
  in_progress: { label: 'In progress', color: 'var(--gold-2)', tint: '#c8952322' },
  completed: { label: 'Completed', color: 'var(--success)', tint: '#3a7d3a18' },
  cancelled: { label: 'Cancelled', color: 'var(--ink-4)', tint: 'var(--rule-2)' },
};

export const songById = (id: string): LessonSongLib => {
  const found = LESSON_SONGS_LIB.find((s) => s.id === id);
  if (!found) {
    return { id, title: 'Unknown song', author: '—', year: null, key: '—', level: 'Beginner' };
  }
  return found;
};

export const formatLessonDate = (
  iso: string
): { mon: string; day: number; year: number; wday: string } => {
  const d = new Date(iso);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    d.getMonth()
  ];
  return {
    mon,
    day: d.getDate(),
    year: d.getFullYear(),
    wday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
  };
};

export const formatLessonTime = (iso: string): string => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
};

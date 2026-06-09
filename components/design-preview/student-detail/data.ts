import type {
  DateParts,
  RepertoireSong,
  SongRef,
  StudentAssignmentCard,
  StudentLesson,
  TeacherNote,
} from './types';

export const SONG_LIB: SongRef[] = [
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
    id: 'sg-fm',
    title: 'F major barre drill',
    author: 'Technique',
    year: null,
    key: 'F',
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
];

export const STUDENT_LESSONS: StudentLesson[] = [
  {
    id: 'L-042',
    number: 42,
    title: 'Blackbird — right-hand drills',
    studentId: 's1',
    scheduledAt: '2026-04-23T16:00:00',
    duration: 45,
    status: 'scheduled',
    songs: [
      { songId: 'sg-bb', progress: 'started' },
      { songId: 'sg-ls', progress: 'remembered' },
    ],
    notes:
      'Open with 10-min warmup on Em–G transitions. Blackbird: slow to 60 BPM, isolate pinch. End with Landslide bridge twice at tempo.',
    assignments: [],
  },
  {
    id: 'L-041',
    number: 41,
    title: 'Review · catch-up',
    studentId: 's2',
    scheduledAt: '2026-04-23T17:00:00',
    duration: 30,
    status: 'scheduled',
    songs: [{ songId: 'sg-ww', progress: 'to_learn' }],
    notes: 'Re-introduce D–Cadd9–G progression. Check capo position; last time he flipped 5→7.',
    assignments: [],
  },
  {
    id: 'L-038',
    number: 38,
    title: 'Fingerpicking foundations',
    studentId: 's1',
    scheduledAt: '2026-04-21T16:00:00',
    duration: 45,
    status: 'completed',
    songs: [
      { songId: 'sg-bb', progress: 'started' },
      { songId: 'sg-ls', progress: 'started' },
    ],
    notes: 'Breakthrough on PIMA pattern. Homework: 10 min/day, metronome at 60.',
    assignments: [],
  },
  {
    id: 'L-035',
    number: 35,
    title: 'Weekly · Emma',
    studentId: 's1',
    scheduledAt: '2026-04-16T16:00:00',
    duration: 45,
    status: 'completed',
    songs: [{ songId: 'sg-bb', progress: 'to_learn' }],
    notes: 'Introduced the piece. Played the recording, walked through form.',
    assignments: [],
  },
  {
    id: 'L-033',
    number: 33,
    title: 'Open chord refresher',
    studentId: 's2',
    scheduledAt: '2026-04-09T17:00:00',
    duration: 30,
    status: 'completed',
    songs: [{ songId: 'sg-ww', progress: 'to_learn' }],
    notes: 'Cycled D–G–Em–C at 60 BPM. Strumming hand still tense.',
    assignments: [],
  },
  {
    id: 'L-030',
    number: 30,
    title: 'Intro · first chords',
    studentId: 's2',
    scheduledAt: '2026-04-02T17:00:00',
    duration: 30,
    status: 'completed',
    songs: [{ songId: 'sg-ww', progress: 'to_learn' }],
    notes: 'Em, G, D shapes. Single-string picking warmup.',
    assignments: [],
  },
  {
    id: 'L-029',
    number: 29,
    title: 'Weekly · Emma',
    studentId: 's1',
    scheduledAt: '2026-04-09T16:00:00',
    duration: 45,
    status: 'completed',
    songs: [
      { songId: 'sg-ls', progress: 'remembered' },
      { songId: 'sg-ww', progress: 'mastered' },
    ],
    notes: 'Wonderwall officially in the mastered pile. Time for a new piece.',
    assignments: [],
  },
];

export const EMMA_REPERTOIRE: RepertoireSong[] = [
  { id: 'sg-bb', status: 'started', since: 'Apr 16', mins: 42 },
  { id: 'sg-ls', status: 'remembered', since: 'Mar 5', mins: 96 },
  { id: 'sg-ww', status: 'mastered', since: 'Feb 12', mins: 140 },
  { id: 'sg-hc', status: 'with_author', since: 'Mar 28', mins: 78 },
  { id: 'sg-tr', status: 'started', since: 'Apr 8', mins: 22 },
];

export const CARLOS_REPERTOIRE: RepertoireSong[] = [
  { id: 'sg-ww', status: 'to_learn', since: 'Apr 2', mins: 14 },
  { id: 'sg-hr', status: 'to_learn', since: 'Mar 18', mins: 8 },
  { id: 'sg-fm', status: 'to_learn', since: 'Mar 12', mins: 6 },
];

export const EMMA_NOTES: TeacherNote[] = [
  {
    date: 'Apr 21',
    text: 'Fingerpicking really clicked today — the PIMA drill went from struggle to second-nature in three weeks. Next: introduce travis picking in May.',
  },
  {
    date: 'Apr 7',
    text: 'Mom mentioned recital interest. Worth bringing up Sonata Op. 5 in a few months once barre is solid.',
  },
  {
    date: 'Mar 24',
    text: 'Tends to rush bridge sections. Drill with click track.',
  },
];

export const CARLOS_NOTES: TeacherNote[] = [
  {
    date: 'Apr 14',
    text: 'Two cancellations in a row. Sent a friendly check-in email. He answered: "swamped at work" — offered a make-up slot.',
  },
  {
    date: 'Apr 1',
    text: 'Loses focus around the 20-minute mark. Try shorter, more varied segments next session.',
  },
  {
    date: 'Mar 18',
    text: 'Brought up Wonderwall as motivation. Use it as a long-term anchor song to keep him engaged.',
  },
];

export const EMMA_ASSIGNMENTS: StudentAssignmentCard[] = [
  {
    title: 'Blackbird · bars 1–8 @ 60 BPM × 10 min/day',
    due: 'Apr 30',
    daysLeft: 7,
    status: 'open',
  },
  { title: 'Landslide · bridge at 80 BPM', due: 'Apr 30', daysLeft: 7, status: 'open' },
  { title: 'PIMA drill, 10 min/day × 7 days', due: 'Apr 21', daysLeft: -2, status: 'done' },
];

export const CARLOS_ASSIGNMENTS: StudentAssignmentCard[] = [
  {
    title: 'D–G–Em–C cycle · 10 min/day with metronome at 60',
    due: 'Apr 22',
    daysLeft: -1,
    status: 'open',
  },
  {
    title: 'Wonderwall intro · learn first 4 bars by ear',
    due: 'Apr 30',
    daysLeft: 7,
    status: 'open',
  },
  {
    title: 'Single-string picking warmup, 5 min/day',
    due: 'Apr 9',
    daysLeft: -14,
    status: 'done',
  },
];

export const EMMA_TRENDS = {
  thisWeek: '3h 40m',
  thisWeekSub: '+22%',
  thisWeekUp: true,
  dailyAvg: '32m',
  dailyAvgSub: 'vs goal: 30m',
  dailyAvgUp: true,
  longest: '58m',
  longestSub: 'Sun Apr 13',
  mostPlayed: 'Blackbird',
  mostPlayedSub: '42m last 30d',
  skipped: '6',
  skippedSub: '-4 vs prev',
  skippedUp: true,
};

export const CARLOS_TRENDS = {
  thisWeek: '0h 12m',
  thisWeekSub: '-78%',
  thisWeekUp: false,
  dailyAvg: '4m',
  dailyAvgSub: 'vs goal: 20m',
  dailyAvgUp: false,
  longest: '18m',
  longestSub: 'Tue Apr 1',
  mostPlayed: 'Wonderwall',
  mostPlayedSub: '14m last 30d',
  skipped: '22',
  skippedSub: '+9 vs prev',
  skippedUp: false,
};

export type StudentExtra = {
  joined: string;
  email: string;
  phone: string;
  timezone: string;
  parentName: string;
  parentEmail: string;
  billing: string;
  focusSong: string;
  focusSubcopy: string;
  practiceTotal30d: string;
  practiceTrend: string;
  practiceTrendUp: boolean;
  repertoire: RepertoireSong[];
  notes: TeacherNote[];
  assignments: StudentAssignmentCard[];
};

export const STUDENT_EXTRAS: Record<string, StudentExtra> = {
  s1: {
    joined: 'Student since Mar 2024',
    email: 'emma@gmail.com',
    phone: '(415) 555-1137',
    timezone: 'PT (San Francisco)',
    parentName: 'Jenny Johnson',
    parentEmail: 'jenny@example.com',
    billing: '$45 / 45m · Monthly invoice',
    focusSong: 'Blackbird',
    focusSubcopy: 'On fret 1. Next milestone: play through 1–8 from memory.',
    practiceTotal30d: '14h 22m',
    practiceTrend: '+18% vs prev',
    practiceTrendUp: true,
    repertoire: EMMA_REPERTOIRE,
    notes: EMMA_NOTES,
    assignments: EMMA_ASSIGNMENTS,
  },
  s2: {
    joined: 'Student since Oct 2025',
    email: 'carlos@gmail.com',
    phone: '(415) 555-1274',
    timezone: 'PT (San Francisco)',
    parentName: 'Maria Reyes',
    parentEmail: 'maria@example.com',
    billing: '$35 / 30m · Monthly invoice',
    focusSong: 'Wonderwall',
    focusSubcopy: 'Still on fret 0. Goal: get the intro chord cycle clean.',
    practiceTotal30d: '1h 48m',
    practiceTrend: '-62% vs prev',
    practiceTrendUp: false,
    repertoire: CARLOS_REPERTOIRE,
    notes: CARLOS_NOTES,
    assignments: CARLOS_ASSIGNMENTS,
  },
};

export function songById(id: string): SongRef {
  const found = SONG_LIB.find((s) => s.id === id);
  if (found) return found;
  return { id, title: id, author: '', year: null, key: '—', level: '—' };
}

export function formatLessonDate(iso: string): DateParts {
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
}

export function formatLessonTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}

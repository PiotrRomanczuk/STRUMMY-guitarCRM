import type { OnboardStep, LevelOption, GoalOption, TeachTag } from './types';

export const ONB_TEACHER_STEPS: OnboardStep[] = [
  { title: 'About you', sub: 'Name, instrument, experience' },
  { title: 'Your studio', sub: 'Name, location, branding' },
  { title: 'Invite students', sub: 'Bulk via CSV or email' },
  { title: 'Schedule first lesson', sub: 'We’ll send the invite' },
  { title: 'Done', sub: 'You’re ready to teach' },
];

export const ONB_STUDENT_STEPS: OnboardStep[] = [
  { title: 'Who are you?', sub: 'Just your name & age' },
  { title: 'Your guitar journey', sub: 'Level & what you want to do' },
  { title: 'Schedule', sub: 'When you can practice' },
  { title: 'Done', sub: 'See your first lesson plan' },
];

export const TEACH_TAGS: TeachTag[] = [
  { label: 'Acoustic', on: true },
  { label: 'Electric', on: true },
  { label: 'Classical', on: true },
  { label: 'Bass', on: false },
  { label: 'Ukulele', on: false },
  { label: 'Theory', on: true },
  { label: 'Songwriting', on: false },
];

export const LESSON_LENGTHS: number[] = [30, 45, 60, 90];

export const LEVEL_OPTIONS: LevelOption[] = [
  { k: 'beginner', title: 'New to guitar', sub: 'Open chords coming together' },
  { k: 'novice', title: 'A few months in', sub: 'C–G–D feel natural' },
  { k: 'intermediate', title: 'Confident', sub: 'Songs from memory · barre chords' },
  { k: 'advanced', title: 'Many years in', sub: 'Improvising · complex pieces' },
];

export const GOAL_OPTIONS: GoalOption[] = [
  { k: 'classics', label: 'Learn classic songs' },
  { k: 'fingerstyle', label: 'Fingerstyle / classical' },
  { k: 'songwriting', label: 'Write my own songs' },
  { k: 'theory', label: 'Understand theory' },
  { k: 'perform', label: 'Play live / open mic' },
  { k: 'jam', label: 'Jam with friends' },
  { k: 'record', label: 'Record my playing' },
  { k: 'speed', label: 'Get faster / cleaner' },
];

export const PRACTICE_TARGETS: number[] = [10, 15, 20, 30, 45, 60];

export const PREVIEW_TAGS: string[] = ['Acoustic', 'Electric', 'Classical', 'Theory'];

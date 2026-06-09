import { STUDENTS } from '../lib/mock-data';

import type { Assignment, AssignmentStatusKey, AssignmentStatusStyle } from './types';

export const ASSIGNMENTS: Assignment[] = [
  {
    id: 'A-021',
    student: STUDENTS[0],
    song: 'Blackbird',
    task: 'Bars 1–8 @ 60 BPM × 10 min/day',
    goal: 'memorise',
    due: '2026-04-30',
    assignedAt: '2026-04-23',
    status: 'open',
    submitted: null,
    lastPractice: '2d ago',
    progress: 30,
  },
  {
    id: 'A-020',
    student: STUDENTS[2],
    song: 'House of the Rising Sun',
    task: 'Am–C–D–F at 80 BPM, 4 takes',
    due: '2026-04-28',
    assignedAt: '2026-04-21',
    status: 'open',
    submitted: null,
    lastPractice: '1d ago',
    progress: 55,
  },
  {
    id: 'A-019',
    student: STUDENTS[3],
    song: 'Mr. Tambourine Man',
    task: 'Verse rhythm — clean strumming, 3 min',
    due: '2026-04-25',
    assignedAt: '2026-04-19',
    status: 'overdue',
    submitted: null,
    lastPractice: '7d ago',
    progress: 10,
  },
  {
    id: 'A-018',
    student: STUDENTS[4],
    song: 'Classical Gas',
    task: 'Intro at 140 BPM, 4 clean takes',
    due: '2026-04-29',
    assignedAt: '2026-04-22',
    status: 'submitted',
    submitted: 'Apr 24',
    lastPractice: 'today',
    progress: 100,
  },
  {
    id: 'A-017',
    student: STUDENTS[0],
    song: 'PIMA drill',
    task: '10 min/day × 7 days',
    due: '2026-04-21',
    assignedAt: '2026-04-14',
    status: 'done',
    submitted: 'Apr 21',
    lastPractice: 'Apr 20',
    progress: 100,
  },
  {
    id: 'A-016',
    student: STUDENTS[2],
    song: 'F major barre drill',
    task: '15 min/day × 5 days',
    due: '2026-04-26',
    assignedAt: '2026-04-20',
    status: 'open',
    submitted: null,
    lastPractice: '3d ago',
    progress: 40,
  },
];

export const ASSIGNMENT_STATUS: Record<AssignmentStatusKey, AssignmentStatusStyle> = {
  open: { label: 'Open', color: 'var(--info)', tint: '#3a5a7d18' },
  submitted: { label: 'Submitted', color: 'var(--gold-2)', tint: 'var(--gold-tint)' },
  done: { label: 'Reviewed', color: 'var(--success)', tint: '#3a7d3a18' },
  overdue: { label: 'Overdue', color: 'var(--danger)', tint: '#b84a3a18' },
};

export const PRACTICE_LOG_MINUTES = [12, 18, 0, 15, 22, 8, 10];
export const PRACTICE_LOG_LABELS = ['Th', 'F', 'S', 'S', 'M', 'T', 'W'];

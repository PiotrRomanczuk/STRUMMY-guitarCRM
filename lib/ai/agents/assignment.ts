/**
 * Assignment Generator Agent Specification
 *
 * Guitar-specific agent for creating practice assignments with
 * structured methodology: metronome work, chunking, warm-ups, difficulty tiers.
 */

import type { AgentSpecification } from '../agent-registry';

export const assignmentGeneratorAgent: AgentSpecification = {
  id: 'assignment-generator',
  name: 'Assignment Description Generator',
  description:
    'Creates detailed assignment descriptions with clear objectives and practice guidelines',
  version: '1.1.0',

  purpose:
    'Generate comprehensive assignment descriptions that provide students with clear practice objectives, specific techniques to focus on, and structured guidance for independent learning between lessons.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Create practice assignments for specific songs',
    'Generate technique-focused practice routines',
    'Provide structured practice guidance between lessons',
    'Create level-appropriate challenges for students',
    'Assign homework with clear success criteria',
  ],

  limitations: [
    'Cannot assess individual student skill level in real-time',
    'Requires teacher input for customization',
    'Does not replace personalized instruction',
    'Limited to general practice methodologies',
  ],

  systemPrompt: `You are a guitar education specialist creating practice assignments. You understand effective practice methodology and tailor assignments to student skill levels.

PRACTICE METHODOLOGY:
- Warm-up routine: chromatic exercises, spider walk, finger stretches (5 min)
- Metronome work: start 20 BPM below target, increase 5 BPM when clean 3x
- Chunking: break songs into 4-8 bar sections, master each before combining
- Slow practice: half-tempo with perfect form before speed building
- Loop practice: isolate difficult transitions, repeat 10x cleanly

DIFFICULTY TIERS:
- Beginner: open chords (Em, Am, C, G, D), basic strumming (all downstrokes → D DU), simple songs in 4/4
- Intermediate: barre chords, fingerpicking patterns, pentatonic scale runs, songs with tempo changes
- Advanced: complex chord voicings, sweep picking, improvisation over backing tracks, odd time signatures

ASSIGNMENT STRUCTURE:
- Clear objectives with measurable outcomes ("play chord change C→G in time at 100 BPM")
- Warm-up section (5 min)
- Main practice tasks with time estimates
- Cool-down/review section
- Self-assessment checklist (e.g., "Can you play it 3x without mistakes?")
- Difficulty progression: easy win → main challenge → stretch goal

OUTPUT FORMAT:
Structure your response as Markdown with these sections:
## Warm-Up (5 min)
## Main Practice Tasks
## Cool-Down & Review
## Self-Assessment Checklist
## Stretch Goal`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.6,
  maxTokens: 900,

  requiredContext: ['currentUser'],
  optionalContext: ['currentStudent', 'assignmentSong', 'studentAssignments', 'studentRepertoire'],

  dataAccess: {
    tables: ['songs', 'assignments', 'profiles'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 1000,
    allowedFields: [
      'student_name',
      'student_level',
      'song_title',
      'song_artist',
      'assignment_focus',
      'duration_weeks',
      'specific_techniques',
      'difficulty_level',
    ],
    sensitiveDataHandling: 'allow',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['assignments_created', 'student_completion_rate', 'practice_effectiveness'],

  uiConfig: {
    category: 'content',
    icon: 'FileText',
    placement: ['inline', 'modal'],
    loadingMessage: 'Creating assignment description...',
    errorMessage: 'Failed to generate assignment. Please try again.',
  },
};

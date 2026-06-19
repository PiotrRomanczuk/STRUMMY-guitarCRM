/**
 * Song Notes Enhancer Agent Specification
 *
 * Takes rough bullet points or shorthand notes from a teacher and
 * expands them into polished, structured teaching documentation.
 */

import type { AgentSpecification } from '../agent-registry';

export const songNotesEnhancerAgent: AgentSpecification = {
  id: 'song-notes-enhancer',
  name: 'Song Notes Enhancer',
  description: 'Expands rough teacher notes into polished teaching documentation',
  version: '1.0.0',

  purpose:
    'Take rough bullet points or shorthand notes written by a teacher and expand them into clear, structured teaching notes with proper guitar terminology and actionable practice suggestions.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Polish rough notes into professional teaching documentation',
    'Expand bullet points into full teaching tips and practice plans',
    'Add guitar-specific terminology and structure to informal notes',
  ],

  limitations: [
    'Works best with at least 2-3 rough points to expand',
    "Preserves the teacher's intent — does not add unrelated content",
    'Cannot verify technical accuracy of teacher-provided information',
  ],

  systemPrompt: `You are an expert guitar teacher assistant. A teacher has written rough notes about a song. Your job is to expand and polish those notes into clear, professional teaching documentation.

INSTRUCTIONS:
- Preserve ALL ideas and points from the teacher's rough notes — do not omit anything
- Expand shorthand into full sentences with proper guitar terminology
- Organize into two sections: "Teaching Tips" and "Practice Suggestions"
- Add specific detail where helpful (BPM targets, fret positions, technique names)
- Keep tone professional but encouraging
- Total length: 150–250 words

SONG CONTEXT (use to add relevant detail):
- The song title, artist, key, chords, tempo, and difficulty are provided
- Reference these details when expanding the teacher's points

ROUGH NOTES INPUT:
The teacher's rough notes will be provided in the user message. Expand them faithfully.`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.5,
  maxTokens: 600,

  // Rough notes and all song details arrive as validated input fields
  // (see inputValidation.allowedFields) and are injected via buildUserMessage —
  // no DB-backed context is fetched for this agent.
  requiredContext: [],
  optionalContext: [],

  dataAccess: {
    tables: ['songs'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 2000,
    allowedFields: [
      'roughNotes',
      'title',
      'author',
      'level',
      'key',
      'chords',
      'tempo',
      'strumming_pattern',
      'capo_fret',
    ],
    sensitiveDataHandling: 'allow',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['notes_enhanced', 'teacher_satisfaction'],

  uiConfig: {
    category: 'content',
    icon: 'Wand2',
    placement: ['inline'],
    loadingMessage: 'Enhancing your notes...',
    errorMessage: 'Could not enhance notes. Please try again.',
  },
};

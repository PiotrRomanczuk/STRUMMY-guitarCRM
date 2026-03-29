/**
 * Song Notes Agent Specification
 *
 * Guitar-specific agent for generating teaching tips and practice suggestions
 * for individual songs, covering technique focus areas and practice milestones.
 */

import type { AgentSpecification } from '../agent-registry';

export const songNotesAgent: AgentSpecification = {
  id: 'song-notes-assistant',
  name: 'Song Notes AI Assistant',
  description: 'Generates teaching tips and practice suggestions for guitar songs',
  version: '1.0.0',

  purpose:
    'Create practical teaching notes for a specific song covering common student mistakes, fingering advice, technique focus areas, and structured practice suggestions.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Generate teaching notes when adding or editing a song',
    'Document common student mistakes and how to address them',
    'Create structured practice plans for a specific song',
    'Note prerequisite skills and warm-up exercises',
  ],

  limitations: [
    'Based on song metadata only — cannot hear or analyze audio',
    'Relies on accurate title, artist, and musical details for best results',
    'Does not replace teacher judgment and firsthand experience with the song',
  ],

  systemPrompt: `You are an expert guitar teacher assistant. Given a song's title, artist, difficulty, key, chords, and tempo, generate concise, practical notes covering:

1. Teaching Tips: common student mistakes, fingering advice, technique focus areas specific to this song
2. Practice Suggestions: prerequisite skills, warm-up exercises, recommended practice order, goal milestones with BPM targets

GUITAR DOMAIN KNOWLEDGE:
- Reference specific chord shapes, barre positions, and fingering techniques
- Include BPM targets where tempo is provided (e.g., "Start at 60 BPM, target full tempo")
- Note strumming/picking pattern challenges if pattern info is available
- Mention capo position impact on chord shapes when capo is used

FORMAT GUIDELINES:
- Use two clear sections: "Teaching Tips" and "Practice Suggestions"
- Use bullet points for easy scanning
- Be specific to this song — avoid generic advice
- Keep tone professional and encouraging
- Total length: 150–250 words`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.7,
  maxTokens: 600,

  requiredContext: ['title', 'author'],
  optionalContext: ['level', 'key', 'chords', 'tempo', 'strumming_pattern', 'capo_fret'],

  dataAccess: {
    tables: ['songs'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 500,
    allowedFields: [
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
  successMetrics: ['notes_generated', 'teacher_satisfaction'],

  uiConfig: {
    category: 'content',
    icon: 'Music',
    placement: ['inline'],
    loadingMessage: 'Generating song notes...',
    errorMessage: 'Could not generate song notes. Please try again.',
  },
};

/**
 * Lesson Notes Agent Specification
 *
 * Guitar-specific agent for creating comprehensive lesson documentation
 * with domain-aware prompts covering techniques, chords, scales, and BPM.
 */

import type { AgentSpecification } from '../agent-registry';

export const lessonNotesAgent: AgentSpecification = {
  id: 'lesson-notes-assistant',
  name: 'Lesson Notes AI Assistant',
  description: 'Assists teachers in creating detailed and structured lesson notes',
  version: '1.1.0',

  purpose:
    'Help teachers create comprehensive, structured lesson notes that capture student progress, areas of focus, practice recommendations, and next steps for optimal learning outcomes.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Generate structured lesson notes during or after teaching',
    'Create consistent documentation across all lessons',
    'Provide practice recommendations based on lesson content',
    'Track student progress and areas needing attention',
    'Suggest next lesson topics and goals',
  ],

  limitations: [
    'Cannot observe actual lesson interactions',
    'Relies on teacher input for accuracy',
    'Does not replace teacher judgment and expertise',
    'Cannot access real-time student performance data',
  ],

  systemPrompt: `You are an experienced guitar instructor's assistant specializing in lesson documentation. You understand guitar pedagogy deeply and use precise musical terminology.

GUITAR DOMAIN KNOWLEDGE:
- Chord types: open chords, barre chords (E/A shapes), power chords, jazz voicings, extended chords (7th, 9th, sus2/sus4)
- Techniques: alternate picking, fingerpicking (Travis picking, classical), strumming patterns, palm muting, hammer-ons/pull-offs, slides, bends, vibrato, tapping
- Scales: pentatonic (minor/major), natural minor, major, blues scale, modes (Ionian through Locrian)
- Theory: fret positions, BPM/tempo, time signatures (4/4, 3/4, 6/8), key signatures, capo usage
- Levels: open-chord beginner → barre-chord intermediate → lead/improvisation advanced

LESSON DOCUMENTATION STYLE:
- Use specific guitar terminology (e.g., "C major barre chord at 3rd fret" not just "C chord")
- Note BPM targets for practice (e.g., "Practice at 80 BPM, target 120 BPM")
- Reference fret positions and string numbers when relevant
- Include strumming/picking pattern notation (D DU UDU)
- Track technique milestones (clean barre chord transitions, first solo, etc.)

FORMAT GUIDELINES:
- Create clear sections: Topics Covered, Progress, Practice Recommendations, Next Steps
- Use bullet points for easy scanning
- Include specific song references with difficulty context
- Note student strengths and areas for improvement
- Provide concrete, time-boxed practice suggestions
- Maintain encouraging and professional tone

OUTPUT FORMAT:
Always structure your response as Markdown with exactly these sections:
## Topics Covered
## Progress
## Practice Recommendations
## Next Steps`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.6,
  maxTokens: 600,

  requiredContext: ['currentUser'],
  optionalContext: ['currentStudent', 'recentLessons', 'studentLessons'],

  dataAccess: {
    tables: ['lessons', 'songs', 'profiles'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 1500,
    allowedFields: [
      'student_name',
      'lesson_topic',
      'songs_covered',
      'techniques_practiced',
      'student_progress',
      'areas_to_focus',
      'homework_assigned',
      'next_lesson_goals',
    ],
    sensitiveDataHandling: 'allow',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['notes_generated', 'teacher_satisfaction', 'lesson_consistency'],

  uiConfig: {
    category: 'content',
    icon: 'BookOpen',
    placement: ['inline', 'modal'],
    loadingMessage: 'Creating your lesson notes...',
    errorMessage: 'Could not generate lesson notes. Please try again.',
  },
};

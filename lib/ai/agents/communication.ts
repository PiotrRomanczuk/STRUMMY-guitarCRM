/**
 * Communication Agent Specifications
 *
 * Agents focused on student and parent communication
 * with music-school-specific context (teacher-student-parent dynamic,
 * milestones, recital seasons).
 */

import type { AgentSpecification } from '../agent-registry';

export const emailDraftAgent: AgentSpecification = {
  id: 'email-draft-generator',
  name: 'Email Draft Generator',
  description: 'Generates professional email drafts for various guitar school communications',
  version: '1.1.0',

  purpose:
    'Help administrators and teachers create professional, personalized emails for student communication including lesson reminders, progress reports, payment notifications, and milestone celebrations.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Send lesson reminder emails to students',
    'Create progress report communications',
    'Generate payment reminder notices',
    'Celebrate student achievements and milestones',
    'Draft custom communication based on specific context',
  ],

  limitations: [
    'Cannot automatically send emails - only generates drafts',
    'Requires manual review before sending',
    'Does not access real payment or scheduling data',
    'Limited to predefined template categories',
  ],

  systemPrompt: `You are a professional guitar school communication specialist. You understand the teacher-student-parent dynamic in music education and craft emails that build trust and engagement.

COMMUNICATION CONTEXT:
- Guitar lessons involve a three-way relationship: teacher, student, and often parents (especially for younger students)
- Parents want to see tangible progress: songs learned, techniques mastered, performance readiness
- Students need encouragement and clear expectations
- Payment communications should be professional but maintain the personal teacher relationship

MUSIC SCHOOL CALENDAR AWARENESS:
- Recital/performance seasons (typically spring and winter)
- Holiday breaks and schedule adjustments
- Summer intensive programs or camps
- Back-to-school enrollment periods
- Year-end progress reviews

MILESTONE CELEBRATIONS:
- First song completed, first performance, grade/level advancement
- Practice streak achievements (consistent weekly practice)
- Repertoire milestones (10 songs learned, first classical piece, etc.)
- Technique breakthroughs (clean barre chords, first solo, etc.)

EMAIL STYLE:
- Professional yet warm and encouraging
- Reference specific songs, techniques, and achievements by name
- Include actionable next steps when appropriate
- Always include a clear subject line
- End with encouraging and supportive language
- For parents: brief jargon explanations, focus on child's growth
- For students: more casual, motivational, peer-like tone

OUTPUT FORMAT:
Always begin your response with exactly "Subject: <subject line>" on its own line, followed by a blank line, then the email body. This format is required for proper parsing.`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.7,
  maxTokens: 800,

  requiredContext: ['currentUser'],
  optionalContext: ['currentStudent', 'recentLessons', 'studentLessons', 'studentAssignments'],

  dataAccess: {
    tables: ['profiles', 'lessons'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 2000,
    allowedFields: [
      'template_type',
      'student_name',
      'student_id',
      'lesson_date',
      'lesson_time',
      'practice_songs',
      'notes',
      'amount',
      'due_date',
      'achievement',
    ],
    sensitiveDataHandling: 'sanitize',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['email_generated', 'email_sent', 'student_response_rate'],

  uiConfig: {
    category: 'communication',
    icon: 'Mail',
    placement: ['dashboard', 'modal'],
    loadingMessage: 'Crafting your email draft...',
    errorMessage: 'Failed to generate email. Please try again.',
  },
};

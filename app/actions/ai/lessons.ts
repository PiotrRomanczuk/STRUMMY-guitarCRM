'use server';

import { requireAIAuth } from '@/lib/ai/auth';
import {
  generateLessonNotesAgent,
  generatePostLessonSummaryAgent,
  extractAgentResult,
  formatAgentError,
  isAgentSuccess,
} from '@/lib/ai/agent-execution';
import { logger } from '@/lib/logger';
import { executeAgentStream, enforceRateLimit, saveAIGeneration } from './shared';

/**
 * Generate lesson notes with streaming
 */
export async function* generateLessonNotesStream(params: {
  studentName: string;
  studentId?: string;
  songTitle?: string;
  lessonFocus?: string;
  skillsWorked?: string;
  nextSteps?: string;
}) {
  const context = params.studentId ? { entityId: params.studentId, entityType: 'student' } : {};
  yield* executeAgentStream('lesson-notes-assistant', params, context, undefined, 'lesson_notes');
}

export async function generateLessonNotes(params: {
  studentName: string;
  songsCovered: string[];
  lessonTopic: string;
  duration?: number;
  teacherNotes?: string;
  previousNotes?: string;
}): Promise<{ success: boolean; notes: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'lesson-notes-assistant');

    const response = await generateLessonNotesAgent({
      student_name: params.studentName,
      lesson_topic: params.lessonTopic,
      songs_covered: params.songsCovered.join(', '),
      techniques_practiced: '', // Will be added to params in future
      student_progress: params.previousNotes || '',
      areas_to_focus: '', // Will be derived from context
      homework_assigned: '', // Will be specified in context
      next_lesson_goals: params.teacherNotes || '',
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'lesson_notes',
        agentId: 'lesson-notes-assistant',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, notes: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;
    const notes = String(result.content || result);

    saveAIGeneration({
      generationType: 'lesson_notes',
      agentId: 'lesson-notes-assistant',
      inputParams: params,
      outputContent: notes,
    });

    return { success: true, notes };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate lesson notes';
    logger.error('[AI] generateLessonNotes error:', error);
    saveAIGeneration({
      generationType: 'lesson_notes',
      agentId: 'lesson-notes-assistant',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, notes: '', error: errorMsg };
  }
}

/**
 * Generate post-lesson summary with streaming
 */
export async function* generatePostLessonSummaryStream(params: {
  studentName: string;
  studentId?: string;
  songTitle?: string;
  lessonDuration?: string;
  skillsWorked?: string;
  challengesNoted?: string;
  nextSteps?: string;
}) {
  const context = params.studentId ? { entityId: params.studentId, entityType: 'student' } : {};
  yield* executeAgentStream(
    'post-lesson-summary',
    params,
    context,
    undefined,
    'post_lesson_summary'
  );
}

export async function generatePostLessonSummary(params: {
  studentName: string;
  duration: number;
  songsPracticed: string[];
  newTechniques?: string[];
  struggles?: string[];
  successes?: string[];
  teacherNotes?: string;
}): Promise<{ success: boolean; summary: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'post-lesson-summary');

    const response = await generatePostLessonSummaryAgent({
      student_name: params.studentName,
      lesson_date: new Date().toLocaleDateString(),
      songs_practiced: params.songsPracticed.join(', '),
      techniques_covered: params.newTechniques?.join(', ') || '',
      achievements: params.successes?.join(', ') || '',
      challenges: params.struggles?.join(', ') || '',
      practice_recommendations: '', // Will be derived from context
      next_focus: params.teacherNotes || '',
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'post_lesson_summary',
        agentId: 'post-lesson-summary',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, summary: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;
    const summary = String(result.content || result);

    saveAIGeneration({
      generationType: 'post_lesson_summary',
      agentId: 'post-lesson-summary',
      inputParams: params,
      outputContent: summary,
    });

    return { success: true, summary };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to generate post-lesson summary';
    logger.error('[AI] generatePostLessonSummary error:', error);
    saveAIGeneration({
      generationType: 'post_lesson_summary',
      agentId: 'post-lesson-summary',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, summary: '', error: errorMsg };
  }
}

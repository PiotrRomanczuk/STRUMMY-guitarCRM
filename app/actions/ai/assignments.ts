'use server';

import { requireAIAuth } from '@/lib/ai/auth';
import {
  generateAssignmentAgent,
  extractAgentResult,
  formatAgentError,
  isAgentSuccess,
} from '@/lib/ai/agent-execution';
import { logger } from '@/lib/logger';
import { executeAgentStream, enforceRateLimit, saveAIGeneration } from './shared';

/**
 * Generate assignment with streaming
 */
export async function* generateAssignmentStream(params: {
  studentName: string;
  studentId?: string;
  skillLevel: string;
  focusArea: string;
  timeAvailable?: string;
  additionalNotes?: string;
}) {
  const context = params.studentId ? { entityId: params.studentId, entityType: 'student' } : {};
  yield* executeAgentStream('assignment-generator', params, context, undefined, 'assignment');
}

export async function generateAssignment(params: {
  studentName: string;
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  recentSongs: string[];
  focusArea: string;
  duration: string;
  lessonTopic?: string;
}): Promise<{ success: boolean; assignment: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'assignment-generator');

    const response = await generateAssignmentAgent({
      student_name: params.studentName,
      student_level: params.studentLevel,
      song_title: params.recentSongs[0] || '', // Use first recent song
      song_artist: '', // Not available in current params
      assignment_focus: params.focusArea,
      duration_weeks: params.duration,
      specific_techniques: params.lessonTopic || '',
      difficulty_level: params.studentLevel,
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'assignment',
        agentId: 'assignment-generator',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, assignment: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;
    const assignment = String(result.content || result);

    saveAIGeneration({
      generationType: 'assignment',
      agentId: 'assignment-generator',
      inputParams: params,
      outputContent: assignment,
    });

    return { success: true, assignment };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate assignment';
    logger.error('[AI] generateAssignment error:', error);
    saveAIGeneration({
      generationType: 'assignment',
      agentId: 'assignment-generator',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, assignment: '', error: errorMsg };
  }
}

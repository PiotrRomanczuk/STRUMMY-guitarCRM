'use server';

import { requireAIAuth } from '@/lib/ai/auth';
import {
  generateEmailDraftAgent,
  extractAgentResult,
  formatAgentError,
  isAgentSuccess,
} from '@/lib/ai/agent-execution';
import { logger } from '@/lib/logger';
import { executeAgentStream, enforceRateLimit, saveAIGeneration } from './shared';

/**
 * Generate email draft with streaming
 */
export async function* generateEmailDraftStream(params: {
  template_type: string;
  student_name: string;
  studentId?: string;
  context?: string;
  tone?: string;
  additional_info?: string;
}) {
  const context = params.studentId ? { entityId: params.studentId, entityType: 'student' } : {};
  yield* executeAgentStream('email-draft-generator', params, context, undefined, 'email_draft');
}

export async function generateEmailDraft(params: {
  templateType:
    | 'lesson_reminder'
    | 'progress_report'
    | 'payment_reminder'
    | 'milestone_celebration';
  studentName: string;
  context: Record<string, unknown>;
}): Promise<{ success: boolean; subject: string; body: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'email-draft-generator');

    const response = await generateEmailDraftAgent({
      template_type: params.templateType,
      student_name: params.studentName,
      student_id: String(params.context.student_id || ''),
      lesson_date: String(params.context.lesson_date || ''),
      lesson_time: String(params.context.lesson_time || ''),
      practice_songs: String(params.context.practice_songs || ''),
      notes: String(params.context.notes || ''),
      amount: String(params.context.amount || ''),
      due_date: String(params.context.due_date || ''),
      achievement: String(params.context.achievement || ''),
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'email_draft',
        agentId: 'email-draft-generator',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, subject: '', body: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;

    // Parse the AI response to extract subject and body
    const content = String(result.content || result);
    let subject = 'Generated Email';
    let body = content;

    // Look for subject line patterns
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = content.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
    }

    saveAIGeneration({
      generationType: 'email_draft',
      agentId: 'email-draft-generator',
      inputParams: params,
      outputContent: content,
    });

    return { success: true, subject, body };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate email draft';
    logger.error('[AI] generateEmailDraft error:', error);
    saveAIGeneration({
      generationType: 'email_draft',
      agentId: 'email-draft-generator',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, subject: '', body: '', error: errorMsg };
  }
}

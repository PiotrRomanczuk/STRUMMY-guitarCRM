'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * ai_messages.is_helpful feedback (AIA-2). The streaming chat generator
 * (app/actions/ai/core.ts) doesn't return the persisted assistant message's
 * id — the client asks for it separately once streaming completes, via
 * getLatestAssistantMessageId, rather than threading an id through the
 * text-chunk streaming protocol.
 */

export async function getLatestAssistantMessageId(conversationId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ai_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn('[ai-feedback] getLatestAssistantMessageId error', { error: error.message });
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}

export async function submitAIFeedback(
  messageId: string,
  isHelpful: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // RLS (update_own_messages) already scopes this to messages in
  // conversations the caller owns — no extra ownership check needed here.
  const { error } = await supabase
    .from('ai_messages')
    .update({ is_helpful: isHelpful })
    .eq('id', messageId);

  if (error) {
    logger.error('[ai-feedback] submitAIFeedback error', { error: error.message });
    return { success: false, error: 'Failed to save feedback' };
  }
  return { success: true };
}

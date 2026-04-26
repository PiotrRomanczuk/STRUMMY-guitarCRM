'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation, assertNotTestAccount } from '@/lib/auth/test-account-guard';
import type {
  AIConversation,
  AIConversationMessage,
  AIConversationFilters,
  AIConversationSummary,
  AIContextType,
} from '@/types/ai-conversation';
import { logger } from '@/lib/logger';

const DEFAULT_PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

// ── CRUD ─────────────────────────────────────────────────────────

export async function createConversation(params: {
  title?: string;
  modelId: string;
  contextType?: AIContextType;
  contextId?: string;
}): Promise<{ data?: AIConversation; error?: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  try {
    const userId = await getAuthUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: params.title ?? null,
        model_id: params.modelId,
        context_type: params.contextType ?? 'general',
        context_id: params.contextId ?? null,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data: data as AIConversation };
  } catch (err) {
    logger.error('[AI Conversations] create error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create conversation' };
  }
}

export async function listConversations(
  filters: AIConversationFilters = {}
): Promise<{ data: AIConversationSummary[]; total: number; error?: string }> {
  try {
    await getAuthUserId();
    const supabase = await createClient();

    const page = filters.page ?? 0;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('ai_conversations')
      .select('id, title, context_type, created_at, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (filters.isArchived !== undefined) {
      query = query.eq('is_archived', filters.isArchived);
    }
    if (filters.contextType) {
      query = query.eq('context_type', filters.contextType);
    }

    const { data, count, error } = await query;

    if (error) return { data: [], total: 0, error: error.message };
    return { data: (data as AIConversationSummary[]) ?? [], total: count ?? 0 };
  } catch (err) {
    logger.error('[AI Conversations] list error:', err);
    return { data: [], total: 0, error: err instanceof Error ? err.message : 'Failed to list conversations' };
  }
}

export async function getConversation(
  id: string
): Promise<{ data?: AIConversation & { messages: AIConversationMessage[] }; error?: string }> {
  try {
    await getAuthUserId();
    const supabase = await createClient();

    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('id, user_id, title, model_id, context_type, context_id, is_archived, created_at, updated_at')
      .eq('id', id)
      .single();

    if (convError) return { error: convError.message };

    const { data: messages, error: msgError } = await supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, model_id, tokens_used, latency_ms, is_helpful, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) return { error: msgError.message };

    return {
      data: {
        ...(conversation as AIConversation),
        messages: (messages as AIConversationMessage[]) ?? [],
      },
    };
  } catch (err) {
    logger.error('[AI Conversations] get error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to get conversation' };
  }
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<{ error?: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  try {
    await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  } catch (err) {
    logger.error('[AI Conversations] updateTitle error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to update title' };
  }
}

export async function archiveConversation(
  id: string,
  isArchived: boolean
): Promise<{ error?: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  try {
    await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('ai_conversations')
      .update({ is_archived: isArchived })
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  } catch (err) {
    logger.error('[AI Conversations] archive error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to archive conversation' };
  }
}

export async function deleteConversation(id: string): Promise<{ error?: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  try {
    await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    return {};
  } catch (err) {
    logger.error('[AI Conversations] delete error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to delete conversation' };
  }
}

export async function saveConversationMessages(params: {
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  modelId: string;
  tokensUsed?: number;
  latencyMs?: number;
}): Promise<{ error?: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  try {
    await getAuthUserId();
    const supabase = await createClient();

    const { error } = await supabase.from('ai_messages').insert([
      {
        conversation_id: params.conversationId,
        role: 'user' as const,
        content: params.userMessage,
      },
      {
        conversation_id: params.conversationId,
        role: 'assistant' as const,
        content: params.assistantMessage,
        model_id: params.modelId,
        tokens_used: params.tokensUsed ?? null,
        latency_ms: params.latencyMs ?? null,
      },
    ]);

    if (error) return { error: error.message };

    // Auto-title if this is the first message pair
    const { count } = await supabase
      .from('ai_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', params.conversationId);

    if (count !== null && count <= 2) {
      const shortTitle = params.userMessage.length > 60
        ? params.userMessage.slice(0, 57) + '...'
        : params.userMessage;
      await supabase
        .from('ai_conversations')
        .update({ title: shortTitle })
        .eq('id', params.conversationId);
    }

    return {};
  } catch (err) {
    logger.error('[AI Conversations] saveMessages error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to save messages' };
  }
}

export async function trackAIUsage(params: {
  modelId: string;
  tokensUsed?: number;
  latencyMs?: number;
  isError?: boolean;
}): Promise<void> {
  const { isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  try {
    const userId = await getAuthUserId();
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('ai_usage_stats')
      .select('id, request_count, total_tokens, total_latency_ms, error_count')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('model_id', params.modelId)
      .single();

    if (existing) {
      await supabase
        .from('ai_usage_stats')
        .update({
          request_count: existing.request_count + 1,
          total_tokens: existing.total_tokens + (params.tokensUsed ?? 0),
          total_latency_ms: existing.total_latency_ms + (params.latencyMs ?? 0),
          error_count: existing.error_count + (params.isError ? 1 : 0),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('ai_usage_stats').insert({
        user_id: userId,
        date: today,
        model_id: params.modelId,
        request_count: 1,
        total_tokens: params.tokensUsed ?? 0,
        total_latency_ms: params.latencyMs ?? 0,
        error_count: params.isError ? 1 : 0,
      });
    }
  } catch (err) {
    logger.error('[AI Usage] track error:', err);
  }
}

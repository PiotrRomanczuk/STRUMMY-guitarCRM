'use server';

import { getAIProvider, type AIMessage, type AIModelInfo } from '@/lib/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-models';
import { requireAIAuth } from '@/lib/ai/auth';
import {
  generateChatResponseAgent,
  extractAgentResult,
  formatAgentError,
  isAgentSuccess,
} from '@/lib/ai/agent-execution';
import { logger } from '@/lib/logger';
import { getConversation, saveConversationMessages, trackAIUsage } from '../ai-conversations';
import {
  enforceRateLimit,
  saveAIGeneration,
  getProviderAppropriateModel,
  createAIStreamFromProvider,
  getStreamText,
  getCreateOpenAICompatible,
} from './shared';

/**
 * Generate AI response with TRUE streaming support (SSE)
 * @param prompt - User's message
 * @param model - AI model to use
 * @param conversationId - Optional conversation ID for context
 * @param signal - Optional AbortSignal for cancellation
 */
// eslint-disable-next-line max-lines-per-function
export async function* generateAIResponseStream(
  prompt: string,
  model: string = DEFAULT_AI_MODEL,
  conversationId?: string,
  signal?: AbortSignal
) {
  const startMs = Date.now();
  let fullContent = '';

  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'ai-response-stream');

    const provider = await getAIProvider();
    const providerModel = await getProviderAppropriateModel(provider, model);

    const available = await provider.isAvailable();
    if (!available) {
      yield `Error: ${provider.name} is not available. Please check your configuration.`;
      return;
    }

    // Build system prompt with cross-session memory and tool awareness
    const systemContent =
      'You are a helpful assistant for the Guitar CRM admin dashboard. Keep your answers concise and relevant to managing a music school.\n\nYou have access to tools that can look up songs in the catalog, find student information, view lesson history, and check student repertoire. Use these tools when the teacher asks questions about specific students or songs.';

    const messages: AIMessage[] = [{ role: 'system', content: systemContent }];

    if (conversationId) {
      const { data: conv } = await getConversation(conversationId);
      if (conv?.messages.length) {
        const prior = conv.messages.slice(-20);
        for (const msg of prior) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }
    }

    messages.push({ role: 'user', content: prompt });

    // Use Vercel AI SDK with tool calling for the chat assistant
    const useToolCalling =
      process.env.AI_USE_VERCEL_SDK !== 'false' && !!process.env.OPENROUTER_API_KEY;

    if (useToolCalling) {
      const createOAICompat = await getCreateOpenAICompatible();
      const sdkStreamText = await getStreamText();
      const { chatTools: tools } = await import('@/lib/ai/tools');

      const sdkProvider = createOAICompat({
        name: 'openrouter',
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY!,
        headers: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
          'X-Title': 'Guitar CRM',
        },
      });

      const { stepCountIs } = await import('ai');

      const result = sdkStreamText({
        model: sdkProvider.chatModel(providerModel),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        tools,
        stopWhen: stepCountIs(3),
        abortSignal: signal,
      });

      for await (const chunk of result.textStream) {
        if (signal?.aborted) {
          yield `[Cancelled]`;
          return;
        }
        fullContent += chunk;
        yield fullContent;
      }
    } else {
      // Fallback: use generic provider (no tool calling)
      for await (const chunk of createAIStreamFromProvider(
        provider,
        { model: providerModel, messages, temperature: 0.7 },
        signal
      )) {
        if (signal?.aborted) {
          yield `[Cancelled]`;
          return;
        }
        fullContent = chunk;
        yield chunk;
      }
    }

    // Save generation after streaming completes
    const latencyMs = Date.now() - startMs;
    saveAIGeneration({
      generationType: 'chat',
      modelId: providerModel,
      provider: provider.name?.toLowerCase(),
      inputParams: { prompt },
      outputContent: fullContent,
    });

    // Persist conversation messages and track usage (fire-and-forget)
    if (conversationId) {
      saveConversationMessages({
        conversationId,
        userMessage: prompt,
        assistantMessage: fullContent,
        modelId: providerModel,
        latencyMs,
      }).catch((e) => logger.error('[AI] saveConversationMessages error:', e));
    }
    trackAIUsage({ modelId: providerModel, latencyMs }).catch((e) =>
      logger.error('[AI] trackAIUsage error:', e)
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate AI response.';
    saveAIGeneration({
      generationType: 'chat',
      inputParams: { prompt },
      outputContent: fullContent,
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    logger.error('[AI Stream] Error:', error);
    yield `Error: ${errorMsg}`;
  }
}

export async function generateAIResponse(
  prompt: string,
  model: string = DEFAULT_AI_MODEL
): Promise<{ content?: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'chat-assistant');

    const response = await generateChatResponseAgent({ prompt, model });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'chat',
        agentId: 'chat-assistant',
        modelId: model,
        inputParams: { prompt },
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown> | string;
    const content =
      typeof result === 'object' && result !== null
        ? String(result.content || '')
        : String(result || '');

    saveAIGeneration({
      generationType: 'chat',
      agentId: 'chat-assistant',
      modelId: model,
      inputParams: { prompt },
      outputContent: content,
    });

    return { content };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate AI response.';
    logger.error('[AI] generateAIResponse error:', error);
    saveAIGeneration({
      generationType: 'chat',
      agentId: 'chat-assistant',
      inputParams: { prompt },
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { error: errorMsg };
  }
}

/**
 * Get available AI models from the current provider
 */
export async function getAvailableModels(): Promise<{
  models?: AIModelInfo[];
  providerName?: string;
  error?: string;
}> {
  try {
    await requireAIAuth();

    const provider = await getAIProvider();
    const models = await provider.listModels();

    return {
      models,
      providerName: provider.name,
    };
  } catch (error) {
    logger.error('[AI] Failed to fetch models:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch available models.',
    };
  }
}

/* eslint-disable max-lines */
/**
 * Shared internal helpers for the AI server actions.
 *
 * NOT a `'use server'` module — these are plain async helpers reused by the
 * per-domain action files in this directory. (A `'use server'` module may only
 * export server actions, so internal plumbing lives here.)
 */
import { getAIProvider, isAIError, type AIMessage, type AIProvider } from '@/lib/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-models';
import { getAgent, prepareContext, buildSystemPrompt, buildUserMessage } from '@/lib/ai/registry';
import type { AgentContext } from '@/lib/ai/registry';
import { mapToOllamaModel } from '@/lib/ai/model-mappings';
import { requireAIAuth } from '@/lib/ai/auth';
import { checkRateLimit } from '@/lib/ai/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import type { AIGenerationType } from '@/types/ai-generation';
import { logger } from '@/lib/logger';

// Vercel AI SDK imports are lazy to avoid TransformStream issues in Jest
let _streamText: typeof import('ai').streamText | null = null;
let _createOpenAICompatible:
  | typeof import('@ai-sdk/openai-compatible').createOpenAICompatible
  | null = null;

export async function getStreamText() {
  if (!_streamText) {
    const mod = await import('ai');
    _streamText = mod.streamText;
  }
  return _streamText;
}

export async function getCreateOpenAICompatible() {
  if (!_createOpenAICompatible) {
    const mod = await import('@ai-sdk/openai-compatible');
    _createOpenAICompatible = mod.createOpenAICompatible;
  }
  return _createOpenAICompatible;
}

/**
 * Enforce rate limits for a given user and agent.
 */
export async function enforceRateLimit(
  user: { id: string; role: 'admin' | 'teacher' | 'student' | 'anonymous' },
  agentId: string
) {
  const result = await checkRateLimit(user.id, user.role, agentId);
  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`);
  }
}

/**
 * Fire-and-forget save of AI generation to the database.
 * Never throws, never blocks the generation flow.
 */
export async function saveAIGeneration(data: {
  generationType: AIGenerationType;
  agentId?: string;
  modelId?: string;
  provider?: string;
  inputParams: Record<string, unknown>;
  outputContent: string;
  isSuccessful?: boolean;
  errorMessage?: string;
  contextEntityType?: string;
  contextEntityId?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: data.generationType,
      agent_id: data.agentId ?? null,
      model_id: data.modelId ?? null,
      provider: data.provider ?? null,
      input_params: data.inputParams,
      output_content: data.outputContent,
      is_successful: data.isSuccessful ?? true,
      error_message: data.errorMessage ?? null,
      context_entity_type: data.contextEntityType ?? null,
      context_entity_id: data.contextEntityId ?? null,
    });
  } catch (err) {
    logger.error('[AI] Failed to save generation:', err);
  }
}

/**
 * Unified streaming abstraction for all AI functions (LEGACY - fake streaming)
 * @deprecated Use createAIStreamFromProvider for true streaming
 */
export async function* createAIStream(
  content: string,
  options: {
    delayMs?: number;
    chunkSize?: number;
  } = {}
) {
  const { delayMs = 50, chunkSize = 1 } = options;

  if (!content || typeof content !== 'string') {
    yield 'No content generated.';
    return;
  }

  const words = content.split(' ');

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(0, i + chunkSize).join(' ');
    yield chunk;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Create a streaming response from an AI provider with true SSE streaming
 * Falls back to fake streaming if provider doesn't support completeStream()
 */
export async function* createAIStreamFromProvider(
  provider: AIProvider,
  request: {
    model: string;
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
  },
  signal?: AbortSignal
) {
  // Check if provider supports true streaming
  if (provider.completeStream && typeof provider.completeStream === 'function') {
    // Use true SSE streaming
    let fullContent = '';

    try {
      for await (const chunk of provider.completeStream(request, signal)) {
        // Accumulate content
        if (chunk.content) {
          fullContent += chunk.content;
          yield fullContent; // Yield accumulated content
        }

        // If stream is done, break
        if (chunk.done) {
          break;
        }
      }

      return;
    } catch (error) {
      // If streaming fails, log error and fall through to non-streaming fallback
      logger.error('[AI Stream] Streaming failed, falling back to non-streaming:', error);
    }
  }

  // Fallback: Use non-streaming complete() method + fake streaming
  const result = await provider.complete(request);

  if (isAIError(result)) {
    yield `Error: ${result.error}`;
    return;
  }

  const content = result.content || 'No response generated.';
  yield* createAIStream(content, { delayMs: 50, chunkSize: 1 });
}

/**
 * Map OpenRouter model IDs to appropriate local models for Ollama
 */
export async function getProviderAppropriateModel(
  provider: AIProvider,
  requestedModel: string
): Promise<string> {
  // If using Ollama, map OpenRouter models to local equivalents
  if (provider.name === 'Ollama') {
    const mapped = mapToOllamaModel(requestedModel);
    return mapped;
  }

  // For other providers (OpenRouter), use the requested model as-is
  return requestedModel;
}

/**
 * Execute an agent request with TRUE streaming via the AI provider.
 * Looks up the agent spec, fetches context from DB, builds messages,
 * and streams the response in real time via SSE.
 */
export async function* executeAgentStream(
  agentId: string,
  input: Record<string, unknown>,
  context: Record<string, unknown> = {},
  _options?: { delayMs?: number; chunkSize?: number },
  generationType?: AIGenerationType
) {
  let fullContent = '';
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, agentId);

    // 1. Look up agent spec from registry
    const agent = getAgent(agentId);
    if (!agent) {
      yield `Error: Agent '${agentId}' not found.`;
      return;
    }

    // 2. Get provider and resolve model
    const provider = await getAIProvider();
    const requestedModel = agent.model || DEFAULT_AI_MODEL;
    const providerModel = await getProviderAppropriateModel(provider, requestedModel);

    // 3. Prepare context (fetch required/optional data from DB)
    const agentContext: AgentContext = {
      userId: user.id,
      userRole: user.role,
      sessionId: `session_${Date.now()}`,
      requestId: `req_${Date.now()}`,
      timestamp: new Date(),
      entityId: (context.entityId as string) || undefined,
      entityType: (context.entityType as string) || undefined,
      contextData: {},
    };
    const executionContext = await prepareContext({ agentId, input, context: agentContext }, agent);

    // 4. Build messages from agent spec + context
    const systemPrompt = buildSystemPrompt(agent, executionContext);
    const userMessage = buildUserMessage(input, agent);
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // 5. Stream the response in real time
    for await (const chunk of createAIStreamFromProvider(provider, {
      model: providerModel,
      messages,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    })) {
      fullContent = chunk;
      yield chunk;
    }

    // 6. Track generation after streaming completes
    if (generationType) {
      saveAIGeneration({
        generationType,
        agentId,
        modelId: providerModel,
        provider: provider.name?.toLowerCase(),
        inputParams: input,
        outputContent: fullContent,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate content.';
    if (generationType) {
      saveAIGeneration({
        generationType,
        agentId,
        inputParams: input,
        // Preserve whatever was streamed before the error so partial/aborted
        // generations are still captured in the history log.
        outputContent: fullContent,
        isSuccessful: false,
        errorMessage: errorMsg,
      });
    }
    logger.error(`[${agentId}] Stream error:`, error);
    yield `Error: ${errorMsg}`;
  }
}

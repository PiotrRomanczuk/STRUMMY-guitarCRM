/**
 * Vercel AI SDK Adapter
 *
 * Wraps the Vercel AI SDK (@ai-sdk/openai-compatible) to provide
 * the same AIProvider interface used by the rest of the codebase.
 * Replaces the custom fetch-based OpenRouter provider with a
 * battle-tested SDK for streaming, structured output, and tool calling.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, generateText, generateObject } from 'ai';
import type { z } from 'zod';
import type {
  AIProvider,
  AIProviderConfig,
  AICompletionRequest,
  AIResult,
  AIModelInfo,
  AIStreamChunk,
} from '../types';
import { FREE_OPENROUTER_MODELS } from '@/lib/ai-models';
import { logger } from '@/lib/logger';

/**
 * Create the OpenRouter-compatible Vercel AI SDK provider
 */
function createVercelOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  return createOpenAICompatible({
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      'X-Title': 'Guitar CRM',
    },
  });
}

// Cached provider instance
let cachedProvider: ReturnType<typeof createOpenAICompatible> | null = null;

function getVercelProvider() {
  if (!cachedProvider) {
    cachedProvider = createVercelOpenRouterProvider();
  }
  return cachedProvider;
}

/**
 * Create an AIProvider that uses the Vercel AI SDK under the hood
 */
export function createVercelAIProvider(): AIProvider {
  const config: AIProviderConfig = {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '60000', 10),
  };

  return {
    name: 'OpenRouter (Vercel AI SDK)',

    async listModels(): Promise<AIModelInfo[]> {
      return FREE_OPENROUTER_MODELS;
    },

    async complete(request: AICompletionRequest): Promise<AIResult> {
      try {
        const provider = getVercelProvider();
        const model = provider.chatModel(request.model);

        const result = await generateText({
          model,
          messages: request.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: request.temperature,
          maxTokens: request.maxTokens,
        });

        return {
          content: result.text,
          finishReason: result.finishReason,
          usage: result.usage
            ? {
                promptTokens: result.usage.promptTokens,
                completionTokens: result.usage.completionTokens,
                totalTokens: result.usage.promptTokens + result.usage.completionTokens,
              }
            : undefined,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[Vercel AI] complete error:', error);
        return { error: msg };
      }
    },

    async *completeStream(
      request: AICompletionRequest,
      signal?: AbortSignal
    ): AsyncGenerator<AIStreamChunk, void, undefined> {
      try {
        const provider = getVercelProvider();
        const model = provider.chatModel(request.model);

        const result = streamText({
          model,
          messages: request.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          abortSignal: signal,
        });

        for await (const chunk of result.textStream) {
          yield {
            content: chunk,
            done: false,
          };
        }

        // Final chunk with usage stats
        const usage = await result.usage;
        yield {
          content: '',
          done: true,
          finishReason: (await result.finishReason) || 'stop',
          usage: usage
            ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.promptTokens + usage.completionTokens,
              }
            : undefined,
        };
      } catch (error) {
        if (signal?.aborted) {
          yield { content: '', done: true, finishReason: 'cancelled' };
          return;
        }
        const msg = error instanceof Error ? error.message : 'Streaming error';
        logger.error('[Vercel AI] stream error:', error);
        yield { content: `Error: ${msg}`, done: true };
      }
    },

    async isAvailable(): Promise<boolean> {
      return !!process.env.OPENROUTER_API_KEY;
    },

    getConfig(): AIProviderConfig {
      return config;
    },
  };
}

/**
 * Generate structured output using Vercel AI SDK's generateObject.
 * Returns typed data matching the provided Zod schema.
 */
export async function generateStructuredOutput<T>(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  schema: z.ZodType<T>;
  schemaName?: string;
  temperature?: number;
}): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }> {
  const provider = getVercelProvider();
  const model = provider.chatModel(params.model);

  const result = await generateObject({
    model,
    schema: params.schema,
    schemaName: params.schemaName,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
    temperature: params.temperature ?? 0.3,
  });

  return {
    data: result.object,
    usage: result.usage
      ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        }
      : undefined,
  };
}

/**
 * Clear the cached provider (useful for testing or config changes)
 */
export function clearVercelProviderCache(): void {
  cachedProvider = null;
}

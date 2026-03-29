/* eslint-disable max-lines */

'use server';

import {
  getAIProvider,
  isAIError,
  type AIMessage,
  type AIModelInfo,
  type AIProvider,
} from '@/lib/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-models';
import { getAgent, prepareContext, buildSystemPrompt, buildUserMessage } from '@/lib/ai/registry';
import type { AgentContext } from '@/lib/ai/registry';
import { mapToOllamaModel } from '@/lib/ai/model-mappings';
import { requireAIAuth } from '@/lib/ai/auth';
import { checkRateLimit } from '@/lib/ai/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import type { AIGenerationType } from '@/types/ai-generation';
import {
  getConversation,
  getRecentConversationSummaries,
  saveConversationMessages,
  trackAIUsage,
} from './ai-conversations';
// Vercel AI SDK imports are lazy to avoid TransformStream issues in Jest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _streamText: typeof import('ai').streamText | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _createOpenAICompatible:
  | typeof import('@ai-sdk/openai-compatible').createOpenAICompatible
  | null = null;

async function getStreamText() {
  if (!_streamText) {
    const mod = await import('ai');
    _streamText = mod.streamText;
  }
  return _streamText;
}

async function getCreateOpenAICompatible() {
  if (!_createOpenAICompatible) {
    const mod = await import('@ai-sdk/openai-compatible');
    _createOpenAICompatible = mod.createOpenAICompatible;
  }
  return _createOpenAICompatible;
}

/**
 * Enforce rate limits for a given user and agent.
 */
async function enforceRateLimit(
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
async function saveAIGeneration(data: {
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
async function* createAIStream(
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
async function* createAIStreamFromProvider(
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
 * Execute an agent request with TRUE streaming via the AI provider.
 * Looks up the agent spec, fetches context from DB, builds messages,
 * and streams the response in real time via SSE.
 */
async function* executeAgentStream(
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
        outputContent: '',
        isSuccessful: false,
        errorMessage: errorMsg,
      });
    }
    logger.error(`[${agentId}] Stream error:`, error);
    yield `Error: ${errorMsg}`;
  }
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

// NEW: Import standardized agent execution functions
import {
  generateEmailDraftAgent,
  generateLessonNotesAgent,
  generateAssignmentAgent,
  generatePostLessonSummaryAgent,
  analyzeStudentProgressAgent,
  generateAdminInsightsAgent,
  generateChatResponseAgent,
  extractAgentResult,
  formatAgentError,
  isAgentSuccess,
} from '@/lib/ai/agent-execution';
import { logger } from '@/lib/logger';

/**
 * LEGACY: Generate AI response using the configured provider
 *
 * @deprecated Use specific agent functions instead for new implementations
 *
 * This action automatically selects between OpenRouter and local LLM
 * based on the AI_PROVIDER environment variable:
 * - 'openrouter': Use OpenRouter API
 * - 'ollama': Use local Ollama
 * - 'auto' (default): Try Ollama first, fallback to OpenRouter
 */
/**
 * Generate AI response with TRUE streaming support (SSE)
 * @param prompt - User's message
 * @param model - AI model to use
 * @param conversationId - Optional conversation ID for context
 * @param signal - Optional AbortSignal for cancellation
 */
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
    let systemContent =
      'You are a helpful assistant for the Guitar CRM admin dashboard. Keep your answers concise and relevant to managing a music school.\n\nYou have access to tools that can look up songs in the catalog, find student information, view lesson history, and check student repertoire. Use these tools when the teacher asks questions about specific students or songs.';

    // Inject recent conversation summaries for cross-session awareness
    if (!conversationId) {
      const { summaries } = await getRecentConversationSummaries(3);
      if (summaries.length > 0) {
        systemContent += `\n\nRecent conversation topics (for context, do not repeat unless relevant):\n- ${summaries.join('\n- ')}`;
      }
    }

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

      const result = sdkStreamText({
        model: sdkProvider.chatModel(providerModel),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        tools,
        maxSteps: 3,
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

// ═══════════════════════════════════════════════════════════
// PHASE 1: Admin Quick Wins
// ═══════════════════════════════════════════════════════════

/**
 * Generate lesson notes using the standardized Lesson Notes Agent
 */
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
 * Generate assignment description using the standardized Assignment Generator Agent
 */
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

/**
 * Generate email draft using the standardized Email Draft Agent
 */
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

// ═══════════════════════════════════════════════════════════
// PHASE 2: Enhanced Features
// ═══════════════════════════════════════════════════════════

/**
 * Generate post-lesson summary using the standardized Post-Lesson Summary Agent
 */
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

// ═══════════════════════════════════════════════════════════
// PHASE 3: Advanced Analytics
// ═══════════════════════════════════════════════════════════

/**
 * Analyze student progress and generate insights
 */
/**
 * Analyze student progress using the standardized Student Progress Insights Agent
 */
/**
 * Analyze student progress with streaming
 */
export async function* analyzeStudentProgressStream(params: {
  studentData: Record<string, unknown>;
  studentId?: string;
  timePeriod?: string;
  lessonHistory?: Record<string, unknown>[];
  skillAssessments?: Record<string, unknown>[];
}) {
  const context = params.studentId ? { entityId: params.studentId, entityType: 'student' } : {};
  yield* executeAgentStream(
    'student-progress-insights',
    params,
    context,
    undefined,
    'student_progress'
  );
}

export async function analyzeStudentProgress(params: {
  studentId: string;
  timePeriod: string;
}): Promise<{ success: boolean; insights: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'student-progress-insights');

    const response = await analyzeStudentProgressAgent({
      student_ids: [params.studentId],
      time_period: params.timePeriod,
      analysis_focus: 'individual_progress',
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'student_progress',
        agentId: 'student-progress-insights',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, insights: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;
    const insights = String(result.content || result);

    saveAIGeneration({
      generationType: 'student_progress',
      agentId: 'student-progress-insights',
      inputParams: params,
      outputContent: insights,
    });

    return { success: true, insights };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to analyze student progress';
    logger.error('[AI] analyzeStudentProgress error:', error);
    saveAIGeneration({
      generationType: 'student_progress',
      agentId: 'student-progress-insights',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, insights: '', error: errorMsg };
  }
}

/**
 * Generate song notes (teaching tips and practice suggestions) with streaming
 */
export async function* generateSongNotesStream(params: {
  title: string;
  author: string;
  level?: string;
  key?: string;
  chords?: string;
  tempo?: number | null;
  strumming_pattern?: string;
  capo_fret?: number | null;
}) {
  yield* executeAgentStream('song-notes-assistant', params, {}, undefined, 'song_notes');
}

/**
 * Enhance rough teacher notes into polished teaching content with streaming.
 * Calls the AI provider directly — no agent registry needed.
 */
export async function* enhanceSongNotesStream(params: {
  roughNotes: string;
  title: string;
  author: string;
  level?: string;
  key?: string;
  chords?: string;
  tempo?: number | null;
  strumming_pattern?: string;
  capo_fret?: number | null;
}) {
  let fullContent = '';
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'song-notes-assistant');

    const provider = await getAIProvider();
    const providerModel = await getProviderAppropriateModel(provider, DEFAULT_AI_MODEL);

    const songContext = [
      `Title: ${params.title}`,
      `Artist: ${params.author}`,
      params.level && `Difficulty: ${params.level}`,
      params.key && `Key: ${params.key}`,
      params.chords && `Chords: ${params.chords}`,
      params.tempo && `Tempo: ${params.tempo} BPM`,
      params.strumming_pattern && `Strumming pattern: ${params.strumming_pattern}`,
      params.capo_fret && `Capo: fret ${params.capo_fret}`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert guitar teacher assistant. Expand a teacher's rough notes into polished teaching documentation.

INSTRUCTIONS:
- Preserve ALL ideas from the teacher's notes — do not omit anything
- Expand shorthand into full sentences with proper guitar terminology
- Organise into two sections: "Teaching Tips" and "Practice Suggestions"
- Add specific guitar detail where helpful (BPM targets, fret positions, technique names)
- Keep tone professional but encouraging
- Total length: 150–250 words`,
      },
      {
        role: 'user',
        content: `Song context:\n${songContext}\n\nTeacher's rough notes to enhance:\n${params.roughNotes}`,
      },
    ];

    for await (const chunk of createAIStreamFromProvider(provider, {
      model: providerModel,
      messages,
      temperature: 0.5,
      maxTokens: 600,
    })) {
      fullContent = chunk;
      yield chunk;
    }

    saveAIGeneration({
      generationType: 'song_notes',
      modelId: providerModel,
      provider: provider.name?.toLowerCase(),
      inputParams: params,
      outputContent: fullContent,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to enhance notes';
    logger.error('[AI] enhanceSongNotesStream error:', error);
    saveAIGeneration({
      generationType: 'song_notes',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    yield `Error: ${errorMsg}`;
  }
}

/**
 * Generate admin dashboard insights using the standardized Admin Dashboard Insights Agent
 */
/**
 * Generate admin insights with streaming
 */
export async function* generateAdminInsightsStream(params: {
  dashboardData: Record<string, unknown>;
  timeframe?: string;
  focusAreas?: string[];
}) {
  yield* executeAgentStream('admin-dashboard-insights', params, {}, undefined, 'admin_insights');
}

export async function generateAdminInsights(params: {
  totalStudents: number;
  newStudents: number;
  retentionRate: number;
  avgLessons: number;
  popularSongs: string[];
  revenueData?: string;
  teacherStats?: string;
}): Promise<{ success: boolean; insights: string; error?: string }> {
  try {
    const user = await requireAIAuth();
    await enforceRateLimit(user, 'admin-dashboard-insights');

    const response = await generateAdminInsightsAgent({
      total_users: params.totalStudents + params.newStudents,
      total_students: params.totalStudents,
      total_teachers: 1, // Default for single teacher system
      total_lessons: Math.round(params.avgLessons * params.totalStudents),
      analysis_period: 'last_30_days',
    });

    if (!isAgentSuccess(response)) {
      const err = formatAgentError(response);
      saveAIGeneration({
        generationType: 'admin_insights',
        agentId: 'admin-dashboard-insights',
        inputParams: params,
        outputContent: '',
        isSuccessful: false,
        errorMessage: err,
      });
      return { success: false, insights: '', error: err };
    }

    const result = extractAgentResult(response) as Record<string, unknown>;
    const insights = String(result.content || result);

    saveAIGeneration({
      generationType: 'admin_insights',
      agentId: 'admin-dashboard-insights',
      inputParams: params,
      outputContent: insights,
    });

    return { success: true, insights };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate admin insights';
    logger.error('[AI] generateAdminInsights error:', error);
    saveAIGeneration({
      generationType: 'admin_insights',
      agentId: 'admin-dashboard-insights',
      inputParams: params,
      outputContent: '',
      isSuccessful: false,
      errorMessage: errorMsg,
    });
    return { success: false, insights: '', error: errorMsg };
  }
}

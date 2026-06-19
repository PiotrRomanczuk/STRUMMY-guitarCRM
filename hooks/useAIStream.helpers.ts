import {
  startStreamingSession,
  recordFirstToken,
  updateTokenCount,
  completeStreamingSession,
} from '@/lib/ai/streaming-analytics';
import {
  enqueueRequest,
  markRequestComplete,
  getQueueStats,
  getQueueMessage,
} from '@/lib/ai/queue-manager';
import { estimateTokens, calculateProgress } from '@/lib/ai/token-estimation';
import type { UseAIStreamOptions } from './useAIStream.types';

export interface QueueCallbacks {
  setStatus: (s: string) => void;
  setQueuePosition: (p: number | undefined) => void;
  setQueueMessage: (m: string | undefined) => void;
}

/** Enqueue the request; returns requestId or null if disabled/unconfigured. */
export async function maybeEnqueue<T>(
  options: UseAIStreamOptions<T>,
  params: T,
  signal: AbortSignal,
  callbacks: QueueCallbacks
): Promise<string | null> {
  if (options.enableQueue === false || !options.userId || !options.agentId) return null;
  const result = await enqueueRequest(options.userId, options.agentId, params, signal);
  if (!result.canExecute) {
    callbacks.setStatus('queued');
    const stats = getQueueStats(options.userId, result.requestId);
    callbacks.setQueuePosition(stats.position);
    callbacks.setQueueMessage(getQueueMessage(stats));
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return result.requestId;
}

/** Start an analytics session if enabled; returns sessionId or null. */
export function maybeStartSession<T>(options: UseAIStreamOptions<T>): string | null {
  if (options.enableAnalytics === false || !options.userId || !options.agentId) return null;
  const sessionId = `${options.userId}-${Date.now()}`;
  startStreamingSession(sessionId, options.agentId, options.modelId ?? 'unknown', options.userId);
  return sessionId;
}

export interface ChunkHandlerArgs<T> {
  chunk: string;
  firstTokenRecorded: boolean;
  sessionId: string | null;
  estimatedTotal: number;
  options: UseAIStreamOptions<T>;
  setContent: (c: string) => void;
  setTokenCount: (n: number) => void;
  setProgress: (p: number) => void;
}

/** Process one streamed chunk: TTFT, content, tokens, progress, callback. */
export function handleChunk<T>(args: ChunkHandlerArgs<T>): {
  firstTokenRecorded: boolean;
  finalContent: string;
} {
  const { chunk, sessionId, estimatedTotal, options } = args;
  let { firstTokenRecorded } = args;
  if (!firstTokenRecorded && sessionId) {
    recordFirstToken(sessionId);
    firstTokenRecorded = true;
  }
  args.setContent(chunk);
  const tokens = estimateTokens(chunk, options.modelId);
  args.setTokenCount(tokens);
  if (sessionId) updateTokenCount(sessionId, tokens);
  if (estimatedTotal > 0) args.setProgress(calculateProgress(tokens, estimatedTotal));
  options.onChunk?.(chunk);
  return { firstTokenRecorded, finalContent: chunk };
}

/** Finalise analytics + queue after stream end. */
export function finaliseSession(
  sessionId: string | null,
  requestId: string | null,
  userId: string | undefined,
  outcome: 'complete' | 'cancelled' | 'error',
  errorMessage?: string
): void {
  if (sessionId) completeStreamingSession(sessionId, outcome, errorMessage);
  if (requestId && userId) markRequestComplete(userId, requestId);
}

export interface RunStreamArgs<T> {
  stream: AsyncGenerator<string, void, undefined>;
  abortSignal: AbortSignal | undefined;
  sessionId: string | null;
  requestId: string | null;
  estimatedTotal: number;
  options: UseAIStreamOptions<T>;
  setContent: (c: string) => void;
  setTokenCount: (n: number) => void;
  setProgress: (p: number) => void;
  setStatus: (s: string) => void;
  userId: string | undefined;
}

/** Drive the async-generator stream; returns { cancelled } or { finalContent }. */
export async function runStream<T>(
  args: RunStreamArgs<T>
): Promise<{ cancelled: true } | { finalContent: string }> {
  const { stream, abortSignal, sessionId, requestId, estimatedTotal, options, userId } = args;
  let finalContent = '';
  let firstTokenRecorded = false;
  for await (const chunk of stream) {
    if (abortSignal?.aborted) {
      finaliseSession(sessionId, requestId, userId, 'cancelled');
      options.onCancel?.();
      return { cancelled: true };
    }
    ({ firstTokenRecorded, finalContent } = handleChunk({
      chunk,
      firstTokenRecorded,
      sessionId,
      estimatedTotal,
      options,
      setContent: args.setContent,
      setTokenCount: args.setTokenCount,
      setProgress: args.setProgress,
    }));
  }
  finaliseSession(sessionId, requestId, userId, 'complete');
  return { finalContent };
}

export interface ResetStateArgs {
  setStatus: (s: string) => void;
  setContent: (c: string) => void;
  setReasoning: (r: string) => void;
  setTokenCount: (n: number) => void;
  setError: (e: Error | null) => void;
  setProgress: (p: number) => void;
  setQueuePosition: (p: number | undefined) => void;
  setQueueMessage: (m: string | undefined) => void;
  isStreamingRef: { current: boolean };
  abortRef: { current: AbortController | null };
  sessionIdRef: { current: string | null };
  requestIdRef: { current: string | null };
}

/** Reset all streaming state to idle. */
export function resetStreamState(args: ResetStateArgs): void {
  args.setStatus('idle');
  args.setContent('');
  args.setReasoning('');
  args.setTokenCount(0);
  args.setError(null);
  args.setProgress(0);
  args.setQueuePosition(undefined);
  args.setQueueMessage(undefined);
  args.isStreamingRef.current = false;
  args.abortRef.current = null;
  args.sessionIdRef.current = null;
  args.requestIdRef.current = null;
}

export interface ExecuteStreamArgs<T> {
  params: T;
  options: UseAIStreamOptions<T>;
  estimatedTotal: number;
  abortRef: { current: AbortController | null };
  sessionIdRef: { current: string | null };
  requestIdRef: { current: string | null };
  streamAction: (params: T, signal?: AbortSignal) => AsyncGenerator<string, void, undefined>;
  setStatus: (s: string) => void;
  setContent: (c: string) => void;
  setTokenCount: (n: number) => void;
  setProgress: (p: number) => void;
  setQueuePosition: (p: number | undefined) => void;
  setQueueMessage: (m: string | undefined) => void;
  setError: (e: Error | null) => void;
}

/** Full start-to-finish stream flow: enqueue, session, run, complete. */
export async function executeStream<T>(args: ExecuteStreamArgs<T>): Promise<void> {
  const { options, params, estimatedTotal, abortRef, sessionIdRef, requestIdRef, streamAction } =
    args;
  requestIdRef.current = await maybeEnqueue(options, params, abortRef.current!.signal, {
    setStatus: args.setStatus,
    setQueuePosition: args.setQueuePosition,
    setQueueMessage: args.setQueueMessage,
  });
  sessionIdRef.current = maybeStartSession(options);
  const stream = streamAction({ ...options.params, ...params } as T, abortRef.current!.signal);
  args.setStatus('streaming');
  args.setQueuePosition(undefined);
  args.setQueueMessage(undefined);
  const result = await runStream({
    stream,
    abortSignal: abortRef.current?.signal,
    sessionId: sessionIdRef.current,
    requestId: requestIdRef.current,
    estimatedTotal,
    options,
    userId: options.userId,
    setContent: args.setContent,
    setTokenCount: args.setTokenCount,
    setProgress: args.setProgress,
    setStatus: args.setStatus,
  });
  if ('cancelled' in result) {
    args.setStatus('cancelled');
    return;
  }
  args.setStatus('complete');
  args.setProgress(100);
  options.onComplete?.(result.finalContent);
}

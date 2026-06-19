'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getExpectedTokenCount } from '@/lib/ai/token-estimation';
import { markRequestComplete } from '@/lib/ai/queue-manager';
import { logger } from '@/lib/logger';
import type { AIStreamStatus, UseAIStreamOptions } from './useAIStream.types';
import { finaliseSession, resetStreamState, executeStream } from './useAIStream.helpers';

export type { AIStreamStatus, UseAIStreamOptions };

/** Hook for AI streaming: idle → connecting → streaming → complete/error/cancelled */
export function useAIStream<T = Record<string, unknown>>(
  streamAction: (params: T, signal?: AbortSignal) => AsyncGenerator<string, void, undefined>,
  options: UseAIStreamOptions<T> = {}
) {
  const [status, setStatus] = useState<AIStreamStatus>('idle');
  const [content, setContent] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [queuePosition, setQueuePosition] = useState<number | undefined>(undefined);
  const [queueMessage, setQueueMessage] = useState<string | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const setStatusTyped = useCallback((s: string) => setStatus(s as AIStreamStatus), []);

  const start = useCallback(
    async (params: T) => {
      if (isStreamingRef.current) {
        logger.warn('[useAIStream] Already streaming, ignoring start request');
        return;
      }
      setStatus('connecting');
      setContent('');
      setReasoning('');
      setTokenCount(0);
      setError(null);
      setProgress(0);
      setQueuePosition(undefined);
      setQueueMessage(undefined);
      isStreamingRef.current = true;
      if (options.agentId) setEstimatedTotal(getExpectedTokenCount(options.agentId));
      abortRef.current = new AbortController();

      try {
        await executeStream({
          params,
          options,
          estimatedTotal,
          abortRef,
          sessionIdRef,
          requestIdRef,
          streamAction,
          setStatus: setStatusTyped,
          setContent,
          setTokenCount,
          setProgress,
          setQueuePosition,
          setQueueMessage,
          setError,
        });
      } catch (err) {
        if (abortRef.current?.signal.aborted) {
          setStatus('cancelled');
          finaliseSession(sessionIdRef.current, requestIdRef.current, options.userId, 'cancelled');
          options.onCancel?.();
          return;
        }
        const streamError = err instanceof Error ? err : new Error('Streaming failed');
        setStatus('error');
        setError(streamError);
        finaliseSession(
          sessionIdRef.current,
          requestIdRef.current,
          options.userId,
          'error',
          streamError.message
        );
        options.onError?.(streamError);
      } finally {
        isStreamingRef.current = false;
        abortRef.current = null;
      }
    },
    [streamAction, options, estimatedTotal, setStatusTyped]
  );

  const cancel = useCallback(() => {
    if (abortRef.current && isStreamingRef.current) {
      abortRef.current.abort();
      setStatus('cancelled');
      isStreamingRef.current = false;
      options.onCancel?.();
    }
  }, [options]);

  const reset = useCallback(
    () =>
      resetStreamState({
        setStatus: setStatusTyped,
        setContent,
        setReasoning,
        setTokenCount,
        setError,
        setProgress,
        setQueuePosition,
        setQueueMessage,
        isStreamingRef,
        abortRef,
        sessionIdRef,
        requestIdRef,
      }),
    [setStatusTyped]
  );

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (requestIdRef.current && options.userId)
        markRequestComplete(options.userId, requestIdRef.current); // eslint-disable-line react-hooks/exhaustive-deps
    };
  }, [options.userId]);

  return {
    status,
    content,
    reasoning,
    tokenCount,
    error,
    progress,
    estimatedTotal,
    queuePosition,
    queueMessage,
    isStreaming: status === 'streaming' || status === 'connecting' || status === 'queued',
    isComplete: status === 'complete',
    isError: status === 'error',
    isCancelled: status === 'cancelled',
    isQueued: status === 'queued',
    start,
    cancel,
    reset,
  };
}

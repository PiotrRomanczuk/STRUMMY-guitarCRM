/**
 * Streaming status states
 */
export type AIStreamStatus =
  | 'idle'
  | 'queued'
  | 'connecting'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'cancelled';

/**
 * Options for the useAIStream hook
 */
export interface UseAIStreamOptions<T> {
  /** Callback when a chunk is received */
  onChunk?: (content: string) => void;
  /** Callback when streaming completes successfully */
  onComplete?: (finalContent: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when streaming is cancelled */
  onCancel?: () => void;
  /** Optional parameters to pass to the server action */
  params?: T;
  /** Agent ID for analytics and queue management */
  agentId?: string;
  /** Model ID for token estimation */
  modelId?: string;
  /** User ID for queue management */
  userId?: string;
  /** Enable queue management (default: true) */
  enableQueue?: boolean;
  /** Enable analytics tracking (default: true) */
  enableAnalytics?: boolean;
}

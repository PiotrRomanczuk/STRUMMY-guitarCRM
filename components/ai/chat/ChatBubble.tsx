'use client';

import { useState } from 'react';
import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitAIFeedback } from '@/app/actions/ai-feedback';
import { logger } from '@/lib/logger';
import type { ChatMessage } from './ai-chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

/** AIA-2: thumbs up/down writing ai_messages.is_helpful. Only rendered once
 * the message has a persisted id (set after streaming completes). */
function FeedbackButtons({ messageId }: { messageId: string }) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleFeedback = async (isHelpful: boolean) => {
    if (isPending || submitted !== null) return;
    setIsPending(true);
    try {
      const result = await submitAIFeedback(messageId, isHelpful);
      if (result.success) setSubmitted(isHelpful);
    } catch (err) {
      logger.error('[ChatBubble] submitAIFeedback error:', err);
    } finally {
      setIsPending(false);
    }
  };

  if (submitted !== null) {
    return (
      <span className="text-[10px] text-muted-foreground px-1" data-testid="ai-feedback-thanks">
        Thanks for the feedback
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 px-1" data-testid="ai-feedback-buttons">
      <button
        type="button"
        aria-label="This response was helpful"
        onClick={() => handleFeedback(true)}
        disabled={isPending}
        className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label="This response was not helpful"
        onClick={() => handleFeedback(false)}
        disabled={isPending}
        className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';
  const isEmpty = !message.content.trim();

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end ml-12' : 'items-start mr-6')}>
      <div
        className={cn(
          'p-4 shadow-sm max-w-full',
          isUser && 'bg-muted/80 text-foreground rounded-2xl rounded-tr-none',
          isAssistant && 'bg-card text-foreground rounded-2xl rounded-tl-none shadow-lg',
          isSystem && 'bg-primary/5 text-foreground border border-primary/20 rounded-2xl'
        )}
      >
        {isAssistant && (
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Strummy AI</span>
          </div>
        )}

        {isEmpty && isStreaming ? (
          <TypingIndicator />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {isAssistant && !isStreaming && message.id && <FeedbackButtons messageId={message.id} />}
      </div>
    </div>
  );
}

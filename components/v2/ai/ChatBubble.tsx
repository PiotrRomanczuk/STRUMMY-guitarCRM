'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
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
    <div
      className={cn(
        'flex flex-col gap-1',
        isUser ? 'items-end ml-12' : 'items-start mr-6',
      )}
    >
      <div
        className={cn(
          'p-4 shadow-sm max-w-full',
          isUser && 'bg-muted/80 text-foreground rounded-2xl rounded-tr-none',
          isAssistant && 'bg-card text-foreground rounded-2xl rounded-tl-none shadow-lg',
          isSystem && 'bg-primary/5 text-foreground border border-primary/20 rounded-2xl',
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

      <span className="text-[10px] text-muted-foreground px-1">
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

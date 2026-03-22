'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Mic, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export function ChatInput({ onSend, isDisabled, className }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
  }, [value, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const hasContent = value.trim().length > 0;

  return (
    <footer className={cn('bg-card/80 backdrop-blur-sm p-3', className)}>
      <div className="max-w-2xl mx-auto flex items-center gap-2.5">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
          aria-label="Voice input (coming soon)"
          disabled
        >
          <Mic className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about students, songs, theory..."
            disabled={isDisabled}
            className={cn(
              'w-full h-10 bg-background border border-border/50 rounded-xl px-4',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-primary/30',
              'transition-shadow disabled:opacity-50',
            )}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled || !hasContent}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            'transition-all active:scale-95',
            hasContent && !isDisabled
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}

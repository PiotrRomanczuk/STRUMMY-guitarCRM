'use client';

import { useRef, useEffect } from 'react';
import { ArrowLeft, Brain } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChatBubble } from './ChatBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ChatInput } from './ChatInput';
import type { ChatMessage } from './ai-chat.types';

interface AIAssistantMobileProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

export function AIAssistantMobile({ messages, isStreaming, onSend }: AIAssistantMobileProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50',
          'bg-card/80 backdrop-blur-xl',
          'px-4 py-3 flex justify-between items-center',
          'border-b border-border/30',
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-medium tracking-tight text-lg">
            AI Assistant
          </h1>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
      </header>

      {/* Messages area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-32">
        {!hasUserMessages && (
          <SuggestedPrompts
            onSelect={onSend}
            isDisabled={isStreaming}
            className="mt-4 px-4"
          />
        )}

        <section className="px-4 mt-6 space-y-6 max-w-2xl mx-auto w-full">
          {messages.map((msg, idx) => (
            <ChatBubble
              key={`${msg.role}-${idx}`}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
        </section>
      </main>

      {/* Fixed input bar */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        <ChatInput
          onSend={onSend}
          isDisabled={isStreaming}
          className="border-t border-border/30 pb-[env(safe-area-inset-bottom)]"
        />
      </div>
    </div>
  );
}

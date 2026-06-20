'use client';

import { useRef, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatBubble } from './ChatBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ChatInput } from './ChatInput';
import { ConversationItem } from './ConversationItem';
import type { ChatMessage } from './ai-chat.types';
import type { AIConversationSummary } from '@/types/ai-conversation';

interface AIAssistantDesktopProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  conversations: AIConversationSummary[];
  currentConversationId: string | null;
  isLoadingConversations: boolean;
  onSend: (message: string) => void;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRefreshConversations: () => void;
}

export default function AIAssistantDesktop({
  messages,
  isStreaming,
  conversations,
  currentConversationId,
  isLoadingConversations,
  onSend,
  onNewConversation,
  onLoadConversation,
  onDeleteConversation,
}: AIAssistantDesktopProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="flex h-full bg-background rounded-xl overflow-hidden border border-border/30">
      {/* Sidebar */}
      <aside className="w-72 bg-card/50 border-r border-border/30 flex flex-col shrink-0">
        <div className="p-4">
          <button
            onClick={onNewConversation}
            className={cn(
              'w-full h-10 rounded-xl flex items-center justify-center gap-2',
              'bg-primary text-primary-foreground font-semibold text-sm',
              'hover:opacity-90 transition-opacity active:scale-[0.98]',
            )}
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {isLoadingConversations && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingConversations && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No conversations yet. Start a new one!
            </p>
          )}

          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onSelect={() => onLoadConversation(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasUserMessages && (
            <SuggestedPrompts
              onSelect={onSend}
              isDisabled={isStreaming}
              className="mt-6 px-6"
            />
          )}

          <section className="px-6 mt-6 space-y-6 max-w-2xl mx-auto w-full pb-4">
            {messages.map((msg, idx) => (
              <ChatBubble
                key={`${msg.role}-${idx}`}
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
          </section>
        </div>

        <ChatInput
          onSend={onSend}
          isDisabled={isStreaming}
          className="border-t border-border/30"
        />
      </div>
    </div>
  );
}

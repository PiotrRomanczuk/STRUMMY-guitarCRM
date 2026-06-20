'use client';

import { lazy, Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useAIChat } from './useAIChat';
import { AIAssistantMobile } from './AIAssistant.Mobile';

const AIAssistantDesktop = lazy(() => import('./AIAssistant.Desktop'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

export function AIAssistant() {
  const mode = useLayoutMode();
  const chat = useAIChat();

  useEffect(() => {
    chat.refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === 'mobile') {
    return (
      <AIAssistantMobile
        messages={chat.messages}
        isStreaming={chat.isStreaming}
        onSend={chat.sendMessage}
      />
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AIAssistantDesktop
        messages={chat.messages}
        isStreaming={chat.isStreaming}
        conversations={chat.conversations}
        currentConversationId={chat.currentConversationId}
        isLoadingConversations={chat.isLoadingConversations}
        onSend={chat.sendMessage}
        onNewConversation={chat.startNewConversation}
        onLoadConversation={chat.loadConversation}
        onDeleteConversation={chat.removeConversation}
        onRefreshConversations={chat.refreshConversations}
      />
    </Suspense>
  );
}

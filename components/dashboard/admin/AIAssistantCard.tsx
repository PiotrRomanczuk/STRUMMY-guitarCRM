'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateAIResponseStream, getAvailableModels } from '@/app/actions/ai';
import { DEFAULT_AI_MODEL } from '@/lib/ai-models';
import { Send, Minimize2, Maximize2, Sparkles, Trash2 } from 'lucide-react';
import type { AIModelInfo } from '@/lib/ai';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useAIStream } from '@/hooks/useAIStream';
import { AIStreamingStatus } from '@/components/ai';
import { AIAssistantCardMessages } from './AIAssistantCard.Messages';
import { AIConversationHistory } from './AIConversationHistory';
import { logger } from '@/lib/logger';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'How can I improve student retention?',
  'What are best practices for scheduling lessons?',
  'How do I motivate struggling students?',
  'Tips for teaching guitar to beginners',
];

function createWelcomeMessage(firstName?: string): Message {
  return {
    role: 'system',
    content: `Hi${
      firstName ? ` ${firstName}` : ''
    }! I'm your Strummy AI assistant. I can help you with:\n\n- Practice tips and techniques\n- Song recommendations\n- Lesson planning advice\n- Student management strategies\n- Music theory questions\n\nTry asking me something or click one of the suggested prompts below!`,
    timestamp: new Date(),
  };
}

interface AIAssistantCardProps {
  firstName?: string;
}

export function AIAssistantCard({ firstName }: AIAssistantCardProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage(firstName)]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);
  const [isMinimized, setIsMinimized] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModelInfo[]>([]);
  const [providerName, setProviderName] = useState<string>('');

  const {
    conversationId,
    conversations,
    isLoadingList,
    isLoadingConversation,
    startNewConversation,
    loadConversation,
    refreshConversationList,
    clearCurrentConversation,
    removeConversation,
  } = useAIConversation();

  // Streaming action wrapper. generateAIResponseStream takes no AbortSignal
  // — see its doc comment for why forwarding one crashes Next's Server
  // Action stream wrapper. Cancellation is handled here instead: stop
  // yielding once the local signal fires, letting the request finish
  // server side unobserved.
  const streamAction = useCallback(async function* (
    params: { prompt: string; model: string; conversationId?: string },
    signal?: AbortSignal
  ) {
    for await (const chunk of await generateAIResponseStream(
      params.prompt,
      params.model,
      params.conversationId
    )) {
      if (signal?.aborted) return;
      yield chunk;
    }
  }, []);

  // AI streaming hook
  const aiStream = useAIStream(streamAction, {
    onChunk: (content) => {
      // Update the last assistant message with streaming content
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 && msg.role === 'assistant' ? { ...msg, content } : msg
        )
      );
    },
    onComplete: () => {
      refreshConversationList();
    },
    onError: (error) => {
      logger.error('[AIAssistantCard] Streaming error:', error);
      // Remove the empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  useEffect(() => {
    const fetchModels = async () => {
      const result = await getAvailableModels();
      if (result.models) {
        setAvailableModels(result.models);
        setProviderName(result.providerName || '');
        if (result.models.length > 0 && !result.models.find((m) => m.id === selectedModel)) {
          setSelectedModel(result.models[0].id);
        }
      }
    };
    fetchModels();
  }, [selectedModel]);

  const handleSubmit = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    // Don't allow multiple simultaneous requests
    if (aiStream.isStreaming) return;

    // Ensure we have a conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await startNewConversation(selectedModel);
      if (!activeConvId) {
        logger.error('[AIAssistantCard] Failed to create conversation');
        return;
      }
    }

    const userMessage: Message = { role: 'user', content: textToSend, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');

    const assistantMessage: Message = { role: 'assistant', content: '', timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMessage]);

    // Start streaming
    await aiStream.start({
      prompt: textToSend,
      model: selectedModel,
      conversationId: activeConvId,
    });
  };

  const clearConversation = () => {
    clearCurrentConversation();
    setMessages([createWelcomeMessage(firstName)]);
    aiStream.reset();
    setPrompt('');
  };

  const handleLoadConversation = async (id: string) => {
    const loaded = await loadConversation(id);
    if (loaded.length > 0) {
      setMessages(loaded);
    }
    aiStream.reset();
    setPrompt('');
  };

  const handleNewConversation = () => {
    clearConversation();
  };

  return (
    <Card className={`w-full flex flex-col transition-all ${isMinimized ? 'h-auto' : 'h-full'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Assistant</CardTitle>
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-45 h-8 text-xs">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.isLocal && (
                        <Badge variant="secondary" className="text-xs">
                          Local
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {providerName && (
              <Badge variant="outline" className="text-xs">
                {providerName}
              </Badge>
            )}
            <AIConversationHistory
              conversations={conversations}
              currentConversationId={conversationId}
              onSelect={handleLoadConversation}
              onNew={handleNewConversation}
              onDelete={removeConversation}
              onRefresh={refreshConversationList}
              isLoading={isLoadingList || isLoadingConversation}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearConversation} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {!isMinimized && (
          <CardDescription>
            Ask for help with managing students, scheduling, or general questions.
          </CardDescription>
        )}
      </CardHeader>
      {!isMinimized && (
        <>
          <CardContent className="flex-1 flex flex-col gap-4 min-h-75 max-h-125">
            <AIAssistantCardMessages
              messages={messages}
              isLoading={aiStream.isStreaming}
              suggestedPrompts={SUGGESTED_PROMPTS}
              onSuggestedPromptClick={handleSubmit}
            />

            {/* Streaming Status */}
            {(aiStream.isStreaming || aiStream.isError) && (
              <AIStreamingStatus
                status={aiStream.status}
                tokenCount={aiStream.tokenCount}
                reasoning={aiStream.reasoning}
                error={aiStream.error}
                onCancel={aiStream.cancel}
                onRetry={() => {
                  aiStream.reset();
                  // Re-submit the last user message
                  const lastUserMessage = messages
                    .slice()
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUserMessage) {
                    handleSubmit(lastUserMessage.content);
                  }
                }}
              />
            )}
          </CardContent>
          <CardFooter className="flex gap-2 border-t pt-4">
            <Textarea
              placeholder="Ask me anything..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-15 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={aiStream.isStreaming || !prompt.trim()}
              className="h-auto self-stretch"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

'use client';

import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIConversationSummary } from '@/types/ai-conversation';

interface ConversationItemProps {
  conversation: AIConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  const title = conversation.title || 'Untitled conversation';
  const dateLabel = new Date(conversation.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg group',
        'flex items-start gap-2.5 transition-colors',
        isActive ? 'bg-primary/10 text-foreground' : 'hover:bg-muted text-muted-foreground',
      )}
    >
      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{dateLabel}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive shrink-0"
        aria-label={`Delete conversation: ${title}`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </button>
  );
}

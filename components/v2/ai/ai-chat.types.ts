export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIConversationListItem {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

import type { ContentPostStatus } from '@/types/ContentPost';

const TRANSITIONS: Record<ContentPostStatus, ContentPostStatus[]> = {
  planned: ['scheduled', 'archived'],
  scheduled: ['published', 'planned', 'failed', 'archived'],
  published: ['archived'],
  archived: ['planned'],
  failed: ['planned', 'scheduled'],
};

export function canTransitionPostStatus(from: ContentPostStatus, to: ContentPostStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

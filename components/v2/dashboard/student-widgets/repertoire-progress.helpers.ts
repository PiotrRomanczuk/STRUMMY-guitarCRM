import type { SongProgressStatus, RepertoirePriority } from '@/types/StudentRepertoire';

export const STATUS_CONFIG: Record<SongProgressStatus, { label: string; className: string }> = {
  mastered: {
    label: 'Mastered',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  with_author: {
    label: 'With Author',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  remembered: {
    label: 'Remembered',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  started: {
    label: 'Started',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  to_learn: {
    label: 'To Learn',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function formatPracticeTime(minutes: number): string {
  if (minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Today';
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function getPriorityIndicator(priority: RepertoirePriority): {
  isVisible: boolean;
  className: string;
  label: string;
} {
  if (priority === 'high') {
    return { isVisible: true, className: 'bg-orange-500', label: 'High priority' };
  }
  return { isVisible: false, className: '', label: '' };
}

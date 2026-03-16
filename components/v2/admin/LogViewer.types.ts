import {
  Info,
  AlertCircle,
  AlertTriangle,
  Bug,
} from 'lucide-react';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  details?: string;
}

export const LEVEL_CONFIG: Record<
  LogLevel,
  { icon: React.ElementType; color: string; bg: string }
> = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  debug: {
    icon: Bug,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export const LEVEL_FILTERS = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Debug', value: 'debug' },
];

// Placeholder data -- actual API does not exist yet.
export const SAMPLE_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'System started successfully',
    source: 'server',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    level: 'warn',
    message: 'Spotify rate limit approaching threshold',
    source: 'spotify-cron',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    level: 'error',
    message: 'Failed to sync Drive video: timeout',
    source: 'drive-sync',
    details: 'ETIMEDOUT: connection timed out after 30s',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'debug',
    message: 'AI generation queue processed 3 items',
    source: 'ai-queue',
  },
];

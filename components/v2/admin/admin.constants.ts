import {
  Activity,
  Server,
  Music,
  ScrollText,
} from 'lucide-react';
import type { ServiceStatus } from '@/types/health';

export const STATUS_COLOR: Record<ServiceStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  error: 'bg-destructive',
  unconfigured: 'bg-muted-foreground',
};

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  healthy: 'All systems operational',
  degraded: 'Some services degraded',
  error: 'Service errors detected',
  unconfigured: 'Services not configured',
};

export interface QuickLink {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export const ADMIN_LINKS: QuickLink[] = [
  {
    label: 'Health Check',
    href: '/dashboard/admin/debug',
    icon: Activity,
    description: 'Service status & diagnostics',
  },
  {
    label: 'Spotify Queue',
    href: '/dashboard/admin/spotify-matches',
    icon: Music,
    description: 'Approve/reject song matches',
  },
  {
    label: 'System Logs',
    href: '/dashboard/logs',
    icon: ScrollText,
    description: 'View activity & error logs',
  },
  {
    label: 'Debug Panel',
    href: '/dashboard/admin/debug',
    icon: Server,
    description: 'Full system debug dashboard',
  },
];

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  MinusCircle,
  ChevronDown,
} from 'lucide-react';
import type { ServiceCheck, ServiceStatus } from '@/types/health';

const STATUS_CONFIG: Record<
  ServiceStatus,
  { icon: React.ElementType; color: string; bg: string }
> = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  error: {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  unconfigured: {
    icon: MinusCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export function ServiceRow({ service }: { service: ServiceCheck }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[service.status];
  const Icon = config.icon;
  const hasDetails =
    !!service.details && Object.keys(service.details).length > 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full p-4 min-h-[44px] text-left active:bg-muted/50 transition-colors"
        aria-expanded={expanded}
      >
        <div
          className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {service.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {service.latencyMs !== undefined && (
              <span>{service.latencyMs}ms</span>
            )}
            {service.message && (
              <>
                {service.latencyMs !== undefined && <span>-</span>}
                <span className="truncate">{service.message}</span>
              </>
            )}
          </div>
        </div>
        {hasDetails && (
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>
      <AnimatePresence>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="text-xs bg-muted/50 p-3 mx-4 mb-4 rounded-lg overflow-x-auto font-mono">
              {JSON.stringify(service.details, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

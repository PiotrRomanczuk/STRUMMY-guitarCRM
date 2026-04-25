'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface AttentionItem {
  id: string;
  studentId: string;
  studentName: string;
  reason: 'no_recent_lesson' | 'overdue_assignment' | 'inactive';
  daysAgo: number;
  actionUrl: string;
}

interface AttentionWidgetProps {
  items: AttentionItem[];
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  no_recent_lesson: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'needs attention' },
  overdue_assignment: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'at risk' },
  inactive: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'at risk' },
};

export function AttentionWidget({ items }: AttentionWidgetProps) {
  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      <div className="px-6 pt-5 pb-1 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium">
            Needs attention
          </div>
          <div className="font-serif text-lg font-normal tracking-[-0.01em] mt-0.5">
            {items.length} {items.length === 1 ? 'flag' : 'flags'}
          </div>
        </div>
        <Link href="/dashboard/users?filter=needs-attention" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
          View all &rarr;
        </Link>
      </div>

      <div className="px-6 pb-5">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <AnimatePresence mode="popLayout">
            {items.slice(0, 4).map((item) => {
              const severity = SEVERITY_STYLES[item.reason] ?? SEVERITY_STYLES.no_recent_lesson;
              const initials = item.studentName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

              return (
                <motion.div key={item.id} variants={listItem} layout>
                  <Link
                    href={item.actionUrl}
                    className="flex items-center gap-3 py-2.5 border-b border-border hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">{item.studentName}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {formatReason(item.reason)} · {item.daysAgo}d ago
                      </div>
                    </div>
                    <span className={cn(
                      'px-2.5 py-[3px] rounded-full text-[10px] font-medium uppercase tracking-[.06em]',
                      severity.bg, severity.text
                    )}>
                      {severity.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

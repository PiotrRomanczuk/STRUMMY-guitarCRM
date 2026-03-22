'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

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

const reasonStyles = {
  no_recent_lesson: {
    icon: Calendar,
    label: 'No recent lesson',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  overdue_assignment: {
    icon: FileText,
    label: 'Overdue assignment',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
  inactive: {
    icon: Clock,
    label: 'Inactive',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
} as const;

export function AttentionWidget({ items }: AttentionWidgetProps) {
  const displayItems = items.slice(0, 4);
  const totalCount = items.length;

  return (
    <div className="bg-card rounded-[10px] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Needs Attention
          {totalCount > 0 && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
              {totalCount}
            </span>
          )}
        </h3>
      </div>

      {/* Content */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
            <AlertCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            No students need attention
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {displayItems.map((item) => {
              const style = reasonStyles[item.reason];
              const Icon = style.icon;

              return (
                <motion.div key={item.id} variants={listItem} layout>
                  <Link
                    href={item.actionUrl}
                    className={`block p-3 rounded-lg border ${style.border} ${style.bg}
                               active:opacity-70 transition-opacity min-h-[44px]`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${style.color}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.studentName}
                          </p>
                          <p className={`text-xs ${style.color}`}>
                            {style.label} &middot; {item.daysAgo}d ago
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {totalCount > 4 && (
            <Link
              href="/dashboard/users?filter=needs-attention"
              className="text-center text-xs text-primary font-medium py-2 min-h-[44px] flex items-center justify-center"
            >
              View all {totalCount} items
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface AgendaItem {
  id: string;
  type: 'lesson' | 'assignment' | 'task';
  title: string;
  time?: string;
  studentName?: string;
  status: 'upcoming' | 'completed' | 'overdue';
}

interface AgendaWidgetProps {
  items: AgendaItem[];
}

const statusStyles = {
  upcoming: {
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
} as const;

export function AgendaWidget({ items }: AgendaWidgetProps) {
  const upcomingCount = items.filter((i) => i.status === 'upcoming').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Today&apos;s Agenda
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {upcomingCount}
          </span>
          <span>/</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No items today</p>
          <p className="text-xs text-muted-foreground mt-0.5">Enjoy your free day!</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {items.slice(0, 5).map((item) => {
              const style = statusStyles[item.status];
              const StatusIcon = style.icon;

              return (
                <motion.div
                  key={item.id}
                  variants={listItem}
                  layout
                  className="flex items-start gap-3 p-3 rounded-lg border border-border
                             active:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <div
                    className={`w-8 h-8 rounded-md ${style.bg} flex items-center justify-center shrink-0`}
                  >
                    <StatusIcon className={`h-4 w-4 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {item.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </span>
                      )}
                      {item.studentName && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3" />
                          <span className="truncate">{item.studentName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {items.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{items.length - 5} more items
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

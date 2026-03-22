'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { Calendar, User } from 'lucide-react';
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

export function AgendaWidget({ items }: AgendaWidgetProps) {
  return (
    <section className="bg-card rounded-[10px] p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-foreground font-bold text-xl">
          Today&apos;s Schedule
        </h2>
        <p className="text-muted-foreground text-xs font-medium">
          {format(new Date(), 'EEEE, MMM d')}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyAgenda />
      ) : (
        <div className="space-y-4 relative">
          {/* Timeline track */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/40" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {items.slice(0, 5).map((item, idx) => (
                <AgendaRow key={item.id} item={item} isActive={idx === 0 && item.status === 'upcoming'} />
              ))}
            </AnimatePresence>
          </motion.div>
          {items.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{items.length - 5} more items
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AgendaRow({ item, isActive }: { item: AgendaItem; isActive: boolean }) {
  const dotClass = isActive
    ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
    : item.status === 'completed'
      ? 'bg-muted border-2 border-muted-foreground/30'
      : 'bg-card border-2 border-muted-foreground/30';

  const statusLabel =
    item.status === 'completed' ? 'Completed' : item.status === 'overdue' ? 'Overdue' : 'Upcoming';

  return (
    <motion.div
      variants={listItem}
      layout
      className={`relative pl-8 flex items-center justify-between gap-3 min-h-[44px]
        ${isActive ? 'p-4 bg-secondary border-l-4 border-primary rounded-r-[10px]' : ''}`}
    >
      <div className={`absolute left-[4px] w-4 h-4 rounded-full z-10 ${dotClass}`} />
      <div className="flex-1 min-w-0">
        {item.time && (
          <p className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5
            ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            {item.time}
          </p>
        )}
        <h3 className={`font-semibold truncate ${isActive ? 'text-foreground text-lg font-bold' : 'text-foreground'}`}>
          {item.title}
        </h3>
        {item.studentName && (
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <User className="h-3 w-3" />
            {item.studentName}
          </p>
        )}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0
        ${item.status === 'completed' ? 'text-muted-foreground bg-secondary px-3 py-1 rounded-full' : ''}
        ${item.status === 'overdue' ? 'text-destructive' : ''}
        ${item.status === 'upcoming' && !isActive ? 'text-muted-foreground' : ''}
        ${isActive ? 'hidden' : ''}`}>
        {statusLabel}
      </span>
    </motion.div>
  );
}

function EmptyAgenda() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No items today</p>
      <p className="text-xs text-muted-foreground mt-0.5">Enjoy your free day!</p>
    </div>
  );
}

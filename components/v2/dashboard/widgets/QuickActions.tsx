'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideInBottom, fadeIn } from '@/lib/animations/variants';
import { Plus, BookOpen, Music, Users, BarChart3, X } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

const actions: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'New Lesson', href: '/dashboard/lessons/new', icon: BookOpen },
  { label: 'Add Student', href: '/dashboard/users/invite', icon: Users },
  { label: 'Import Song', href: '/dashboard/songs/new', icon: Music },
  { label: 'Report', href: '/dashboard/stats', icon: BarChart3 },
];

/** Desktop 2x2 grid of quick actions */
export function QuickActionsGrid() {
  return (
    <section className="bg-card rounded-[10px] p-6">
      <h2 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-5">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center p-4 rounded-xl
                         bg-secondary hover:bg-primary hover:text-primary-foreground
                         transition-all group min-h-[80px]"
            >
              <Icon className="h-5 w-5 mb-2 text-primary group-hover:text-primary-foreground transition-colors" />
              <span className="text-xs font-bold text-foreground group-hover:text-primary-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Mobile FAB with action sheet */
export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={slideInBottom}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+5rem)] right-4 z-50
                       bg-card rounded-xl border border-border shadow-lg p-2 space-y-1 min-w-[180px]"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg
                             active:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{action.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed right-4 z-50 rounded-[14px] shadow-lg
                   bg-gradient-to-br from-primary to-warning text-primary-foreground
                   w-14 h-14 flex items-center justify-center
                   bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]
                   active:scale-90 transition-transform"
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </button>
    </>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideInBottom, fadeIn } from '@/lib/animations/variants';
import { Plus, BookOpen, Music, Users, ClipboardList, X } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

const actions: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'New lesson', href: '/dashboard/lessons/new', icon: BookOpen },
  { label: 'Assignment', href: '/dashboard/assignments/new', icon: ClipboardList },
  { label: 'Add song', href: '/dashboard/songs/new', icon: Music },
  { label: 'Invite student', href: '/dashboard/users/invite', icon: Users },
];

export function QuickActionsGrid() {
  return (
    <section className="bg-card border border-border rounded-[14px] p-5">
      <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.14em] font-medium mb-3">
        Quick actions
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2.5 px-3 py-2.5 border border-border bg-card rounded-lg text-[13px] text-foreground/80 hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

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
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed right-4 z-50 rounded-full shadow-lg
                   bg-foreground text-background
                   w-14 h-14 flex items-center justify-center
                   bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]
                   active:scale-90 transition-transform"
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </button>
    </>
  );
}

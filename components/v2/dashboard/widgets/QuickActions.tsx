'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideInBottom, fadeIn } from '@/lib/animations/variants';
import { Plus, BookOpen, Music, Users, X } from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  href: string;
  icon: typeof Plus;
  color: string;
  bgColor: string;
}

const actions: QuickAction[] = [
  {
    label: 'New Lesson',
    href: '/dashboard/lessons/new',
    icon: BookOpen,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: 'Add Song',
    href: '/dashboard/songs/new',
    icon: Music,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  {
    label: 'Add Student',
    href: '/dashboard/users/invite',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
  },
];

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
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

      {/* Action sheet */}
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
                  <div
                    className={`w-8 h-8 rounded-md ${action.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed right-4 z-50 rounded-full shadow-lg
                   bg-primary text-primary-foreground
                   w-14 h-14 flex items-center justify-center
                   bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]
                   active:scale-95 transition-transform"
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </motion.div>
      </button>
    </>
  );
}

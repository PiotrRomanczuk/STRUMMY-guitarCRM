'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeVariants } from '@/lib/animations/variants';
import { PracticeLogSheet } from './PracticeLogSheet';

const fabEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const, delay: 0.3 },
  },
};

interface PracticeLogButtonProps {
  /** Render as inline button instead of floating action button */
  inline?: boolean;
}

/**
 * Button to open the practice log sheet/dialog.
 * Two modes:
 * - FAB (default): fixed floating button in bottom-right corner
 * - Inline: regular button that fits in any layout
 */
export function PracticeLogButton({ inline = false }: PracticeLogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (inline) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="default"
          size="lg"
          className="gap-2"
        >
          <Timer className="h-4 w-4" />
          Log Practice
        </Button>
        <PracticeLogSheet open={isOpen} onOpenChange={setIsOpen} />
      </>
    );
  }

  return (
    <>
      <motion.div
        variants={safeVariants(fabEntrance)}
        initial="hidden"
        animate="visible"
        className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl
                     transition-shadow md:h-auto md:w-auto md:rounded-full
                     md:px-6 md:gap-2"
          aria-label="Log practice session"
        >
          <Timer className="h-5 w-5 md:h-4 md:w-4" />
          <span className="hidden md:inline">Log Practice</span>
        </Button>
      </motion.div>
      <PracticeLogSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

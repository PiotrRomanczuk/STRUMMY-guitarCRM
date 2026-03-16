'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations/variants';
import { CheckCircle2 } from 'lucide-react';

interface StepWelcomeProps {
  firstName?: string;
}

export function StepWelcome({ firstName }: StepWelcomeProps) {
  const name = firstName || 'there';

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center text-center py-8 space-y-6"
    >
      {/* Success icon with ring animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.4, repeat: 1 }}
          className="absolute inset-0 rounded-full border-2 border-green-500/30"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <h2 className="text-xl font-bold tracking-tight">
          You&apos;re all set, {name}!
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Your profile is ready. Let&apos;s start your guitar journey.
        </p>
      </motion.div>
    </motion.div>
  );
}

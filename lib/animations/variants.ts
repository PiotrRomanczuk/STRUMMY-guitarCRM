import { Variants, Transition } from 'framer-motion';
import { getReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Staggered container - wrap lists with this
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fast stagger for longer lists
 */
export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/**
 * List item - fade up
 */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Card entrance - scale and fade
 */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Page wrapper animation
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Fade in only (no movement)
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Slide in from right (for modals, sidebars)
 */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Slide in from bottom (for mobile sheets)
 */
export const slideInBottom: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Scale on tap (for buttons)
 */
export const tapScale = {
  whileTap: { scale: 0.95 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
};

/**
 * Hover lift (for cards)
 */
export const hoverLift = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

/**
 * Subtle hover (for list items)
 */
export const subtleHover = {
  whileHover: { x: 4 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
};

// ---------------------------------------------------------------------------
// Reduced-motion support
// ---------------------------------------------------------------------------

/** Instant transition with no visible animation */
const instantTransition: Transition = { duration: 0 };

/**
 * Returns a Variants object that skips all animation when the user prefers
 * reduced motion. Pass in the normal variants and get back either the
 * original or a "jump to end state" version.
 *
 * Usage:
 * ```tsx
 * <motion.div variants={safeVariants(staggerContainer)} ...>
 * ```
 */
export function safeVariants(variants: Variants): Variants {
  if (!getReducedMotion()) return variants;

  const safe: Variants = {};
  for (const key of Object.keys(variants)) {
    const value = variants[key];
    if (typeof value === 'object' && value !== null) {
      safe[key] = { ...value, transition: instantTransition };
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Returns motion props that are disabled when the user prefers reduced motion.
 * Works for non-Variants props like whileHover / whileTap.
 *
 * Usage:
 * ```tsx
 * <motion.div {...safeMotionProps(hoverLift)} />
 * ```
 */
export function safeMotionProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  if (!getReducedMotion()) return props;
  return {};
}

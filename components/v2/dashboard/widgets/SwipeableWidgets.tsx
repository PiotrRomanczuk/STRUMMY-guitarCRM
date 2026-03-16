'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SwipeableWidgetsProps {
  children: React.ReactNode[];
  labels?: string[];
}

/**
 * Horizontal snap-scroll container with dot indicators.
 * Each child is rendered as a full-width snap section.
 */
export function SwipeableWidgets({ children, labels }: SwipeableWidgetsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = children.length;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const idx = Math.round(scrollLeft / width);
    setActiveIndex(Math.min(idx, total - 1));
  }, [total]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
  };

  if (total <= 1) {
    return <>{children[0]}</>;
  }

  return (
    <div className="space-y-3">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -mx-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-full px-4"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot indicators with optional labels */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="flex items-center gap-1.5 py-1 px-1"
            aria-label={labels?.[i] ? `Go to ${labels[i]}` : `Go to section ${i + 1}`}
          >
            <motion.div
              className="rounded-full"
              animate={{
                width: activeIndex === i ? 20 : 6,
                height: 6,
                backgroundColor:
                  activeIndex === i
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground) / 0.3)',
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChartSlide {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface ChartCarouselProps {
  slides: ChartSlide[];
  className?: string;
}

/**
 * Swipeable chart carousel for mobile stats views.
 * Renders charts in a horizontal swipe container with dot indicators.
 */
export function ChartCarousel({ slides, className }: ChartCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activeIndex < slides.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if (info.offset.x > threshold && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          {slides[activeIndex]?.title}
        </h3>
        <span className="text-xs text-muted-foreground">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Carousel container */}
      <div ref={constraintsRef} className="overflow-hidden rounded-xl">
        <motion.div
          className="flex cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="w-full shrink-0 bg-card rounded-xl border border-border p-4"
            >
              {slide.content}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-2 rounded-full disabled:opacity-30 transition-opacity"
          aria-label="Previous chart"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                i === activeIndex
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30',
              )}
              aria-label={`Go to chart ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === slides.length - 1}
          className="p-2 rounded-full disabled:opacity-30 transition-opacity"
          aria-label="Next chart"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

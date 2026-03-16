'use client';

import { useRef, useCallback } from 'react';
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  format,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Dates that have events (shown with a dot indicator) */
  eventDates?: Date[];
}

/**
 * Horizontal week selector strip for mobile calendar.
 * Shows 7 days with swipe navigation between weeks.
 */
export function WeekStrip({ selectedDate, onSelectDate, eventDates = [] }: WeekStripProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = useCallback(() => {
    onSelectDate(subWeeks(selectedDate, 1));
  }, [selectedDate, onSelectDate]);

  const goToNextWeek = useCallback(() => {
    onSelectDate(addWeeks(selectedDate, 1));
  }, [selectedDate, onSelectDate]);

  const hasEvent = (date: Date) =>
    eventDates.some((eventDate) => isSameDay(eventDate, date));

  return (
    <div className="bg-card border-b border-border">
      {/* Month/Year header with navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={goToPreviousWeek}
          className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {format(selectedDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={goToNextWeek}
          className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Day buttons */}
      <div
        ref={containerRef}
        className="flex justify-between px-2 pb-3"
        role="listbox"
        aria-label="Select day"
      >
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dayHasEvent = hasEvent(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectDate(day)}
              role="option"
              aria-selected={isSelected}
              aria-label={format(day, 'EEEE, MMMM d')}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-2 rounded-xl min-w-[44px] min-h-[44px]',
                'transition-colors',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && isTodayDate && 'bg-primary/10',
                !isSelected && !isTodayDate && 'hover:bg-muted/50'
              )}
            >
              <span className={cn(
                'text-[11px] font-medium uppercase',
                isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-primary-foreground' : 'text-foreground'
              )}>
                {format(day, 'd')}
              </span>
              {/* Event indicator dot — only render when day has events */}
              {dayHasEvent && (
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                  aria-hidden="true"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

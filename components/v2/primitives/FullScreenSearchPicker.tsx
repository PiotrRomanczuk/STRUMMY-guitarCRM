'use client';

import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { slideInBottom } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FullScreenSearchPickerProps<T> {
  /** Whether the search overlay is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Items to search through */
  items: T[];
  /** Filter function called with the search query */
  filterFn: (item: T, query: string) => boolean;
  /** Render function for each result item */
  renderItem: (item: T) => ReactNode;
  /** Called when an item is selected */
  onSelect: (item: T) => void;
  /** Key extractor for list rendering */
  keyExtractor: (item: T) => string;
  /** Empty state message */
  emptyMessage?: string;
  /** Title for the search overlay (sr-only) */
  title?: string;
}

/**
 * Full-screen mobile search overlay.
 * Slides up from the bottom with auto-focus on the search input.
 * Close via X button or Escape key.
 */
export function FullScreenSearchPicker<T>({
  open,
  onOpenChange,
  placeholder = 'Search...',
  items,
  filterFn,
  renderItem,
  onSelect,
  keyExtractor,
  emptyMessage = 'No results found',
  title = 'Search',
}: FullScreenSearchPickerProps<T>) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query when picker closes (React "adjust state during render" pattern)
  if (!open && query !== '') {
    setQuery('');
  }

  const filteredItems = query.trim()
    ? items.filter((item) => filterFn(item, query))
    : items;

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={slideInBottom}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header with close and search */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0 min-h-[44px] min-w-[44px]"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="sr-only">{title}</h2>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-10 min-h-[44px]"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto pb-safe">
            {filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <button
                    key={keyExtractor(item)}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'w-full text-left px-4 py-3',
                      'min-h-[44px]',
                      'active:bg-muted transition-colors'
                    )}
                  >
                    {renderItem(item)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LyricsViewerProps {
  /** Raw lyrics text (with chord annotations) */
  text: string;
  /** Additional CSS classes */
  className?: string;
}

const FONT_SIZES = [
  { label: 'S', value: 'text-xs' },
  { label: 'M', value: 'text-sm' },
  { label: 'L', value: 'text-base' },
  { label: 'XL', value: 'text-lg' },
] as const;

/**
 * Mobile-optimized lyrics and chords display.
 * Features:
 * - Adjustable font size (4 levels)
 * - Pre-formatted whitespace for chord alignment
 * - Scrollable container with max height
 * - Accessible zoom controls with 44px touch targets
 */
export function LyricsViewer({ text, className }: LyricsViewerProps) {
  const [sizeIdx, setSizeIdx] = useState(1); // default to 'M'

  if (!text.trim()) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-8">
        No lyrics available for this song.
      </p>
    );
  }

  const canZoomIn = sizeIdx < FONT_SIZES.length - 1;
  const canZoomOut = sizeIdx > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Zoom controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Size: {FONT_SIZES[sizeIdx].label}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
            disabled={!canZoomOut}
            aria-label="Decrease font size"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={!canZoomIn}
            aria-label="Increase font size"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lyrics content */}
      <pre
        aria-label="Song lyrics with chord annotations"
        className={cn(
          'whitespace-pre-wrap break-words',
          'p-4 rounded-lg',
          'bg-muted/50 border border-border',
          'max-h-[60vh] overflow-y-auto',
          'font-mono leading-relaxed',
          'text-foreground',
          FONT_SIZES[sizeIdx].value
        )}
      >
        {text}
      </pre>
    </div>
  );
}

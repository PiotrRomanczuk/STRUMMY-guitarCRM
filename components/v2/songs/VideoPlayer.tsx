'use client';

import { useState } from 'react';
import { Youtube, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  /** YouTube URL (watch, embed, or youtu.be format) */
  url: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Extracts YouTube video ID from various URL formats.
 */
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Responsive YouTube video player.
 * - Maintains 16:9 aspect ratio at all viewports
 * - Rounded corners with border
 * - Shows empty state when no valid URL provided
 * - Loading skeleton while iframe loads
 * - Error fallback if iframe fails
 * - Accessible iframe title
 */
export function VideoPlayer({ url, className }: VideoPlayerProps) {
  const videoId = url ? getYouTubeId(url) : null;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!videoId) {
    return (
      <div
        className={cn(
          'aspect-video rounded-lg bg-muted border border-border',
          'flex items-center justify-center',
          className
        )}
      >
        <div className="text-center p-6">
          <Youtube className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No video available
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Add a YouTube URL to display a video tutorial.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'aspect-video rounded-lg bg-muted border border-border',
          'flex items-center justify-center',
          className
        )}
      >
        <div className="text-center p-6">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Video unavailable
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            The video could not be loaded. It may have been removed or is restricted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'aspect-video rounded-lg overflow-hidden border border-border bg-muted relative',
        className
      )}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <Youtube className="h-12 w-12 text-muted-foreground/30" />
        </div>
      )}
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={cn('w-full h-full', !isLoaded && 'opacity-0')}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

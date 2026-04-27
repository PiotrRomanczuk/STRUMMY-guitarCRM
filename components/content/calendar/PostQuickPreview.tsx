'use client';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { CalendarEntry } from './types';

interface Props {
  entry: CalendarEntry | null;
  onClose: () => void;
}

export default function PostQuickPreview({ entry, onClose }: Props) {
  return (
    <ResponsiveDialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{entry?.song?.title ?? 'Post'}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {entry && (
          <div className="space-y-3 px-1 pb-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{entry.platform}</Badge>
              <Badge>{entry.status}</Badge>
              {entry.scheduled_at && (
                <span className="text-muted-foreground">
                  {new Date(entry.scheduled_at).toLocaleString()}
                </span>
              )}
            </div>
            {entry.song && (
              <p className="text-xs text-muted-foreground">
                {entry.song.author ?? 'Unknown artist'}
              </p>
            )}
            {entry.hook && <p className="font-medium">{entry.hook}</p>}
            {entry.caption && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{entry.caption}</p>
            )}
            {(entry.views_count > 0 || entry.likes_count > 0) && (
              <p className="text-xs text-muted-foreground">
                {entry.views_count.toLocaleString()} views · {entry.likes_count} likes ·{' '}
                {entry.engagement_rate != null ? `${entry.engagement_rate.toFixed(2)}% eng.` : '—'}
              </p>
            )}
            {entry.song && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/songs/${entry.song.id}`}>Open song</Link>
              </Button>
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

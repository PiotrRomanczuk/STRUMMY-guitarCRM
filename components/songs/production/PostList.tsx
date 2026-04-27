'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { CalendarPlus, Pencil, Trash2, BarChart2 } from 'lucide-react';
import type { ContentPost, ContentPostStatus, ContentPlatform } from '@/types/ContentPost';
import { useContentPosts, useDeleteContentPost } from './hooks/useContentPosts';
import PostFormDialog from './PostFormDialog';
import PostMetricsForm from './PostMetricsForm';

const STATUS_TONE: Record<ContentPostStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  archived: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

const PLATFORM_LABEL: Record<ContentPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube_shorts: 'YT Shorts',
};

interface Props {
  songId: string;
}

export default function PostList({ songId }: Props) {
  const { data: posts = [], isLoading } = useContentPosts(songId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [metricsFor, setMetricsFor] = useState<ContentPost | null>(null);
  const [deleting, setDeleting] = useState<ContentPost | null>(null);
  const remove = useDeleteContentPost(songId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Posts ({posts.length})</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <CalendarPlus className="mr-1 h-4 w-4" />
          Schedule post
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && posts.length === 0 && (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          No posts scheduled yet.
        </div>
      )}

      {posts.length > 0 && (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className="rounded-md border border-border/60 bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{PLATFORM_LABEL[p.platform]}</Badge>
                  <Badge className={STATUS_TONE[p.status]}>{p.status}</Badge>
                  {p.scheduled_at && (
                    <span className="text-muted-foreground">
                      {new Date(p.scheduled_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMetricsFor(p)}
                    aria-label="Metrics"
                  >
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(p)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(p)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {p.hook && <p className="mt-2 text-sm font-medium">{p.hook}</p>}
              {p.caption && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.caption}</p>
              )}
              {(p.views_count > 0 || p.likes_count > 0) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.views_count.toLocaleString()} views · {p.likes_count} likes ·{' '}
                  {p.comments_count} cmts · {p.shares_count} shares · {p.saves_count} saves
                  {p.engagement_rate != null && (
                    <span className="ml-1">({p.engagement_rate.toFixed(2)}% eng.)</span>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <PostFormDialog
        songId={songId}
        open={showForm || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setShowForm(false);
            setEditing(null);
          }
        }}
        post={editing}
      />

      <ResponsiveDialog open={!!metricsFor} onOpenChange={(o) => !o && setMetricsFor(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Update metrics</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {metricsFor && (
            <PostMetricsForm
              songId={songId}
              post={metricsFor}
              onSaved={() => setMetricsFor(null)}
            />
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the calendar entry and its metric history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

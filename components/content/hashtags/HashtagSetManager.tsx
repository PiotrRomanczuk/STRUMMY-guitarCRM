'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
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
import HashtagSetForm from './HashtagSetForm';
import {
  useDeleteHashtagSet,
  useHashtagSets,
} from '@/components/songs/production/hooks/useHashtagSets';
import type { HashtagSet } from '@/types/HashtagSet';

export default function HashtagSetManager() {
  const { data: sets = [], isLoading } = useHashtagSets();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<HashtagSet | null>(null);
  const [deleting, setDeleting] = useState<HashtagSet | null>(null);
  const remove = useDeleteHashtagSet();

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Hashtag sets</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New set
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && sets.length === 0 && (
        <p className="rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No hashtag sets yet. Create CORE, SPECIFIC, or TRENDING bundles to mix into posts.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sets.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {s.name}
                  {!s.is_active && (
                    <Badge variant="outline" className="text-[10px]">
                      inactive
                    </Badge>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(s)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(s)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3 text-sm">
              {s.description && <p className="text-muted-foreground">{s.description}</p>}
              <p className="text-xs">{s.hashtags.join(' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResponsiveDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editing ? 'Edit hashtag set' : 'New hashtag set'}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <HashtagSetForm
            set={editing}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hashtag set?</AlertDialogTitle>
            <AlertDialogDescription>
              Posts that referenced this set will keep their other hashtag sets and extras.
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

'use client';

import Link from 'next/link';
import { Music, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { SelfRating } from './SelfRating';

const STATUS_STYLES: Record<string, string> = {
  mastered: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  with_author: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  remembered: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  started: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  to_learn: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  with_author: 'With Author',
  remembered: 'Remembered',
  started: 'Started',
  to_learn: 'To Learn',
};

interface DesktopRepertoireListProps {
  repertoire: StudentRepertoireWithSong[];
  userId: string;
  viewMode?: 'teacher' | 'student';
  onAddSong?: () => void;
}

export default function DesktopRepertoireList({
  repertoire,
  userId: _userId,
  viewMode = 'teacher',
  onAddSong,
}: DesktopRepertoireListProps) {
  return (
    <div className="px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {viewMode === 'student' ? 'My Repertoire' : 'Student Repertoire'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {repertoire.length} song{repertoire.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {viewMode === 'teacher' && onAddSong && (
          <Button onClick={onAddSong} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Song
          </Button>
        )}
      </div>

      {/* Table */}
      {repertoire.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No songs in repertoire.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Song
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Practiced
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {repertoire.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Music className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/songs/${item.song_id}`}
                          className="text-sm font-medium hover:text-primary transition-colors"
                        >
                          {item.song.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.song.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5',
                        'text-xs font-medium border',
                        STATUS_STYLES[item.current_status] ?? STATUS_STYLES.to_learn
                      )}
                    >
                      {STATUS_LABELS[item.current_status] ?? item.current_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                    {item.preferred_key || item.song.key || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <SelfRating
                      repertoireId={item.id}
                      currentRating={item.self_rating}
                      updatedAt={item.self_rating_updated_at}
                      isReadOnly={viewMode === 'teacher'}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {item.last_practiced_at
                      ? new Date(item.last_practiced_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

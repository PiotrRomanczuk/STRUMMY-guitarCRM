'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { StatusBadge } from '@/components/v2/primitives/StatusBadge';
import { REPERTOIRE_STATUS_STYLES, REPERTOIRE_STATUS_LABELS } from './repertoire.styles';
import { SelfRating } from './SelfRating';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';

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
      <ListPageHeader
        title={viewMode === 'student' ? 'My Repertoire' : 'Student Repertoire'}
        count={repertoire.length}
        countLabel={`song${repertoire.length !== 1 ? 's' : ''} total`}
        action={viewMode === 'teacher' && onAddSong ? { label: 'Add Song', onClick: onAddSong } : undefined}
      />

      {repertoire.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No songs in repertoire"
          message="Add songs to start tracking progress."
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-transparent">
                {['Song', 'Status', 'Key', 'Rating', 'Last Practiced'].map((h) => (
                  <TableHead key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {repertoire.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Music className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <Link href={`/dashboard/songs/${item.song_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {item.song.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.song.author}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={item.current_status}
                      styleMap={REPERTOIRE_STATUS_STYLES}
                      labelMap={REPERTOIRE_STATUS_LABELS}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {item.preferred_key || item.song.key || '-'}
                  </TableCell>
                  <TableCell>
                    <SelfRating
                      repertoireId={item.id}
                      currentRating={item.self_rating}
                      updatedAt={item.self_rating_updated_at}
                      isReadOnly={viewMode === 'teacher'}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.last_practiced_at
                      ? new Date(item.last_practiced_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

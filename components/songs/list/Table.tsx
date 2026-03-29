'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import DeleteConfirmationDialog from '../actions/DeleteConfirmationDialog';
import QuickAssignDialog from './QuickAssignDialog';
import type { Song, SongWithStatus } from '@/components/songs/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Music } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import SortableHeader from './Table.SortableHeader';
import { SongMobileCard, SongDesktopRow } from './Table.SongRow';
import { logger } from '@/lib/logger';

type SortField = 'title' | 'author' | 'level' | 'key' | 'updated_at';
type SortDirection = 'asc' | 'desc';

interface Props {
  songs: (Song | SongWithStatus)[];
  canDelete?: boolean;
  onDeleteSuccess?: (deletedSongId: string) => void;
  selectedStudentId?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (songIds: string[]) => void;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  sortBy?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

export default function SongListTable({
  songs,
  canDelete = false,
  onDeleteSuccess,
  selectedStudentId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected = false,
  isIndeterminate = false,
  sortBy = 'updated_at',
  sortDirection = 'desc',
  onSort,
}: Props) {
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [assignDialogSong, setAssignDialogSong] = useState<Song | null>(null);

  const handleDeleteClick = async (song: Song) => {
    setCheckingId(song.id);
    try {
      const supabase = getSupabaseBrowserClient();
      const { count, error } = await supabase
        .from('lesson_songs')
        .select('*', { count: 'exact', head: true })
        .eq('song_id', song.id);
      if (error) {
        logger.error('Error checking assignments:', error);
      }
      setAssignmentCount(count || 0);
      setSongToDelete(song);
    } catch (err) {
      logger.error('Unexpected error in handleDeleteClick:', err);
    } finally {
      setCheckingId(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;
    setDeletingSongId(songToDelete.id);
    setDeleteError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('soft_delete_song_with_cascade', {
        song_uuid: songToDelete.id,
        user_uuid: user.id,
      });
      if (error) {
        throw new Error(error.message);
      }
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete song');
      }
      const deletedId = songToDelete.id;
      setSongToDelete(null);
      setDeletingSongId(null);
      onDeleteSuccess?.(deletedId);
    } catch (error) {
      logger.error('Delete failed:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete song');
      setDeletingSongId(null);
    }
  };

  const handleCancelDelete = () => {
    setSongToDelete(null);
    setDeletingSongId(null);
    setDeleteError(null);
  };

  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const handleToggleExpand = (id: string) => setExpandedSongId((prev) => (prev === id ? null : id));
  const sharedRowProps = { canDelete, selectedStudentId, selectedIds, onToggleSelect, deletingSongId, checkingId, onDeleteClick: handleDeleteClick, onAssignClick: setAssignDialogSong, expandedSongId, onToggleExpand: handleToggleExpand };

  return (
    <>
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {songs.length === 0 ? (
          <div className="bg-card rounded-xl border border-border">
            <EmptyState variant="table-cell" icon={Music} title="No songs found" description="Add a song to get started" action={{ label: "Add Song", href: "/dashboard/songs/new" }} />
          </div>
        ) : (
          songs.map((song) => (
            <SongMobileCard key={song.id} song={song} {...sharedRowProps} />
          ))
        )}
      </div>

      {/* Desktop View (Table with Virtual Scrolling) */}
      <div className="hidden md:block relative">
        <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="song-table">
          {songs.length === 0 ? (
            <div className="p-8">
              <EmptyState variant="table-cell" icon={Music} title="No songs found" description="Add a song to get started" action={{ label: 'Add Song', href: '/dashboard/songs/new' }} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-b border-border">
                <div className="flex items-center min-w-[600px] px-0 py-2 text-sm text-muted-foreground">
                  {canDelete && onToggleSelectAll ? (
                    <div className="w-12 flex items-center justify-center">
                      <Checkbox
                        checked={isAllSelected || (isIndeterminate ? 'indeterminate' : false)}
                        onCheckedChange={() => onToggleSelectAll(songs.map((s) => s.id))}
                        aria-label="Select all songs"
                      />
                    </div>
                  ) : (
                    <div className="w-12" />
                  )}
                  <div className="flex-1 px-4">
                    <SortableHeader field="title" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Song</SortableHeader>
                  </div>
                  <div className="w-48 px-4">
                    <SortableHeader field="author" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Author</SortableHeader>
                  </div>
                  <div className="w-32 px-4">
                    <SortableHeader field="level" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>{selectedStudentId ? 'Status' : 'Level'}</SortableHeader>
                  </div>
                  <div className="w-20 px-4">
                    <SortableHeader field="key" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Key</SortableHeader>
                  </div>
                  <div className="w-24 px-4 text-right">{canDelete ? 'Actions' : ''}</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {songs.map((song) => (
                    <SongDesktopRow key={song.id} song={song} {...sharedRowProps} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {songToDelete && (
        <DeleteConfirmationDialog
          isOpen={true}
          songTitle={songToDelete.title ?? 'Untitled'}
          hasLessonAssignments={assignmentCount > 0}
          lessonCount={assignmentCount}
          onConfirm={handleConfirmDelete}
          onClose={handleCancelDelete}
          isDeleting={deletingSongId === songToDelete.id}
          error={deleteError}
        />
      )}

      {assignDialogSong && (
        <QuickAssignDialog
          isOpen={!!assignDialogSong}
          song={assignDialogSong}
          onClose={() => setAssignDialogSong(null)}
          onSuccess={() => { setAssignDialogSong(null); }}
        />
      )}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { SongPreviewPanel } from './SongList.PreviewPanel';
import { SongsTable } from './SongList.Table';
import { FilterBar } from './SongList.FilterBar';
import { useSongRecording } from './useSongRecording';
import { useSongListState } from './useSongList';
import type { SongListV2Props } from './SongList';

export default function SongListDesktop({ songs, isTeacher }: SongListV2Props) {
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const { resolveRecording, cycleRecording, overrides } = useSongRecording();
  const list = useSongListState({ songs, resolveRecording, overrides });

  const selectedSong = useMemo(
    () => (selectedSongId ? (songs.find((s) => s.id === selectedSongId) ?? null) : null),
    [songs, selectedSongId]
  );

  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      <ListPageHeader
        title="Songs"
        count={songs.length}
        countLabel={`song${songs.length !== 1 ? 's' : ''} in library`}
        action={isTeacher ? { label: 'New Song', href: '/dashboard/songs/new' } : undefined}
      />

      <FilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        categories={list.categories}
        categoryFilter={list.categoryFilter}
        onCategoryChange={list.setCategoryFilter}
        isTeacher={isTeacher}
        recordingFilter={list.recordingFilter}
        onRecordingFilterChange={list.setRecordingFilter}
        queueCount={list.queueCount}
        recordedCount={list.recordedCount}
      />

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <SongsTable
            songs={list.filtered}
            sortField={list.sortField}
            sortDir={list.sortDir}
            selectedSongId={selectedSongId}
            onSort={list.toggleSort}
            onSelect={setSelectedSongId}
            isTeacher={isTeacher}
            resolveRecording={resolveRecording}
            onCycleRecording={cycleRecording}
          />
        </div>
        <AnimatePresence>
          {selectedSong && (
            <motion.div
              key="panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="shrink-0 overflow-hidden hidden xl:block"
            >
              <div className="w-[380px]">
                <SongPreviewPanel song={selectedSong} onClose={() => setSelectedSongId(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

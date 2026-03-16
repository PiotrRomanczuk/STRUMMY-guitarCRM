'use client';

import { useState, useCallback } from 'react';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { RepertoireList } from './RepertoireList';
import { AddSongSheet } from './AddSongSheet';

interface RepertoirePageClientProps {
  repertoire: StudentRepertoireWithSong[];
  userId: string;
  viewMode: 'teacher' | 'student';
}

/**
 * Client wrapper that manages AddSongSheet open/close state
 * and passes the onAddSong callback to RepertoireList.
 */
export function RepertoirePageClient({
  repertoire,
  userId,
  viewMode,
}: RepertoirePageClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleAddSong = useCallback(() => {
    setSheetOpen(true);
  }, []);

  return (
    <>
      <RepertoireList
        repertoire={repertoire}
        userId={userId}
        viewMode={viewMode}
        onAddSong={viewMode === 'teacher' ? handleAddSong : undefined}
      />
      {viewMode === 'teacher' && (
        <AddSongSheet
          studentId={userId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  );
}

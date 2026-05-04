'use client';

import { useMemo, useState } from 'react';
import {
  RECORDING_FILTER_ALL,
  RECORDING_FILTER_QUEUED,
  deriveState,
  type RecordingFilter,
  type SortDir,
  type SortField,
} from './SongList.recording.helpers';
import type { UseSongRecording } from './useSongRecording';
import type { SongListV2Props } from './SongList';

type Songs = SongListV2Props['songs'];

interface Params {
  songs: Songs;
  resolveRecording: UseSongRecording['resolveRecording'];
  overrides: UseSongRecording['overrides'];
}

export function useSongListState({ songs, resolveRecording, overrides }: Params) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [recordingFilter, setRecordingFilter] = useState<RecordingFilter>(RECORDING_FILTER_ALL);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    songs.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return [...cats].sort().map((c) => ({ label: c, value: c }));
  }, [songs]);

  const filtered = useMemo(() => {
    let result = songs;
    if (recordingFilter !== RECORDING_FILTER_ALL) {
      result = result.filter((s) => {
        const r = resolveRecording(s.id, s.recording_queued_at, s.recorded_at);
        const state = deriveState(r.recordingQueuedAt, r.recordedAt);
        return recordingFilter === RECORDING_FILTER_QUEUED
          ? state === 'queued'
          : state === 'recorded';
      });
    }
    if (categoryFilter) result = result.filter((s) => s.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const valA = (a[sortField] ?? '').toString().toLowerCase();
      const valB = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    // resolveRecording closes over `overrides`, so we depend on it directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs, search, sortField, sortDir, categoryFilter, recordingFilter, overrides]);

  const { queueCount, recordedCount } = useMemo(() => {
    let q = 0;
    let r = 0;
    songs.forEach((s) => {
      const rec = resolveRecording(s.id, s.recording_queued_at, s.recorded_at);
      const state = deriveState(rec.recordingQueuedAt, rec.recordedAt);
      if (state === 'queued') q += 1;
      else if (state === 'recorded') r += 1;
    });
    return { queueCount: q, recordedCount: r };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs, overrides]);

  return {
    search,
    setSearch,
    sortField,
    sortDir,
    toggleSort,
    categoryFilter,
    setCategoryFilter,
    recordingFilter,
    setRecordingFilter,
    categories,
    filtered,
    queueCount,
    recordedCount,
  };
}

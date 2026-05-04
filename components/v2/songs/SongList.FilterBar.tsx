'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ALL_CATEGORIES_VALUE,
  RECORDING_FILTER_ALL,
  RECORDING_FILTER_QUEUED,
  RECORDING_FILTER_RECORDED,
  type RecordingFilter,
} from './SongList.recording.helpers';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: { label: string; value: string }[];
  categoryFilter: string | null;
  onCategoryChange: (value: string | null) => void;
  isTeacher: boolean;
  recordingFilter: RecordingFilter;
  onRecordingFilterChange: (value: RecordingFilter) => void;
  queueCount: number;
  recordedCount: number;
}

export function FilterBar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryChange,
  isTeacher,
  recordingFilter,
  onRecordingFilterChange,
  queueCount,
  recordedCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative max-w-sm flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card border-transparent focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {categories.length > 0 && (
        <Select
          value={categoryFilter ?? ALL_CATEGORIES_VALUE}
          onValueChange={(v) => onCategoryChange(v === ALL_CATEGORIES_VALUE ? null : v)}
        >
          <SelectTrigger className="w-[220px] bg-card border-transparent focus:ring-1 focus:ring-primary/30">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isTeacher && (
        <Select
          value={recordingFilter}
          onValueChange={(v) => onRecordingFilterChange(v as RecordingFilter)}
        >
          <SelectTrigger className="w-[220px] bg-card border-transparent focus:ring-1 focus:ring-primary/30">
            <SelectValue placeholder="Recording status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RECORDING_FILTER_ALL}>All recordings</SelectItem>
            <SelectItem value={RECORDING_FILTER_QUEUED}>To record ({queueCount})</SelectItem>
            <SelectItem value={RECORDING_FILTER_RECORDED}>
              Recorded already ({recordedCount})
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

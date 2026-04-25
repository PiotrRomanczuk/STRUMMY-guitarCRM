'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, ArrowUpDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChipMulti } from '@/components/v2/primitives/FilterChipMulti';
import { DesktopRow } from './LessonList.Row';
import type { LessonListV2Props } from './lesson.types';

const STATUS_FILTERS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

type SortOrder = 'newest' | 'oldest';

export default function LessonListDesktop({
  initialLessons,
  role,
  currentYear,
  onRefresh,
  isRefreshing,
  onYearChange,
}: LessonListV2Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  );
  const [sort, setSort] = useState<SortOrder>('newest');

  const filteredLessons = useMemo(() => {
    let lessons = statusFilter.size > 0
      ? initialLessons.filter((l) => statusFilter.has(l.status ?? 'SCHEDULED'))
      : initialLessons;

    lessons = [...lessons].sort((a, b) => {
      const dateA = new Date(a.scheduled_at ?? a.date ?? 0).getTime();
      const dateB = new Date(b.scheduled_at ?? b.date ?? 0).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return lessons;
  }, [initialLessons, statusFilter, sort]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of initialLessons) {
      const s = l.status ?? 'SCHEDULED';
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [initialLessons]);

  const canCreate = role === 'admin' || role === 'teacher';
  const showStudentColumn = role !== 'student';
  const showTeacherColumn = role === 'admin' || role === 'student';

  const handleCreate = useCallback(() => router.push('/dashboard/lessons/new'), [router]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-8 pt-7 pb-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              {role === 'student' ? 'Your lessons' : role === 'admin' ? 'All studio lessons' : 'Teaching'}
            </div>
            <h1 className="mt-1 font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">
              Lessons
            </h1>
            <div className="text-muted-foreground text-[13px] mt-1.5">
              {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'} · sorted by {sort === 'newest' ? 'newest first' : 'oldest first'}
            </div>
          </div>
          {canCreate && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/lessons/new?tab=recurring')}>
                <Copy className="h-3 w-3" /> Recurring...
              </Button>
              <Button size="sm" onClick={handleCreate}>
                New lesson
              </Button>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex gap-2.5 items-center p-3 bg-card border border-border rounded-[10px]">
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.12em] mr-1">Status</span>
          <FilterChipMulti
            filters={STATUS_FILTERS}
            active={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
          />
          <div className="w-px h-5 bg-border mx-1.5" />
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[.12em] mr-1">Year</span>
          <select
            value={currentYear}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-border bg-card text-muted-foreground text-xs font-sans cursor-pointer"
          >
            {[2026, 2025, 2024].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex-1" />
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="h-8 w-8">
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}>
            <ArrowUpDown className="h-3 w-3" />
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-10">
        {filteredLessons.length === 0 ? (
          <EmptyState icon={Calendar} title="No lessons found" message="Adjust filters or create a new lesson." />
        ) : (
          <motion.div variants={cardEntrance} initial="hidden" animate="visible">
            <div className="bg-card border border-border rounded-[10px] overflow-hidden">
              {/* Header row */}
              <div
                className={cn(
                  'grid gap-4 px-5 py-3 border-b border-border bg-muted/50',
                  'font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em]',
                  showStudentColumn && showTeacherColumn
                    ? 'grid-cols-[56px_2.3fr_1.3fr_1.3fr_1fr_110px_120px_40px]'
                    : showStudentColumn
                      ? 'grid-cols-[56px_2.3fr_1.3fr_1fr_110px_120px_40px]'
                      : 'grid-cols-[56px_2.3fr_1fr_110px_120px_40px]'
                )}
              >
                <span>Date</span>
                <span>Lesson</span>
                {showStudentColumn && <span>Student</span>}
                {showTeacherColumn && <span>Teacher</span>}
                <span>Songs</span>
                <span>Time</span>
                <span>Status</span>
                <span />
              </div>

              {filteredLessons.map((lesson, idx) => (
                <DesktopRow
                  key={lesson.id}
                  lesson={lesson}
                  showStudentColumn={showStudentColumn}
                  showTeacherColumn={showTeacherColumn}
                  isLast={idx === filteredLessons.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

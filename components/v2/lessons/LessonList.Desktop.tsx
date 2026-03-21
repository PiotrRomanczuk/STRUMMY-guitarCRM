'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { DesktopRow } from './LessonList.Row';
import { LESSON_STATUS_OPTIONS } from './lesson.types';
import type { LessonListV2Props } from './lesson.types';

export default function LessonListDesktop({
  initialLessons,
  role,
  onRefresh,
  isRefreshing,
}: LessonListV2Props) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredLessons = statusFilter
    ? initialLessons.filter((l) => l.status === statusFilter)
    : initialLessons;

  const canCreate = role === 'admin' || role === 'teacher';
  const showTeacherColumn = role === 'admin' || role === 'student';
  const showActions = role === 'admin' || role === 'teacher';

  const handleCreate = useCallback(
    () => router.push('/dashboard/lessons/new'),
    [router]
  );

  const refreshButton = onRefresh ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-label="Refresh lessons"
      className="text-muted-foreground hover:text-foreground hover:bg-muted"
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
    </Button>
  ) : null;

  return (
    <div className="px-8 py-8 space-y-6 max-w-7xl mx-auto">
      <ListPageHeader
        title="Lessons"
        count={filteredLessons.length}
        countLabel={`lesson${filteredLessons.length !== 1 ? 's' : ''}`}
        action={canCreate ? { label: 'New Lesson', onClick: handleCreate } : undefined}
        extraActions={refreshButton}
      />

      <CollapsibleFilterBar
        filters={LESSON_STATUS_OPTIONS.map((s) => ({
          label: s.label,
          value: s.value,
        }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {filteredLessons.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No lessons found"
          message="No lessons match the current filters."
        />
      ) : (
        <motion.div
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          className="bg-card rounded-xl overflow-hidden shadow-2xl shadow-black/20"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student</TableHead>
                  {showTeacherColumn && (
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Teacher</TableHead>
                  )}
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  {showActions && (
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <DesktopRow
                    key={lesson.id}
                    lesson={lesson}
                    showTeacherColumn={showTeacherColumn}
                    showActions={showActions}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

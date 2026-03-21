'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
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

  return (
    <div className="px-8 py-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Lessons
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh lessons"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Lesson
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <CollapsibleFilterBar
        filters={LESSON_STATUS_OPTIONS.map((s) => ({
          label: s.label,
          value: s.value,
        }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Table */}
      {filteredLessons.length === 0 ? (
        <DesktopEmpty />
      ) : (
        <motion.div
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Student</TableHead>
                  {showTeacherColumn && (
                    <TableHead className="text-muted-foreground">Teacher</TableHead>
                  )}
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  {showActions && (
                    <TableHead className="text-muted-foreground">Actions</TableHead>
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

function DesktopEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">No lessons match the current filters.</p>
    </div>
  );
}

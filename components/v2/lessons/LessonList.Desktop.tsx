'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardEntrance } from '@/lib/animations/variants';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { formatLessonDate, formatLessonTime, getLessonStatusStyle, getLessonStatusLabel } from './lesson.helpers';
import { LESSON_STATUS_OPTIONS } from './lesson.types';
import type { LessonListV2Props } from './lesson.types';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

export default function LessonListDesktop({
  initialLessons,
  role,
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
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Lesson
          </Button>
        )}
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

function DesktopRow({
  lesson,
  showTeacherColumn,
  showActions,
}: {
  lesson: LessonWithProfiles;
  showTeacherColumn: boolean;
  showActions: boolean;
}) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <TableRow className="hover:bg-muted/50 transition-colors border-border">
      <TableCell>
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {lesson.title || 'Untitled Lesson'}
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {lesson.profile?.full_name || lesson.profile?.email || 'Unknown'}
      </TableCell>
      {showTeacherColumn && (
        <TableCell className="text-sm text-muted-foreground">
          {lesson.teacher_profile?.full_name ||
            lesson.teacher_profile?.email ||
            'Unknown'}
        </TableCell>
      )}
      <TableCell className="text-sm text-muted-foreground">
        {formatLessonDate(displayDate)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatLessonTime(displayTime)}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5',
            'text-xs font-medium border',
            getLessonStatusStyle(lesson.status)
          )}
        >
          {getLessonStatusLabel(lesson.status)}
        </span>
      </TableCell>
      {showActions && (
        <TableCell>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/lessons/${lesson.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/lessons/${lesson.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

function DesktopEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">No lessons match the current filters.</p>
    </div>
  );
}

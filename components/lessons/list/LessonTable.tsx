'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { LessonWithProfiles } from '@/schemas/LessonSchema';
import LessonTableRow from './LessonTable.Row';
import LessonTableEmpty from './LessonTable.Empty';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getStatusColor } from './LessonTable.helpers';
import { staggerContainer, listItem, cardEntrance } from '@/lib/animations';

interface Props {
  lessons: LessonWithProfiles[];
  role: 'admin' | 'teacher' | 'student';
  baseUrl?: string; // e.g., '/dashboard/lessons', '/teacher/lessons', '/student/lessons'
  onDeleteSuccess?: (deletedId: string) => void;
}

export default function LessonTable({
  lessons,
  role,
  baseUrl = '/dashboard/lessons',
  onDeleteSuccess: _onDeleteSuccess,
}: Props) {
  // Show actions column for admin and teacher only
  const showActions = role === 'admin' || role === 'teacher';

  // Show teacher column for admin and student (not for teacher viewing their own lessons)
  const showTeacherColumn = role === 'admin' || role === 'student';

  if (lessons.length === 0) {
    return <LessonTableEmpty role={role} />;
  }

  return (
    <>
      {/* Mobile View (Cards) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="md:hidden space-y-4 portrait:space-y-5"
      >
        <AnimatePresence mode="popLayout">
          {lessons.map((lesson) => {
            // Use date if available, otherwise fall back to scheduled_at
            const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
            const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

            return (
              <motion.div
                key={lesson.id}
                variants={listItem}
                layout
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-card rounded-xl border border-border p-6 space-y-3 min-h-[120px]"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`${baseUrl}/${lesson.id}`}
                      className="font-medium text-foreground hover:text-primary block truncate text-base"
                    >
                      {lesson.title || 'Untitled Lesson'}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(displayDate)} at {formatTime(displayTime)}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-medium flex-shrink-0 ${getStatusColor(lesson.status)}`}
                  >
                    {lesson.status || 'SCHEDULED'}
                  </Badge>
                </div>

                <div className="text-sm space-y-1 pt-2 border-t border-border">
                  <p className="truncate">
                    <span className="text-muted-foreground">Student: </span>
                    {lesson.profile
                      ? lesson.profile.full_name || lesson.profile.email
                      : 'Unknown Student'}
                  </p>
                  {showTeacherColumn && (
                    <p className="truncate">
                      <span className="text-muted-foreground">Teacher: </span>
                      {lesson.teacher_profile
                        ? lesson.teacher_profile.full_name || lesson.teacher_profile.email
                        : 'Unknown Teacher'}
                    </p>
                  )}
                </div>

                {showActions && (
                  <div className="pt-2 flex justify-end">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm" className="h-11" asChild>
                        <Link href={`${baseUrl}/${lesson.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Desktop View (Table) */}
      <motion.div
        variants={cardEntrance}
        initial="hidden"
        animate="visible"
        className="hidden md:block bg-card rounded-xl border border-border overflow-hidden"
        data-testid="lesson-table"
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
                {showActions && <TableHead className="text-muted-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <LessonTableRow
                  key={lesson.id}
                  lesson={lesson}
                  showTeacherColumn={showTeacherColumn}
                  showActions={showActions}
                  baseUrl={baseUrl}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </>
  );
}

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Users, User, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';
import { getHealthStatusColor, HealthStatus } from '@/lib/utils/studentHealth';
import { formatDistanceToNow } from 'date-fns';

export interface StudentHealth {
  id: string;
  name: string;
  email: string;
  healthScore: number;
  healthStatus: HealthStatus;
  lastLesson: Date | null;
  lessonsThisMonth: number;
  overdueAssignments: number;
  recommendedAction: string;
}

interface StudentHealthTableProps {
  students: StudentHealth[];
  onSendMessage?: (studentId: string) => void;
}

export function StudentHealthTable({ students, onSendMessage }: StudentHealthTableProps) {
  if (students.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={Users}
        title="No student data available"
        description="Student health data will appear here once lessons are scheduled"
      />
    );
  }

  return (
    <>
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {students.map((student) => {
          const healthColors = getHealthStatusColor(student.healthStatus);
          return (
            <div key={student.id} className="bg-card rounded-xl border border-border p-4 space-y-4">
              {/* Student Info & Health Score */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/users/${student.id}`}
                    className="block font-medium text-foreground truncate hover:underline"
                  >
                    {student.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xl">{healthColors.emoji}</span>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${healthColors.text}`}>
                      {student.healthScore}
                    </div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      {student.healthStatus.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {student.lastLesson
                    ? formatDistanceToNow(new Date(student.lastLesson), { addSuffix: true })
                    : 'Never'}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {student.lessonsThisMonth} this month
                </span>
              </div>

              {/* Overdue & Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div>
                  {student.overdueAssignments > 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      {student.overdueAssignments} overdue
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No overdue assignments</span>
                  )}
                </div>

                <div className="flex gap-1">
                  <Link href={`/dashboard/lessons?student=${student.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Schedule Lesson">
                      <Calendar className="h-4 w-4" />
                      <span className="sr-only">Schedule Lesson</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Send Message"
                    onClick={() => onSendMessage?.(student.id)}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">Send Message</span>
                  </Button>
                  <Link href={`/dashboard/users/${student.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View Profile">
                      <User className="h-4 w-4" />
                      <span className="sr-only">View Profile</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Last Lesson</TableHead>
              <TableHead>Lessons/Month</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const healthColors = getHealthStatusColor(student.healthStatus);
              return (
                <TableRow key={student.id} className="relative hover:bg-muted/50 transition-colors">
                  <TableCell className="relative font-medium">
                    <Link
                      href={`/dashboard/users/${student.id}`}
                      className="absolute inset-0 z-0"
                      aria-label={`View ${student.name}`}
                    />
                    <div>
                      <div className="text-foreground">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{healthColors.emoji}</span>
                      <div>
                        <div className={`font-bold ${healthColors.text}`}>
                          {student.healthScore}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {student.healthStatus.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.lastLesson ? (
                      <div className="text-sm text-foreground">
                        {formatDistanceToNow(new Date(student.lastLesson), { addSuffix: true })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{student.lessonsThisMonth}</TableCell>
                  <TableCell>
                    {student.overdueAssignments > 0 ? (
                      <Badge variant="destructive">{student.overdueAssignments}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="relative z-10 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/lessons?student=${student.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Schedule Lesson"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Send Message"
                        onClick={() => onSendMessage?.(student.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Link href={`/dashboard/users/${student.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View Profile"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { BookOpen, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TheoryCourse } from './theory.types';

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface CourseListDesktopProps {
  courses: TheoryCourse[];
  isStaff: boolean;
}

export default function CourseListDesktop({ courses, isStaff }: CourseListDesktopProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-8 pt-7 pb-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              Learning
            </div>
            <h1 className="mt-1 font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">
              Theory
            </h1>
            <div className="text-muted-foreground text-[13px] mt-1.5">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
            </div>
          </div>
          {isStaff && (
            <Button size="sm" asChild>
              <Link href="/dashboard/theory/new">New course</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 pb-10">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-serif text-base italic text-muted-foreground max-w-xs">
              {isStaff
                ? 'Create your first theory course for students.'
                : 'No courses available yet. Check back soon!'}
            </p>
            {isStaff && (
              <Button size="sm" className="mt-4" asChild>
                <Link href="/dashboard/theory/new">New course</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/theory/${course.id}`}
                className="group bg-card rounded-[10px] border border-border p-5 space-y-3
                           hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground font-medium">
                      {course.level}
                    </div>
                    <h3 className="font-serif text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5',
                        'text-[10px] font-medium border',
                        LEVEL_STYLES[course.level] ?? 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {course.level}
                    </span>
                    {isStaff && (
                      course.is_published
                        ? <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em]">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {course.lesson_count} {course.lesson_count === 1 ? 'chapter' : 'chapters'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

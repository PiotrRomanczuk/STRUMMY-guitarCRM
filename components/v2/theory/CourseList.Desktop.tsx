'use client';

import Link from 'next/link';
import { BookOpen, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
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
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      <ListPageHeader
        title="Theory Courses"
        subtitle="Structured lessons on music theory and guitar fundamentals"
        action={isStaff ? { label: 'New Course', href: '/dashboard/theory/new' } : undefined}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          message={isStaff
            ? 'Create your first theory course for students.'
            : 'No courses available yet. Check back soon!'}
          actionLabel={isStaff ? 'New Course' : undefined}
          actionHref={isStaff ? '/dashboard/theory/new' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/theory/${course.id}`}
              className="group bg-card rounded-xl border border-border p-5 space-y-3
                         hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5',
                      'text-xs font-medium border',
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

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>
                  {course.lesson_count} {course.lesson_count === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

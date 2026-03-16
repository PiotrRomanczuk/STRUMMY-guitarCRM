'use client';

import Link from 'next/link';
import { BookOpen, Eye, EyeOff, GraduationCap, Plus } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Theory Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured lessons on music theory and guitar fundamentals
          </p>
        </div>
        {isStaff && (
          <Link href="/dashboard/theory/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">No courses yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {isStaff
              ? 'Create your first theory course for students.'
              : 'No courses available yet. Check back soon!'}
          </p>
          {isStaff && (
            <Link href="/dashboard/theory/new">
              <Button size="sm">Create Course</Button>
            </Link>
          )}
        </div>
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

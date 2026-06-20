import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Edit, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { TheoryCourseAccessManager } from '@/components/theory';
import { getTheoryCourse, getCourseAccess, getStudentsList } from '@/app/dashboard/theory/actions';

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

type Lesson = {
  id: string;
  title: string;
  excerpt: string | null;
  is_published: boolean;
  sort_order: number;
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, { isAdmin, isTeacher }] = await Promise.all([
    getTheoryCourse(courseId),
    getUserWithRolesSSR(),
  ]);

  if (!course) notFound();

  const isStaff = isAdmin || isTeacher;
  const [accessList, students] = isStaff
    ? await Promise.all([getCourseAccess(courseId), getStudentsList()])
    : [[], []];

  const lessons = (course.lessons ?? []) as Lesson[];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <Link href="/dashboard/theory" className="text-sm text-muted-foreground hover:underline">
        ← Theory
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
              LEVEL_STYLES[course.level] ?? 'bg-muted text-muted-foreground border-border'
            )}
          >
            {course.level}
          </span>
          <h1 className="font-serif text-3xl">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground text-sm">{course.description}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {lessons.length} {lessons.length === 1 ? 'chapter' : 'chapters'}
            </span>
            {isStaff &&
              (course.is_published ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Eye className="h-3.5 w-3.5" /> Published
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" /> Draft
                </span>
              ))}
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 shrink-0 pt-6">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/theory/${courseId}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/dashboard/theory/${courseId}/new`}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Chapter
              </Link>
            </Button>
          </div>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed">
          <p className="text-muted-foreground text-sm italic">No chapters yet.</p>
          {isStaff && (
            <Button size="sm" className="mt-3" asChild>
              <Link href={`/dashboard/theory/${courseId}/new`}>Add first chapter</Link>
            </Button>
          )}
        </div>
      ) : (
        <ol className="space-y-2">
          {lessons.map((lesson, i) => (
            <li key={lesson.id}>
              <Link
                href={`/dashboard/theory/${courseId}/${lesson.id}`}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card
                           hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <span className="font-mono text-sm text-muted-foreground pt-px w-6 shrink-0 text-right">
                  {i + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {lesson.title}
                  </p>
                  {lesson.excerpt && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {lesson.excerpt}
                    </p>
                  )}
                </div>
                {isStaff && !lesson.is_published && (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}

      {isStaff && (
        <TheoryCourseAccessManager
          courseId={courseId}
          accessList={accessList}
          students={students}
        />
      )}
    </div>
  );
}

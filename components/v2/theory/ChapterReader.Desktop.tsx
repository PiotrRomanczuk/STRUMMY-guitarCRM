'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import type { ChapterNav } from './theory.types';

interface ChapterReaderDesktopProps {
  courseId: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
  };
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export default function ChapterReaderDesktop({
  courseId,
  courseTitle,
  lesson,
  prevChapter,
  nextChapter,
}: ChapterReaderDesktopProps) {
  return (
    <article className="max-w-3xl mx-auto px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/dashboard/theory" className="hover:underline">
          Theory
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/theory/${courseId}`} className="hover:underline">
          {courseTitle}
        </Link>
      </nav>

      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">{lesson.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated {new Date(lesson.updated_at).toLocaleDateString()}
      </p>

      {/* Content */}
      <div className="prose dark:prose-invert prose-headings:font-semibold prose-a:text-primary max-w-none">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </div>

      {/* Chapter navigation */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
        {prevChapter ? (
          <Link href={`/dashboard/theory/${courseId}/${prevChapter.id}`}>
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {prevChapter.title}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextChapter ? (
          <Link href={`/dashboard/theory/${courseId}/${nextChapter.id}`}>
            <Button variant="outline" className="gap-2">
              {nextChapter.title}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </article>
  );
}
